<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationValidationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test role-scoped uniqueness validation.
     */
    public function test_role_scoped_email_and_phone_registration()
    {
        // 1. Register a customer
        $response1 = $this->postJson('/api/register', [
            'name' => 'Alice Customer',
            'email' => 'shared@test.com',
            'phone' => '1234567890',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'customer',
        ]);
        $response1->assertStatus(201);

        // 2. Attempting to register another customer with the same email should fail
        $response2 = $this->postJson('/api/register', [
            'name' => 'Bob Customer',
            'email' => 'shared@test.com',
            'phone' => '0987654321',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'customer',
        ]);
        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonFragment([
                'email' => ['Email is already exists.']
            ]);

        // 3. Attempting to register another customer with the same phone should fail
        $response3 = $this->postJson('/api/register', [
            'name' => 'Charlie Customer',
            'email' => 'another@test.com',
            'phone' => '1234567890',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'customer',
        ]);
        $response3->assertStatus(422)
            ->assertJsonValidationErrors(['phone'])
            ->assertJsonFragment([
                'phone' => ['Phone is already exists.']
            ]);

        // 4. Attempting to register a Chef with the SAME email and phone should succeed!
        $response4 = $this->postJson('/api/register', [
            'name' => 'Chef Mario',
            'email' => 'shared@test.com',
            'phone' => '1234567890',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'chef',
        ]);
        $response4->assertStatus(201);
    }
}
