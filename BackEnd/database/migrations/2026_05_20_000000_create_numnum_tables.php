<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Restaurants (Chef Profile)
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('address');
            $table->text('banner_image')->nullable();
            $table->boolean('is_active')->default(true); // admin control
            $table->boolean('is_open')->default(true);   // chef control
            $table->decimal('earnings_balance', 10, 2)->default(0.00);
            $table->timestamps();
        });

        // 2. Menu Items
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->text('image')->nullable();
            $table->string('category')->default('General');
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });

        // 3. Delivery Profiles (Driver Status & Balance)
        Schema::create('delivery_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->boolean('is_available')->default(false); // Online/Offline toggle
            $table->string('vehicle_type')->default('bike');
            $table->decimal('earnings_balance', 10, 2)->default(0.00);
            $table->decimal('current_latitude', 10, 8)->nullable();
            $table->decimal('current_longitude', 11, 8)->nullable();
            $table->timestamps();
        });

        // 4. Orders
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('restaurant_id')->constrained('restaurants')->onDelete('cascade');
            $table->foreignId('delivery_profile_id')->nullable()->constrained('delivery_profiles')->onDelete('set null');
            $table->string('status')->default('pending'); // pending, accepted, preparing, ready, out_for_delivery, delivered, cancelled, rejected
            
            $table->decimal('subtotal', 10, 2);
            $table->decimal('delivery_fee', 10, 2)->default(0.00);
            $table->decimal('service_fee', 10, 2)->default(0.00);
            $table->decimal('commission_amount', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2);
            
            $table->text('delivery_address');
            $table->text('special_instructions')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Operational audit timestamps
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('prepared_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            
            $table->timestamps();
        });

        // 5. Order Items
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('menu_item_id')->constrained('menu_items')->onDelete('cascade');
            $table->integer('quantity');
            $table->decimal('price', 10, 2);
            $table->timestamps();
        });

        // 6. Payouts
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->string('bank_name');
            $table->string('account_number');
            $table->string('account_name');
            $table->string('status')->default('pending'); // pending, processed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payouts');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('delivery_profiles');
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('restaurants');
    }
};
