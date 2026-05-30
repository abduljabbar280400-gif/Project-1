<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Restaurant;
use App\Models\DeliveryProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * User registration.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->where('role', $request->role),
            ],
            'password' => [
                'required',
                'confirmed',
                'string',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
            'role' => 'required|string|in:customer,chef,delivery',
            'phone' => [
                'required',
                'string',
                'max:20',
                Rule::unique('users')->where('role', $request->role),
            ],
        ], [
            'email.unique' => 'Email is already exists.',
            'phone.unique' => 'Phone is already exists.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
        ]);

        // Auto-initialize role dependencies
        if ($user->role === 'chef') {
            Restaurant::create([
                'user_id' => $user->id,
                'name' => $user->name . "'s Kitchen",
                'description' => 'A new delicious kitchen on Num Num.',
                'address' => 'Please update your restaurant address.',
                'is_active' => true,
                'is_open' => true,
                'earnings_balance' => 0.00,
            ]);
        } elseif ($user->role === 'delivery') {
            DeliveryProfile::create([
                'user_id' => $user->id,
                'is_available' => false,
                'vehicle_type' => 'bike',
                'earnings_balance' => 0.00,
            ]);
        }

        // Return token immediately on registration
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user->load(['restaurant', 'deliveryProfile'])),
        ], 201);
    }

    /**
     * User login.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
            'role' => 'nullable|string|in:customer,chef,delivery,admin',
        ]);

        if ($request->filled('role')) {
            $user = User::where('email', $request->email)
                ->where('role', $request->role)
                ->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Invalid email or password.'], 401);
            }
        } else {
            // Find all accounts with this email
            $users = User::where('email', $request->email)->get();

            if ($users->isEmpty()) {
                return response()->json(['message' => 'Invalid email or password.'], 401);
            }

            // Filter users where the password is correct
            $validUsers = $users->filter(function ($user) use ($request) {
                return Hash::check($request->password, $user->password);
            });

            if ($validUsers->isEmpty()) {
                return response()->json(['message' => 'Invalid email or password.'], 401);
            }

            if ($validUsers->count() > 1) {
                return response()->json([
                    'message' => 'This email is associated with multiple roles. Please select a role.',
                    'multiple_roles' => true,
                    'roles' => $validUsers->pluck('role')->toArray(),
                ], 422);
            }

            $user = $validUsers->first();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user->load(['restaurant', 'deliveryProfile'])),
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function profile(Request $request)
    {
        return response()->json([
            'user' => new UserResource($request->user()->load(['restaurant', 'deliveryProfile'])),
        ]);
    }

    /**
     * Update user's profile photo.
     */
    public function updateProfilePhoto(Request $request)
    {
        $request->validate([
            'profile_photo' => 'nullable|string|url',
        ]);

        $user = $request->user();
        $user->profile_photo = $request->profile_photo;
        $user->save();

        return response()->json([
            'message' => 'Profile photo updated successfully.',
            'user' => new UserResource($user->load(['restaurant', 'deliveryProfile'])),
        ]);
    }

    /**
     * User logout.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Successfully logged out.']);
    }
}
