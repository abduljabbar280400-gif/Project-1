<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerAddressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'door_no' => $this->door_no,
            'street' => $this->street,
            'area' => $this->area,
            'landmark' => $this->landmark,
            'pincode' => $this->pincode,
            'city' => $this->city,
            'latitude' => $this->latitude ? (float) $this->latitude : null,
            'longitude' => $this->longitude ? (float) $this->longitude : null,
            'is_selected' => (bool) $this->is_selected,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
