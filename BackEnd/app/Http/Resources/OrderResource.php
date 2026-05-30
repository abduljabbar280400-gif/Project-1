<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'customer_name' => $this->customer ? $this->customer->name : 'Unknown',
            'customer_phone' => $this->customer ? $this->customer->phone : '',
            'restaurant_id' => $this->restaurant_id,
            'restaurant_name' => $this->restaurant ? $this->restaurant->name : 'Unknown',
            'restaurant_address' => $this->restaurant ? $this->restaurant->address : '',
            'delivery_profile_id' => $this->delivery_profile_id,
            'driver_name' => $this->deliveryProfile && $this->deliveryProfile->user ? $this->deliveryProfile->user->name : null,
            'driver_phone' => $this->deliveryProfile && $this->deliveryProfile->user ? $this->deliveryProfile->user->phone : null,
            'status' => $this->status,
            'subtotal' => (float) $this->subtotal,
            'delivery_fee' => (float) $this->delivery_fee,
            'service_fee' => (float) $this->service_fee,
            'commission_amount' => (float) $this->commission_amount,
            'total_amount' => (float) $this->total_amount,
            'delivery_address' => $this->delivery_address,
            'special_instructions' => $this->special_instructions,
            'delivery_pin' => $this->status === 'out_for_delivery' || $this->status === 'delivered' ? $this->delivery_pin : null,
            'pickup_latitude' => $this->pickup_latitude ? (float) $this->pickup_latitude : null,
            'pickup_longitude' => $this->pickup_longitude ? (float) $this->pickup_longitude : null,
            'dropoff_latitude' => $this->dropoff_latitude ? (float) $this->dropoff_latitude : null,
            'dropoff_longitude' => $this->dropoff_longitude ? (float) $this->dropoff_longitude : null,
            'rejection_reason' => $this->rejection_reason,
            'accepted_at' => $this->accepted_at ? $this->accepted_at->toIso8601String() : null,
            'prepared_at' => $this->prepared_at ? $this->prepared_at->toIso8601String() : null,
            'picked_up_at' => $this->picked_up_at ? $this->picked_up_at->toIso8601String() : null,
            'delivered_at' => $this->delivered_at ? $this->delivered_at->toIso8601String() : null,
            'cancelled_at' => $this->cancelled_at ? $this->cancelled_at->toIso8601String() : null,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'order_items' => OrderItemResource::collection($this->whenLoaded('orderItems')),
        ];
    }
}
