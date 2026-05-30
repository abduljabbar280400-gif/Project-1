<?php

namespace App\Http\Controllers;

use App\Http\Resources\MenuItemResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PayoutResource;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Payout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChefController extends Controller
{
    /**
     * Get Chef's restaurant profile.
     */
    public function getProfile(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant profile not found.'], 404);
        }
        return response()->json(['restaurant' => $restaurant]);
    }

    /**
     * Update Chef's restaurant profile.
     */
    public function updateProfile(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant profile not found.'], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'door_no' => 'required|string|max:255',
            'street' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'landmark' => 'nullable|string|max:255',
            'pincode' => 'required|string|max:20',
            'city' => 'required|string|max:255',
            'cuisine_type' => 'nullable|string|max:255',
            'banner_image' => 'nullable|string|url',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        // Synthesize address for backward compatibility
        $address = "{$request->door_no}, {$request->street}, {$request->area}";
        if ($request->landmark) {
            $address .= ", Near {$request->landmark}";
        }
        $address .= ", {$request->city} - {$request->pincode}";

        $restaurant->update([
            'name' => $request->name,
            'description' => $request->description,
            'door_no' => $request->door_no,
            'street' => $request->street,
            'area' => $request->area,
            'landmark' => $request->landmark,
            'pincode' => $request->pincode,
            'city' => $request->city,
            'address' => $address,
            'cuisine_type' => $request->cuisine_type,
            'banner_image' => $request->banner_image,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return response()->json([
            'message' => 'Restaurant profile updated successfully.',
            'restaurant' => $restaurant
        ]);
    }

    /**
     * Toggle restaurant operating status (is_open).
     */
    public function toggleOpenStatus(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant profile not found.'], 404);
        }

        $restaurant->is_open = !$restaurant->is_open;
        $restaurant->save();

        return response()->json([
            'message' => 'Restaurant operating status updated successfully.',
            'is_open' => $restaurant->is_open
        ]);
    }

    /**
     * Get Chef's active order queue (pending, accepted, preparing, ready).
     */
    public function getActiveOrders(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant profile not found.'], 404);
        }

        $orders = Order::with(['customer', 'deliveryProfile.user', 'orderItems.menuItem'])
            ->where('restaurant_id', $restaurant->id)
            ->whereIn('status', ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'])
            ->orderBy('created_at', 'desc')
            ->get();

        return OrderResource::collection($orders);
    }

    /**
     * Handle order state transition (accept, prepare, ready, reject).
     */
    public function updateOrderStatus(Request $request, $orderId)
    {
        $restaurant = $request->user()->restaurant;
        $order = Order::where('id', $orderId)->where('restaurant_id', $restaurant->id)->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        $request->validate([
            'action' => 'required|string|in:accept,prepare,ready,reject',
            'rejection_reason' => 'nullable|string|required_if:action,reject',
        ]);

        $action = $request->action;

        if ($action === 'accept') {
            if ($order->status !== 'pending') {
                return response()->json(['message' => 'Order cannot be accepted at its current status.'], 400);
            }
            $order->status = 'accepted';
            $order->accepted_at = now();
        } elseif ($action === 'prepare') {
            if ($order->status !== 'accepted') {
                return response()->json(['message' => 'Order must be accepted before preparation.'], 400);
            }
            $order->status = 'preparing';
        } elseif ($action === 'ready') {
            if ($order->status !== 'preparing') {
                return response()->json(['message' => 'Order must be preparing before marking ready.'], 400);
            }
            $order->status = 'ready';
            $order->prepared_at = now();
        } elseif ($action === 'reject') {
            if ($order->status !== 'pending') {
                return response()->json(['message' => 'Only pending orders can be rejected.'], 400);
            }
            $order->status = 'rejected';
            $order->rejection_reason = $request->rejection_reason;
            $order->cancelled_at = now();
        }

        $order->save();

        return response()->json([
            'message' => "Order status updated to '{$order->status}' successfully.",
            'order' => new OrderResource($order->load(['customer', 'deliveryProfile.user', 'orderItems.menuItem']))
        ]);
    }

    /**
     * Get menu items.
     */
    public function getMenuItems(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant profile not found.'], 404);
        }

        return MenuItemResource::collection($restaurant->menuItems);
    }

    /**
     * Create menu item.
     */
    public function storeMenuItem(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant profile not found.'], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|string|url',
            'category' => 'required|string|max:255',
        ]);

        $item = MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'image' => $request->image,
            'category' => $request->category,
            'is_available' => true,
        ]);

        return response()->json([
            'message' => 'Menu item created successfully.',
            'item' => new MenuItemResource($item)
        ], 201);
    }

    /**
     * Update menu item.
     */
    public function updateMenuItem(Request $request, $itemId)
    {
        $restaurant = $request->user()->restaurant;
        $item = MenuItem::where('id', $itemId)->where('restaurant_id', $restaurant->id)->first();

        if (!$item) {
            return response()->json(['message' => 'Menu item not found.'], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|string|url',
            'category' => 'required|string|max:255',
            'is_available' => 'required|boolean',
        ]);

        $item->update($request->only('name', 'description', 'price', 'image', 'category', 'is_available'));

        return response()->json([
            'message' => 'Menu item updated successfully.',
            'item' => new MenuItemResource($item)
        ]);
    }

    /**
     * Delete menu item.
     */
    public function destroyMenuItem(Request $request, $itemId)
    {
        $restaurant = $request->user()->restaurant;
        $item = MenuItem::where('id', $itemId)->where('restaurant_id', $restaurant->id)->first();

        if (!$item) {
            return response()->json(['message' => 'Menu item not found.'], 404);
        }

        $item->delete();

        return response()->json(['message' => 'Menu item deleted successfully.']);
    }

    /**
     * Get Chef payouts & balances.
     */
    public function getPayouts(Request $request)
    {
        $user = $request->user();
        $restaurant = $user->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant profile not found.'], 404);
        }

        $payouts = Payout::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        
        $pastOrders = Order::where('restaurant_id', $restaurant->id)
            ->where('status', 'delivered')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'earnings_balance' => (float) $restaurant->earnings_balance,
            'payouts' => PayoutResource::collection($payouts),
            'completed_orders' => OrderResource::collection($pastOrders),
        ]);
    }

    /**
     * Request payout of Chef's earnings balance.
     */
    public function requestPayout(Request $request)
    {
        $user = $request->user();
        $restaurant = $user->restaurant;

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant profile not found.'], 404);
        }

        $request->validate([
            'amount' => 'required|numeric|min:1',
            'bank_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
        ]);

        $amount = (float) $request->amount;

        if ($amount > (float) $restaurant->earnings_balance) {
            return response()->json(['message' => 'Insufficient earnings balance for this payout request.'], 400);
        }

        DB::transaction(function () use ($user, $restaurant, $amount, $request) {
            // Deduct from chef's balance
            $restaurant->earnings_balance -= $amount;
            $restaurant->save();

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
            'earnings_balance' => (float) $restaurant->earnings_balance,
        ]);
    }
}
