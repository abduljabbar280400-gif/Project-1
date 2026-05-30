<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayoutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user_name' => $this->user ? $this->user->name : 'Unknown User',
            'role' => $this->user ? $this->user->role : 'Unknown Role',
            'amount' => (float) $this->amount,
            'bank_name' => $this->bank_name,
            'account_number' => $this->account_number,
            'account_name' => $this->account_name,
            'status' => $this->status,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
        ];
    }
}
