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
        // 1. Drop existing global email unique constraint if it exists
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_email_unique');
            });
        } catch (\Exception $e) {
            // Silently ignore if constraint doesn't exist
        }
        
        // 2. Create composite unique constraints (using try-catch to prevent duplicates)
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->unique(['email', 'role']);
            });
        } catch (\Exception $e) {
            // Silently ignore if already exists
        }

        try {
            Schema::table('users', function (Blueprint $table) {
                $table->unique(['phone', 'role']);
            });
        } catch (\Exception $e) {
            // Silently ignore if already exists
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique(['email', 'role']);
            });
        } catch (\Exception $e) {}

        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique(['phone', 'role']);
            });
        } catch (\Exception $e) {}

        try {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('email');
            });
        } catch (\Exception $e) {}
    }
};
