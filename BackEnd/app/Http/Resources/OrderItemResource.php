<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'menu_item_id' => $this->menu_item_id,
            'name' => $this->menuItem ? $this->menuItem->name : 'Deleted Item',
            'image' => $this->menuItem?->image,
            'quantity' => $this->quantity,
            'price' => (float) $this->price,
        ];
    }
}
