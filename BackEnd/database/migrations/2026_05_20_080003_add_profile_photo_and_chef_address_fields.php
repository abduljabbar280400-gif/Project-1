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
        Schema::table('users', function (Blueprint $table) {
            $table->string('profile_photo')->nullable()->after('phone');
        });

        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('door_no')->nullable()->after('address');
            $table->string('street')->nullable()->after('door_no');
            $table->string('area')->nullable()->after('street');
            $table->string('landmark')->nullable()->after('area');
            $table->string('pincode')->nullable()->after('landmark');
            $table->string('city')->nullable()->after('pincode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('profile_photo');
        });

        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['door_no', 'street', 'area', 'landmark', 'pincode', 'city']);
        });
    }
};
