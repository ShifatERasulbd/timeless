<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

/** Storefront (customer) authentication: register, login, password reset. */
class CustomerAuthController extends Controller
{
    /** Current session for the storefront. Returns 200 with a null user for guests. */
    public function session(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()?->toAccountArray(),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $accountType = $request->input('account_type') === User::ACCOUNT_CORPORATE
            ? User::ACCOUNT_CORPORATE
            : User::ACCOUNT_NORMAL;

        $typeRules = $accountType === User::ACCOUNT_CORPORATE
            ? [
                'company_name' => ['required', 'string', 'max:255'],
                'tax_id' => ['required', 'string', 'max:100'],
                'company_address' => ['required', 'string', 'max:1000'],
                'phone' => ['required', 'string', 'max:50'],
            ]
            : [
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
            ];

        $validated = $request->validate([
            ...$typeRules,
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'confirmed', PasswordRule::min(8)],
        ], [
            'email.unique' => 'An account with this email already exists. Try logging in instead.',
        ]);

        $name = $accountType === User::ACCOUNT_CORPORATE
            ? $validated['company_name']
            : trim($validated['first_name'] . ' ' . $validated['last_name']);

        $user = User::query()->create([
            ...$validated,
            'name' => $name,
            'email' => Str::lower($validated['email']),
            'account_type' => $accountType,
        ]);

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Your account has been created.',
            'user' => $user->toAccountArray(),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'account_type' => ['nullable', Rule::in(User::ACCOUNT_TYPES)],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $credentials = [
            'email' => Str::lower($validated['email']),
            'password' => $validated['password'],
        ];

        if (! Auth::guard('web')->validate($credentials)) {
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        /** @var User $user */
        $user = User::query()->where('email', $credentials['email'])->firstOrFail();

        // The login page has separate tabs; point customers to the right one rather than mixing them up.
        // Staff accounts (no account type) may use either tab.
        $requestedType = $validated['account_type'] ?? null;
        if ($requestedType && $user->account_type && $user->account_type !== $requestedType) {
            throw ValidationException::withMessages([
                'email' => $user->isCorporate()
                    ? 'This email is registered as a corporate account. Please use the Corporate User tab.'
                    : 'This email is registered as a normal account. Please use the Normal User tab.',
            ]);
        }

        Auth::guard('web')->login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user->toAccountArray(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'You have been logged out.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        $status = Password::sendResetLink(['email' => Str::lower($validated['email'])]);

        if ($status === Password::RESET_THROTTLED) {
            throw ValidationException::withMessages(['email' => __($status)]);
        }

        // Same answer whether or not the email exists, so this can't be used to discover accounts.
        return response()->json([
            'message' => 'If an account exists for that email, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'confirmed', PasswordRule::min(8)],
        ]);

        $status = Password::reset(
            [
                'email' => Str::lower($validated['email']),
                'password' => $validated['password'],
                'password_confirmation' => $request->input('password_confirmation'),
                'token' => $validated['token'],
            ],
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => __($status)]);
        }

        return response()->json([
            'message' => 'Your password has been reset. You can now log in with your new password.',
        ]);
    }
}
