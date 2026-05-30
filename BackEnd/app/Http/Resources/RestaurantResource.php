<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'description' => $this->description,
            'address' => $this->address,
            'door_no' => $this->door_no,
            'street' => $this->street,
            'area' => $this->area,
            'landmark' => $this->landmark,
            'pincode' => $this->pincode,
            'city' => $this->city,
            'cuisine_type' => $this->cuisine_type,
            'banner_image' => $this->banner_image,
            'is_active' => $this->is_active,
            'is_open' => $this->is_open,
            'earnings_balance' => (float) $this->earnings_balance,
            'latitude' => $this->latitude ? (float) $this->latitude : null,
            'longitude' => $this->longitude ? (float) $this->longitude : null,
            'menu_items' => MenuItemResource::collection($this->whenLoaded('menuItems')),
        ];
    }
}
