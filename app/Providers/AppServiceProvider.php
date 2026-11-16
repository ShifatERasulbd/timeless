<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Password reset emails link to the storefront's reset page (a React route) rather than a Blade view.
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return url('/reset-password/' . $token) . '?email=' . urlencode($user->getEmailForPasswordReset());
        });
    }
}
