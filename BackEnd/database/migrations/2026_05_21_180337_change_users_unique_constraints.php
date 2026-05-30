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
            // Drop existing global email unique constraint
            $table->dropUnique('users_email_unique');
            
            // Create composite unique constraints
            $table->unique(['email', 'role']);
            $table->unique(['phone', 'role']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email', 'role']);
            $table->dropUnique(['phone', 'role']);
            $table->unique('email');
        });
    }
};
