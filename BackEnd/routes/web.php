<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

Route::get('/', function () {
    return view('welcome');
});

// Secure migration trigger route for free hosting environments (no terminal/shell needed)
Route::get('/run-migrations/{secret}', function ($secret) {
    if ($secret !== 'numnum-migrate-secret-777') {
        abort(403, 'Unauthorized access.');
    }
    
    try {
        Artisan::call('migrate', ['--force' => true]);
        $output = Artisan::output();
        return "<pre>Migrations run successfully:\n" . e($output) . "</pre>";
    } catch (\Exception $e) {
        return "Error running migrations: " . e($e->getMessage());
    }
});
