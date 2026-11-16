<?php

namespace App\Http\Controllers;

use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\Personalization;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password as PasswordRule;

/** The logged-in customer's own account: overview, profile, orders, addresses and saved designs. */
class AccountController extends Controller
{
    private const ACTIVE_STATUSES = ['pending', 'processing', 'shipped'];

    public function dashboard(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $orders = $user->orders();

        $recentOrders = (clone $orders)
            ->with('items')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Order $order) => $order->toApiArray());

        $defaultAddress = $user->addresses()
            ->orderByDesc('is_default')
            ->latest()
            ->first();

        return response()->json([
            'user' => $user->toAccountArray(),
            'stats' => [
                'total_orders' => (clone $orders)->count(),
                'active_orders' => (clone $orders)->whereIn('status', self::ACTIVE_STATUSES)->count(),
                'delivered_orders' => (clone $orders)->where('status', 'delivered')->count(),
                'total_spent' => round((float) (clone $orders)->where('status', '!=', 'cancelled')->sum('total'), 2),
                'saved_designs' => $user->personalizations()->count(),
                'saved_addresses' => $user->addresses()->count(),
            ],
            'recent_orders' => $recentOrders,
            'default_address' => $defaultAddress?->toApiArray(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $typeRules = $user->isCorporate()
            ? [
                'company_name' => ['required', 'string', 'max:255'],
                'tax_id' => ['required', 'string', 'max:100'],
                'company_address' => ['required', 'string', 'max:1000'],
                'phone' => ['required', 'string', 'max:50'],
                'first_name' => ['nullable', 'string', 'max:255'],
                'last_name' => ['nullable', 'string', 'max:255'],
            ]
            : [
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'phone' => ['nullable', 'string', 'max:50'],
            ];

        $validated = $request->validate([
            ...$typeRules,
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'current_password' => ['nullable', 'string'],
        ], [
            'email.unique' => 'Another account already uses this email.',
        ]);

        $validated['email'] = Str::lower($validated['email']);

        // Changing the login email needs the current password, so an unattended session can't take over the account.
        if ($validated['email'] !== Str::lower($user->email)) {
            $request->validate([
                'current_password' => ['required', 'current_password:web'],
            ], [
                'current_password.required' => 'Enter your current password to change your email address.',
                'current_password.current_password' => 'The current password is incorrect.',
            ]);
        }

        unset($validated['current_password']);

        $user->fill($validated);
        $user->name = $user->isCorporate()
            ? $user->company_name
            : trim($user->first_name . ' ' . $user->last_name);
        $user->save();

        return response()->json([
            'message' => 'Your account details have been saved.',
            'user' => $user->toAccountArray(),
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'current_password:web'],
            'password' => ['required', 'string', 'confirmed', 'different:current_password', PasswordRule::min(8)],
        ], [
            'current_password.current_password' => 'The current password is incorrect.',
            'password.different' => 'Your new password must be different from the current one.',
        ]);

        $user->forceFill([
            'password' => $validated['password'],
            'remember_token' => Str::random(60),
        ])->save();

        return response()->json(['message' => 'Your password has been updated.']);
    }

    public function orders(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(Order::STATUSES)],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $paginator = $request->user()
            ->orders()
            ->with('items')
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate(10);

        return response()->json([
            'data' => collect($paginator->items())->map(fn (Order $order) => $order->toApiArray())->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'status_counts' => $request->user()
                ->orders()
                // Not aliased `total`: that is a decimal-cast column on Order and would turn counts into "1.00".
                ->select('status', DB::raw('count(*) as orders_count'))
                ->groupBy('status')
                ->pluck('orders_count', 'status')
                ->map(fn ($count) => (int) $count),
        ]);
    }

    public function showOrder(Request $request, string $orderNumber): JsonResponse
    {
        $order = $this->findOwnOrder($request, $orderNumber);

        return response()->json($order->toApiArray());
    }

    public function cancelOrder(Request $request, string $orderNumber): JsonResponse
    {
        $order = $this->findOwnOrder($request, $orderNumber);

        if (! $order->isCancellableByCustomer()) {
            return response()->json([
                'message' => 'This order is already being processed and can no longer be cancelled. Please contact us for help.',
            ], 422);
        }

        $order->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Your order has been cancelled.',
            'data' => $order->toApiArray(),
        ]);
    }

    public function addresses(Request $request): JsonResponse
    {
        $addresses = $request->user()
            ->addresses()
            ->orderByDesc('is_default')
            ->latest()
            ->get()
            ->map(fn (CustomerAddress $address) => $address->toApiArray());

        return response()->json($addresses);
    }

    public function storeAddress(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->addresses()->count() >= CustomerAddress::MAX_PER_USER) {
            return response()->json([
                'message' => 'You can save up to ' . CustomerAddress::MAX_PER_USER . ' addresses. Remove one to add another.',
            ], 422);
        }

        $validated = $request->validate($this->addressRules());

        $address = DB::transaction(function () use ($user, $validated) {
            $makeDefault = ($validated['is_default'] ?? false) || ! $user->addresses()->exists();

            if ($makeDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            return $user->addresses()->create([...$validated, 'is_default' => $makeDefault]);
        });

        return response()->json([
            'message' => 'Address saved.',
            'data' => $address->toApiArray(),
        ], 201);
    }

    public function updateAddress(Request $request, int $address): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $record = $user->addresses()->findOrFail($address);

        $validated = $request->validate($this->addressRules());

        DB::transaction(function () use ($user, $record, $validated) {
            if (! empty($validated['is_default'])) {
                $user->addresses()->whereKeyNot($record->id)->update(['is_default' => false]);
            }

            // Unticking "default" on the only default address would leave none, so keep it.
            $record->fill([...$validated, 'is_default' => $record->is_default || ! empty($validated['is_default'])]);
            $record->save();
        });

        return response()->json([
            'message' => 'Address updated.',
            'data' => $record->fresh()->toApiArray(),
        ]);
    }

    public function setDefaultAddress(Request $request, int $address): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $record = $user->addresses()->findOrFail($address);

        DB::transaction(function () use ($user, $record) {
            $user->addresses()->whereKeyNot($record->id)->update(['is_default' => false]);
            $record->update(['is_default' => true]);
        });

        return response()->json(['message' => 'Default address updated.']);
    }

    public function destroyAddress(Request $request, int $address): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $record = $user->addresses()->findOrFail($address);

        DB::transaction(function () use ($user, $record) {
            $wasDefault = $record->is_default;
            $record->delete();

            if ($wasDefault) {
                $user->addresses()->latest()->first()?->update(['is_default' => true]);
            }
        });

        return response()->json(['message' => 'Address removed.']);
    }

    public function designs(Request $request): JsonResponse
    {
        $designs = $request->user()
            ->personalizations()
            ->latest()
            ->get()
            ->map(function (Personalization $record) {
                $meta = $record->meta ?? [];
                $front = $record->front_image_path ?: ($meta['front_image_path'] ?? null) ?: $record->image_path;
                $back = $record->back_image_path ?: ($meta['back_image_path'] ?? null);

                return [
                    'id' => $record->id,
                    'title' => $record->title,
                    'front_image_url' => $front ? '/' . ltrim($front, '/') : null,
                    'back_image_url' => $back ? '/' . ltrim($back, '/') : null,
                    'quantity' => (int) ($record->quantity ?? 1),
                    'unit_price' => round((float) $record->unit_price, 2),
                    'total_price' => round((float) $record->total_price, 2),
                    'status' => strtolower((string) ($record->order_status ?? 'pending')),
                    'created_at' => optional($record->created_at)?->toISOString(),
                ];
            });

        return response()->json($designs);
    }

    private function findOwnOrder(Request $request, string $orderNumber): Order
    {
        $order = $request->user()
            ->orders()
            ->with('items')
            ->where('order_number', $orderNumber)
            ->first();

        if (! $order) {
            abort(404, 'Order not found.');
        }

        return $order;
    }

    private function addressRules(): array
    {
        return [
            'label' => ['nullable', 'string', 'max:50'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'country' => ['required', 'string', 'max:255'],
            'street_address' => ['required', 'string', 'max:255'],
            'apartment' => ['nullable', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'zip' => ['required', 'string', 'max:50'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
