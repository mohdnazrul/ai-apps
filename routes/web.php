<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AiTryPromptController;
use App\Http\Controllers\AiTryStatusController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// ✅ guest allowed (5 tries), then login required
Route::get('/ai/try-status', AiTryStatusController::class)->name('ai.try.status');
Route::post('/ai/try', AiTryPromptController::class)
    ->middleware('throttle:20,1')
    ->name('ai.try');
Route::post('/ai/modules/enable', [AiTryPromptController::class, 'enableModule']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('notification', function () {
        return Inertia::render('notification');
    })->name('notification');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
