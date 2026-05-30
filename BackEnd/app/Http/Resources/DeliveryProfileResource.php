<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'is_available' => $this->is_available,
            'vehicle_type' => $this->vehicle_type,
            'licence_number' => $this->licence_number,
            'earnings_balance' => (float) $this->earnings_balance,
            'current_latitude' => $this->current_latitude ? (float) $this->current_latitude : null,
            'current_longitude' => $this->current_longitude ? (float) $this->current_longitude : null,
        ];
    }
}
