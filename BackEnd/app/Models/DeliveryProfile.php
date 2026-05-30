<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'is_available',
        'vehicle_type',
        'licence_number',
        'earnings_balance',
        'current_latitude',
        'current_longitude',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'earnings_balance' => 'decimal:2',
        'current_latitude' => 'decimal:8',
        'current_longitude' => 'decimal:8',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'delivery_profile_id');
    }
}
