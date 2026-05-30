<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'phone' => $this->phone,
            'profile_photo' => $this->profile_photo,
            'restaurant' => new RestaurantResource($this->whenLoaded('restaurant')),
            'delivery_profile' => new DeliveryProfileResource($this->whenLoaded('deliveryProfile')),
            'customer_addresses' => CustomerAddressResource::collection($this->whenLoaded('customerAddresses')),
        ];
    }
}
