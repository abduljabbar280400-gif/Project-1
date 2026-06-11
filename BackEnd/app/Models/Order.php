<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'restaurant_id',
        'delivery_profile_id',
        'status',
        'subtotal',
        'delivery_fee',
        'service_fee',
        'commission_amount',
        'total_amount',
        'delivery_address',
        'special_instructions',
        'delivery_pin',
        'rejection_reason',
        'extra_rejection_reason',
        'accepted_at',
        'prepared_at',
        'picked_up_at',
        'delivered_at',
        'cancelled_at',
        'pickup_latitude',
        'pickup_longitude',
        'dropoff_latitude',
        'dropoff_longitude',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'service_fee' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'accepted_at' => 'datetime',
        'prepared_at' => 'datetime',
        'picked_up_at' => 'datetime',
        'delivered_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'pickup_latitude' => 'decimal:8',
        'pickup_longitude' => 'decimal:8',
        'dropoff_latitude' => 'decimal:8',
        'dropoff_longitude' => 'decimal:8',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function deliveryProfile(): BelongsTo
    {
        return $this->belongsTo(DeliveryProfile::class, 'delivery_profile_id');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
