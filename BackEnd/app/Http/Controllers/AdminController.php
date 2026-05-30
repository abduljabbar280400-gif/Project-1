<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Http\Resources\PayoutResource;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;
use App\Models\Order;
use App\Models\Payout;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Get all restaurants.
     */
    public function getRestaurants(Request $request)
    {
        $restaurants = Restaurant::with('user')->orderBy('name', 'asc')->get();
        return RestaurantResource::collection($restaurants);
    }

    /**
     * Toggle restaurant active state (is_active).
     */
    public function toggleRestaurantActive(Request $request, $restaurantId)
    {
        $restaurant = Restaurant::find($restaurantId);

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found.'], 404);
        }

        $restaurant->is_active = !$restaurant->is_active;
        $restaurant->save();

        return response()->json([
            'message' => "Restaurant active status updated successfully.",
            'restaurant' => new RestaurantResource($restaurant)
        ]);
    }

    /**
     * Get all orders system-wide.
     */
    public function getOrders(Request $request)
    {
        $orders = Order::with(['customer', 'restaurant', 'deliveryProfile.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return OrderResource::collection($orders);
    }

    /**
     * Get all pending payouts.
     */
    public function getPendingPayouts(Request $request)
    {
        $payouts = Payout::with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return PayoutResource::collection($payouts);
    }

    /**
     * Approve and process a payout.
     */
    public function processPayout(Request $request, $payoutId)
    {
        $payout = Payout::with('user')->find($payoutId);

        if (!$payout) {
            return response()->json(['message' => 'Payout request not found.'], 404);
        }

        if ($payout->status !== 'pending') {
            return response()->json(['message' => 'This payout has already been processed.'], 400);
        }

        $payout->status = 'processed';
        $payout->save();

        return response()->json([
            'message' => 'Payout processed and marked completed successfully.',
            'payout' => new PayoutResource($payout)
        ]);
    }
}
