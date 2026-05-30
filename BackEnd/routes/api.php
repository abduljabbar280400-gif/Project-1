<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChefController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication routes
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// Protected routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth profile actions
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile/photo', [AuthController::class, 'updateProfilePhoto']);

    // 1. Customer Actions
    Route::prefix('customer')->group(function () {
        Route::get('/restaurants', [CustomerController::class, 'getRestaurants']);
        Route::get('/restaurants/{restaurantId}/menu', [CustomerController::class, 'getRestaurantMenu']);
        Route::post('/orders', [CustomerController::class, 'placeOrder']);
        Route::get('/orders', [CustomerController::class, 'getOrders']);
        Route::get('/orders/{orderId}', [CustomerController::class, 'trackOrder']);
        Route::post('/orders/{orderId}/cancel', [CustomerController::class, 'cancelOrder']);
        
        // Address book
        Route::get('/addresses', [CustomerController::class, 'getAddresses']);
        Route::post('/addresses', [CustomerController::class, 'storeAddress']);
        Route::put('/addresses/{id}', [CustomerController::class, 'updateAddress']);
        Route::delete('/addresses/{id}', [CustomerController::class, 'deleteAddress']);
        Route::post('/addresses/{id}/select', [CustomerController::class, 'selectAddress']);
    });

    // 2. Chef (Kitchen Focus) Actions
    Route::prefix('chef')->group(function () {
        Route::get('/profile', [ChefController::class, 'getProfile']);
        Route::put('/profile', [ChefController::class, 'updateProfile']);
        Route::post('/profile/toggle-open', [ChefController::class, 'toggleOpenStatus']);
        
        Route::get('/orders', [ChefController::class, 'getActiveOrders']);
        Route::post('/orders/{orderId}/status', [ChefController::class, 'updateOrderStatus']);
        
        Route::get('/menu', [ChefController::class, 'getMenuItems']);
        Route::post('/menu', [ChefController::class, 'storeMenuItem']);
        Route::put('/menu/{itemId}', [ChefController::class, 'updateMenuItem']);
        Route::delete('/menu/{itemId}', [ChefController::class, 'destroyMenuItem']);
        
        Route::get('/payouts', [ChefController::class, 'getPayouts']);
        Route::post('/payouts', [ChefController::class, 'requestPayout']);
    });

    // 3. Delivery Partner Actions
    Route::prefix('delivery')->group(function () {
        Route::get('/profile', [DeliveryController::class, 'getProfile']);
        Route::put('/profile', [DeliveryController::class, 'updateProfile']);
        Route::post('/profile/toggle-availability', [DeliveryController::class, 'toggleAvailability']);
        
        Route::get('/jobs', [DeliveryController::class, 'getAvailableJobs']);
        Route::get('/orders', [DeliveryController::class, 'getActiveDeliveries']);
        Route::post('/orders/{orderId}/accept', [DeliveryController::class, 'acceptJob']);
        Route::post('/orders/{orderId}/pickup', [DeliveryController::class, 'confirmPickup']);
        Route::post('/orders/{orderId}/deliver', [DeliveryController::class, 'confirmDelivery']);
        
        Route::get('/payouts', [DeliveryController::class, 'getPayouts']);
        Route::post('/payouts', [DeliveryController::class, 'requestPayout']);
    });

    // 4. Admin Operational Actions
    Route::prefix('admin')->group(function () {
        Route::get('/restaurants', [AdminController::class, 'getRestaurants']);
        Route::post('/restaurants/{restaurantId}/toggle-active', [AdminController::class, 'toggleRestaurantActive']);
        
        Route::get('/orders', [AdminController::class, 'getOrders']);
        Route::get('/payouts', [AdminController::class, 'getPendingPayouts']);
        Route::post('/payouts/{payoutId}/process', [AdminController::class, 'processPayout']);
    });
});
