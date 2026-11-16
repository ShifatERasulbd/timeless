<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps storefront customers out of the admin API: they share the session guard with staff,
 * so being logged in alone is not enough.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            abort(403, 'This action is only available to administrators.');
        }

        return $next($request);
    }
}
