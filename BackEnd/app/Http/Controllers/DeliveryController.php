<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Http\Resources\PayoutResource;
use App\Models\Order;
use App\Models\Payout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeliveryController extends Controller
{
    /**
     * Get Driver's profile.
     */
    public function getProfile(Request $request)
    {
        $profile = $request->user()->deliveryProfile;
        if (!$profile) {
            return response()->json(['message' => 'Delivery profile not found.'], 404);
        }
        return response()->json(['profile' => $profile]);
    }

    /**
     * Update Driver's profile.
     */
    public function updateProfile(Request $request)
    {
        $profile = $request->user()->deliveryProfile;
        if (!$profile) {
            return response()->json(['message' => 'Delivery profile not found.'], 404);
        }

        $request->validate([
            'vehicle_type' => 'required|string|in:bike,car,scooter',
            'licence_number' => 'required|string|max:255',
        ]);

        $profile->update($request->only('vehicle_type', 'licence_number'));

        return response()->json([
            'message' => 'Delivery profile updated successfully.',
            'profile' => $profile
        ]);
    }

    /**
     * Toggle availability status.
     */
    public function toggleAvailability(Request $request)
    {
        $profile = $request->user()->deliveryProfile;
        if (!$profile) {
            return response()->json(['message' => 'Delivery profile not found.'], 404);
        }

        $profile->is_available = !$profile->is_available;
        $profile->save();

        return response()->json([
            'message' => 'Availability status updated successfully.',
            'is_available' => $profile->is_available
        ]);
    }

    /**
     * Get available jobs (orders in 'ready' state).
     */
    public function getAvailableJobs(Request $request)
    {
        $orders = Order::with(['customer', 'restaurant', 'orderItems.menuItem'])
            ->where('status', 'ready')
            ->whereNull('delivery_profile_id')
            ->orderBy('created_at', 'asc')
            ->get();

        return OrderResource::collection($orders);
    }

    /**
     * Get current assigned active deliveries for this driver.
     */
    public function getActiveDeliveries(Request $request)
    {
        $profile = $request->user()->deliveryProfile;
        if (!$profile) {
            return response()->json(['message' => 'Delivery profile not found.'], 404);
        }

        $orders = Order::with(['customer', 'restaurant', 'orderItems.menuItem'])
            ->where('delivery_profile_id', $profile->id)
            ->whereIn('status', ['accepted', 'preparing', 'ready', 'out_for_delivery'])
            ->orderBy('created_at', 'desc')
            ->get();

        return OrderResource::collection($orders);
    }

    /**
     * Accept a delivery job.
     */
    public function acceptJob(Request $request, $orderId)
    {
        $profile = $request->user()->deliveryProfile;
        if (!$profile) {
            return response()->json(['message' => 'Delivery profile not found.'], 404);
        }

        $order = Order::where('id', $orderId)->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        if ($order->status !== 'ready') {
            return response()->json(['message' => 'Order is not ready for pickup.'], 400);
        }

        if ($order->delivery_profile_id !== null) {
            return response()->json(['message' => 'Order already accepted by another driver.'], 400);
        }

        $order->delivery_profile_id = $profile->id;
        $order->save();

        return response()->json([
            'message' => 'Job accepted successfully. Proceed to pickup.',
            'order' => new OrderResource($order->load(['customer', 'restaurant', 'orderItems.menuItem']))
        ]);
    }

    /**
     * Confirm pickup (marks order out_for_delivery).
     */
    public function confirmPickup(Request $request, $orderId)
    {
        $profile = $request->user()->deliveryProfile;
        if (!$profile) {
            return response()->json(['message' => 'Delivery profile not found.'], 404);
        }

        $order = Order::where('id', $orderId)->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        // Allow assigning driver either when marking ready or picking up
        if ($order->status !== 'ready') {
            return response()->json(['message' => 'Order is not ready for pickup.'], 400);
        }

        if ($order->delivery_profile_id !== null && $order->delivery_profile_id !== $profile->id) {
            return response()->json(['message' => 'Order assigned to another driver.'], 403);
        }

        $order->delivery_profile_id = $profile->id;
        $order->status = 'out_for_delivery';
        $order->picked_up_at = now();
        $order->save();

        return response()->json([
            'message' => 'Order pickup confirmed. Out for delivery.',
            'order' => new OrderResource($order->load(['customer', 'restaurant', 'orderItems.menuItem']))
        ]);
    }

    /**
     * Confirm delivery (marks order delivered and executes financial settlements).
     */
    public function confirmDelivery(Request $request, $orderId)
    {
        $profile = $request->user()->deliveryProfile;
        if (!$profile) {
            return response()->json(['message' => 'Delivery profile not found.'], 404);
        }

        $order = Order::where('id', $orderId)
            ->where('delivery_profile_id', $profile->id)
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not assigned to you.'], 404);
        }

        if ($order->status !== 'out_for_delivery') {
            return response()->json(['message' => 'Order is not out for delivery.'], 400);
        }

        $request->validate([
            'pin' => 'required|string|size:4'
        ]);

        if ($order->delivery_pin !== $request->pin) {
            return response()->json(['message' => 'Invalid delivery PIN. Please ask the customer for the correct 4-digit PIN.'], 400);
        }

        // Settles Chef and Driver earnings safely in database transaction
        DB::transaction(function () use ($order, $profile) {
            $order->status = 'delivered';
            $order->delivered_at = now();
            $order->save();

            // Calculate settlements
            // Chef earnings = subtotal - commission
            $chefEarnings = (float) $order->subtotal - (float) $order->commission_amount;
            $restaurant = $order->restaurant;
            $restaurant->earnings_balance += $chefEarnings;
            $restaurant->save();

            // Driver earnings = delivery_fee
            $driverEarnings = (float) $order->delivery_fee;
            $profile->earnings_balance += $driverEarnings;
            $profile->save();
        });

        return response()->json([
            'message' => 'Delivery completed successfully! Balances have been credited.',
            'order' => new OrderResource($order->load(['customer', 'restaurant', 'orderItems.menuItem']))
        ]);
    }

    /**
     * Get Driver payouts & balances.
     */
    public function getPayouts(Request $request)
    {
        $user = $request->user();
        $profile = $user->deliveryProfile;

        if (!$profile) {
            return response()->json(['message' => 'Delivery profile not found.'], 404);
        }

        $payouts = Payout::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        
        $pastDeliveries = Order::where('delivery_profile_id', $profile->id)
            ->where('status', 'delivered')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'earnings_balance' => (float) $profile->earnings_balance,
            'payouts' => PayoutResource::collection($payouts),
            'completed_deliveries' => OrderResource::collection($pastDeliveries),
        ]);
    }

    /**
     * Request payout of Driver's earnings balance.
     */
    public function requestPayout(Request $request)
    {
        $user = $request->user();
        $profile = $user->deliveryProfile;

        if (!$profile) {
            return response()->json(['message' => 'Delivery profile not found.'], 404);
        }

        $request->validate([
            'amount' => 'required|numeric|min:1',
            'bank_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
        ]);

        $amount = (float) $request->amount;

        if ($amount > (float) $profile->earnings_balance) {
            return response()->json(['message' => 'Insufficient earnings balance for this payout request.'], 400);
        }

        DB::transaction(function () use ($user, $profile, $amount, $request) {
            // Deduct from driver's balance
            $profile->earnings_balance -= $amount;
            $profile->save();

            // Create payout record
            Payout::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'bank_name' => $request->bank_name,
                'account_number' => $request->account_number,
                'account_name' => $request->account_name,
                'status' => 'pending',
            ]);
        });

        return response()->json([
            'message' => 'Payout requested successfully. Your balance has been updated.',
            'earnings_balance' => (float) $profile->earnings_balance,
        ]);
    }
}
