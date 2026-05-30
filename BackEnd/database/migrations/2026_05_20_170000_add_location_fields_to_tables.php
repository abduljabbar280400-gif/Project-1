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
        // Removed PostGIS dependency since it's not installed in the current PostgreSQL instance.
        // Using standard decimal(10,8) and decimal(11,8) for latitude and longitude.

        // Add to restaurants
        Schema::table('restaurants', function (Blueprint $table) {
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
        });

        // Add to customer_addresses
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
        });

        // Add to orders for pickup and dropoff points snapshot
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('pickup_latitude', 10, 8)->nullable();
            $table->decimal('pickup_longitude', 11, 8)->nullable();

            $table->decimal('dropoff_latitude', 10, 8)->nullable();
            $table->decimal('dropoff_longitude', 11, 8)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['pickup_latitude', 'pickup_longitude', 'dropoff_latitude', 'dropoff_longitude']);
        });

        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });

        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
