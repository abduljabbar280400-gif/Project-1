<?php

namespace App\Http\Controllers;

use App\Http\Resources\RestaurantResource;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\OrderResource;
use App\Models\Restaurant;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * List all active restaurants.
     */
    public function getRestaurants(Request $request)
    {
        $restaurants = Restaurant::where('is_active', true)
            ->orderBy('is_open', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        return RestaurantResource::collection($restaurants);
    }

    /**
     * Get a specific restaurant menu.
     */
    public function getRestaurantMenu(Request $request, $restaurantId)
    {
        $restaurant = Restaurant::where('id', $restaurantId)->where('is_active', true)->first();

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found.'], 404);
        }

        // Return menu items
        $menuItems = MenuItem::where('restaurant_id', $restaurantId)
            ->where('is_available', true)
            ->get();

        return response()->json([
            'restaurant' => new RestaurantResource($restaurant),
            'menu_items' => MenuItemResource::collection($menuItems),
        ]);
    }

    /**
     * Place a new order.
     */
    public function placeOrder(Request $request)
    {
        $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',
            'delivery_address' => 'required|string',
            'special_instructions' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'dropoff_latitude' => 'nullable|numeric',
            'dropoff_longitude' => 'nullable|numeric',
        ]);

        $restaurant = Restaurant::find($request->restaurant_id);

        if (!$restaurant->is_active) {
            return response()->json(['message' => 'This restaurant is currently suspended.'], 400);
        }

        if (!$restaurant->is_open) {
            return response()->json(['message' => 'This restaurant is currently closed and not accepting orders.'], 400);
        }

        // Get global platform configs from environment or defaults
        $globalCommissionRate = (float) env('PLATFORM_COMMISSION_RATE', 10.0); // 10%
        $globalServiceFee = (float) env('PLATFORM_SERVICE_FEE', 1.50);
        $globalDeliveryFee = (float) env('PLATFORM_DELIVERY_FEE', 3.00);

        $subtotal = 0.00;
        $orderItemsData = [];

        // Validate items and calculate subtotal
        foreach ($request->items as $itemInput) {
            $menuItem = MenuItem::where('id', $itemInput['menu_item_id'])
                ->where('restaurant_id', $restaurant->id)
                ->first();

            if (!$menuItem) {
                return response()->json(['message' => 'One or more items do not belong to this restaurant.'], 400);
            }

            if (!$menuItem->is_available) {
                return response()->json(['message' => "Item '{$menuItem->name}' is currently unavailable."], 400);
            }

            $qty = (int) $itemInput['quantity'];
            $price = (float) $menuItem->price;
            $subtotal += ($price * $qty);

            $orderItemsData[] = [
                'menu_item_id' => $menuItem->id,
                'quantity' => $qty,
                'price' => $price,
            ];
        }

        // Calculations
        $commissionAmount = round(($subtotal * ($globalCommissionRate / 100)), 2);
        $totalAmount = $subtotal + $globalDeliveryFee + $globalServiceFee;

        // Perform inserts inside database transaction
        $order = DB::transaction(function () use ($request, $subtotal, $globalDeliveryFee, $globalServiceFee, $commissionAmount, $totalAmount, $orderItemsData, $restaurant) {
            $deliveryPin = str_pad((string)mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);

            $order = Order::create([
                'customer_id' => $request->user()->id,
                'restaurant_id' => $request->restaurant_id,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'delivery_fee' => $globalDeliveryFee,
                'service_fee' => $globalServiceFee,
                'commission_amount' => $commissionAmount,
                'total_amount' => $totalAmount,
                'delivery_address' => $request->delivery_address,
                'special_instructions' => $request->special_instructions,
                'delivery_pin' => $deliveryPin,
                'pickup_latitude' => $restaurant->latitude,
                'pickup_longitude' => $restaurant->longitude,
                'dropoff_latitude' => $request->dropoff_latitude,
                'dropoff_longitude' => $request->dropoff_longitude,
            ]);

            foreach ($orderItemsData as $itemData) {
                OrderItem::create(array_merge($itemData, ['order_id' => $order->id]));
            }

            return $order;
        });

        return response()->json([
            'message' => 'Order placed successfully.',
            'order' => new OrderResource($order->load(['customer', 'restaurant', 'orderItems.menuItem'])),
        ], 201);
    }

    /**
     * Get Customer order history & active tracking.
     */
    public function getOrders(Request $request)
    {
        $orders = Order::with(['restaurant', 'deliveryProfile.user', 'orderItems.menuItem'])
            ->where('customer_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return OrderResource::collection($orders);
    }

    /**
     * Track a specific order.
     */
    public function trackOrder(Request $request, $orderId)
    {
        $order = Order::with(['restaurant', 'deliveryProfile.user', 'orderItems.menuItem'])
            ->where('id', $orderId)
            ->where('customer_id', $request->user()->id)
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        return new OrderResource($order);
    }

    /**
     * Cancel a pending order.
     */
    public function cancelOrder(Request $request, $orderId)
    {
        $order = Order::where('id', $orderId)
            ->where('customer_id', $request->user()->id)
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Only pending orders can be cancelled.'], 400);
        }

        $order->status = 'cancelled';
        $order->cancelled_at = now();
        $order->save();

        return response()->json([
            'message' => 'Order cancelled successfully.',
            'order' => new OrderResource($order->load(['restaurant', 'deliveryProfile.user', 'orderItems.menuItem']))
        ]);
    }

    /**
     * Get Customer's address book.
     */
    public function getAddresses(Request $request)
    {
        $addresses = $request->user()->customerAddresses()->orderBy('created_at', 'desc')->get();
        return \App\Http\Resources\CustomerAddressResource::collection($addresses);
    }

    /**
     * Store a new address.
     */
    public function storeAddress(Request $request)
    {
        $request->validate([
            'door_no' => 'required|string|max:255',
            'street' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'landmark' => 'nullable|string|max:255',
            'pincode' => 'required|string|max:20',
            'city' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $user = $request->user();
        
        // If this is the user's first address, set it selected automatically
        $isFirst = $user->customerAddresses()->count() === 0;

        $address = $user->customerAddresses()->create([
            'door_no' => $request->door_no,
            'street' => $request->street,
            'area' => $request->area,
            'landmark' => $request->landmark,
            'pincode' => $request->pincode,
            'city' => $request->city,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'is_selected' => $isFirst,
        ]);

        return response()->json([
            'message' => 'Address added successfully.',
            'address' => new \App\Http\Resources\CustomerAddressResource($address)
        ], 201);
    }

    /**
     * Update an address.
     */
    public function updateAddress(Request $request, $id)
    {
        $address = $request->user()->customerAddresses()->where('id', $id)->first();

        if (!$address) {
            return response()->json(['message' => 'Address not found.'], 404);
        }

        $request->validate([
            'door_no' => 'required|string|max:255',
            'street' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'landmark' => 'nullable|string|max:255',
            'pincode' => 'required|string|max:20',
            'city' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $address->update($request->only('door_no', 'street', 'area', 'landmark', 'pincode', 'city', 'latitude', 'longitude'));

        return response()->json([
            'message' => 'Address updated successfully.',
            'address' => new \App\Http\Resources\CustomerAddressResource($address)
        ]);
    }

    /**
     * Select a specific address as primary.
     */
    public function selectAddress(Request $request, $id)
    {
        $user = $request->user();
        $address = $user->customerAddresses()->where('id', $id)->first();

        if (!$address) {
            return response()->json(['message' => 'Address not found.'], 404);
        }

        // Set all other addresses to false inside transaction
        \Illuminate\Support\Facades\DB::transaction(function () use ($user, $address) {
            $user->customerAddresses()->update(['is_selected' => false]);
            $address->is_selected = true;
            $address->save();
        });

        return response()->json([
            'message' => 'Address selected successfully.',
            'addresses' => \App\Http\Resources\CustomerAddressResource::collection($user->customerAddresses()->orderBy('created_at', 'desc')->get())
        ]);
    }

    /**
     * Delete an address.
     */
    public function deleteAddress(Request $request, $id)
    {
        $user = $request->user();
        $address = $user->customerAddresses()->where('id', $id)->first();

        if (!$address) {
            return response()->json(['message' => 'Address not found.'], 404);
        }

        $wasSelected = $address->is_selected;
        $address->delete();

        // If the deleted address was selected, select the first remaining one
        if ($wasSelected) {
            $nextAddress = $user->customerAddresses()->first();
            if ($nextAddress) {
                $nextAddress->is_selected = true;
                $nextAddress->save();
            }
        }

        return response()->json(['message' => 'Address deleted successfully.']);
    }

    /**
     * Add extra items to an already accepted/preparing order.
     */
    public function addExtraItems(Request $request, $orderId)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $order = Order::where('id', $orderId)
            ->where('customer_id', $request->user()->id)
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        if (!in_array($order->status, ['accepted', 'preparing'])) {
            return response()->json(['message' => 'Extra items can only be added when the order is accepted or being prepared.'], 400);
        }

        // Enforce 15-minute time window from order creation
        if ($order->created_at->diffInMinutes(now()) > 15) {
            return response()->json(['message' => 'Extra items can only be added within 15 minutes of placing the main order.'], 400);
        }

        $restaurantId = $order->restaurant_id;
        $orderItemsData = [];

        // Validate items belong to the restaurant and are available
        foreach ($request->items as $itemInput) {
            $menuItem = MenuItem::where('id', $itemInput['menu_item_id'])
                ->where('restaurant_id', $restaurantId)
                ->first();

            if (!$menuItem) {
                return response()->json(['message' => 'One or more items do not belong to this restaurant.'], 400);
            }

            if (!$menuItem->is_available) {
                return response()->json(['message' => "Item '{$menuItem->name}' is currently unavailable."], 400);
            }

            $qty = (int) $itemInput['quantity'];
            $price = (float) $menuItem->price;

            $orderItemsData[] = [
                'order_id' => $order->id,
                'menu_item_id' => $menuItem->id,
                'quantity' => $qty,
                'price' => $price,
                'is_extra' => true,
                'extra_status' => 'pending',
            ];
        }

        // Insert within db transaction
        DB::transaction(function () use ($orderItemsData) {
            foreach ($orderItemsData as $itemData) {
                OrderItem::create($itemData);
            }
        });

        return response()->json([
            'message' => 'Extra items requested successfully.',
            'order' => new OrderResource($order->load(['customer', 'restaurant', 'orderItems.menuItem'])),
        ], 200);
    }
}
