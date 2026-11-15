<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(): JsonResponse
    {
        $orders = Order::query()
            ->with('items')
            ->latest()
            ->get()
            ->map(fn (Order $order) => $this->transformOrder($order));

        return response()->json($orders);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load('items');

        return response()->json($this->transformOrder($order));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            ...$this->customerRules(),
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'integer'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.image' => ['nullable', 'string', 'max:2048'],
            'items.*.color' => ['nullable', 'string', 'max:100'],
            'items.*.size' => ['nullable', 'string', 'max:100'],
            'items.*.design' => ['nullable', 'array'],
            'items.*.design.title' => ['nullable', 'string', 'max:255'],
            'items.*.design.image' => ['nullable', 'string'],
            'items.*.design.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100000'],
        ]);

        // Totals are worked out here from the lines rather than trusted from the browser.
        $totals = Order::calculateTotals($validated['items'], Order::SHIPPING_FLAT_RATE);

        $order = DB::transaction(function () use ($request, $validated, $totals) {
            $order = Order::query()->create([
                ...collect($validated)->only(array_keys($this->customerRules()))->all(),
                'user_id' => $request->user()?->id,
                'order_number' => $this->generateOrderNumber(),
                'notes' => $validated['notes'] ?? null,
                ...$totals,
                'status' => 'pending',
            ]);

            foreach ($validated['items'] as $item) {
                $order->items()->create([
                    'product_id' => $item['product_id'] ?? null,
                    'name' => $item['name'],
                    'color' => $item['color'] ?? null,
                    'size' => $item['size'] ?? null,
                    'design' => $this->normalizeDesign($item['design'] ?? null),
                    'image' => $item['image'] ?? null,
                    'price' => round((float) $item['price'], 2),
                    'quantity' => (int) $item['quantity'],
                ]);
            }

            return $order;
        });

        $order->load('items');

        return response()->json([
            'message' => 'Order placed successfully.',
            'data' => $this->transformOrder($order),
        ], 201);
    }

    /**
     * Admin edit: status, customer/shipping details, notes, shipping charge and line items.
     * Every field is optional so the same endpoint serves a status-only change.
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $customerRules = collect($this->customerRules())
            ->map(fn (array $rules) => ['sometimes', ...$rules])
            ->all();
        // Orders placed before email was collected have none, so the admin may leave it blank.
        $customerRules['email'] = ['sometimes', 'nullable', 'email', 'max:255'];

        $validated = $request->validate([
            ...$customerRules,
            'status' => ['sometimes', 'required', Rule::in(Order::STATUSES)],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'admin_notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'shipping' => ['sometimes', 'required', 'numeric', 'min:0'],
            'items' => ['sometimes', 'required', 'array', 'min:1'],
            'items.*.id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('order_items', 'id')->where('order_id', $order->id),
            ],
            'items.*.color' => ['nullable', 'string', 'max:100'],
            'items.*.size' => ['nullable', 'string', 'max:100'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100000'],
        ]);

        DB::transaction(function () use ($order, $validated) {
            $order->fill(collect($validated)->except(['items', 'shipping'])->all());

            if (array_key_exists('items', $validated)) {
                $keepIds = collect($validated['items'])->pluck('id')->all();

                // Lines left out of the request were removed by the admin.
                $order->items()->whereNotIn('id', $keepIds)->delete();

                foreach ($validated['items'] as $line) {
                    OrderItem::query()
                        ->where('order_id', $order->id)
                        ->whereKey($line['id'])
                        ->update([
                            'color' => $line['color'] ?? null,
                            'size' => $line['size'] ?? null,
                            'price' => round((float) $line['price'], 2),
                            'quantity' => (int) $line['quantity'],
                        ]);
                }
            }

            $lines = $order->items()->get(['price', 'quantity'])->toArray();
            $shipping = (float) ($validated['shipping'] ?? $order->shipping);
            $order->fill(Order::calculateTotals($lines, $shipping));
            $order->save();
        });

        $order->load('items');

        return response()->json([
            'message' => 'Order updated successfully.',
            'data' => $this->transformOrder($order),
        ]);
    }

    /** Billing / shipping fields shared by checkout and the admin edit form. */
    private function customerRules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'country' => ['required', 'string', 'max:255'],
            'street_address' => ['required', 'string', 'max:255'],
            'apartment' => ['nullable', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'zip' => ['required', 'string', 'max:50'],
            'phone' => ['required', 'string', 'max:50'],
        ];
    }

    /** Keeps the design summary small: inline (data:) previews are not stored on the order. */
    private function normalizeDesign(?array $design): ?array
    {
        if (empty($design)) {
            return null;
        }

        $image = $design['image'] ?? null;
        if (is_string($image) && (str_starts_with($image, 'data:') || strlen($image) > 2048)) {
            $image = null;
        }

        return [
            'title' => $design['title'] ?? null,
            'image' => $image,
            'unit_price' => isset($design['unit_price']) ? round((float) $design['unit_price'], 2) : null,
        ];
    }

    private function generateOrderNumber(): string
    {
        do {
            $orderNumber = 'TF-' . strtoupper(Str::random(10));
        } while (Order::query()->where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }

    private function transformOrder(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'first_name' => $order->first_name,
            'last_name' => $order->last_name,
            'email' => $order->email,
            'company_name' => $order->company_name,
            'country' => $order->country,
            'street_address' => $order->street_address,
            'apartment' => $order->apartment,
            'state' => $order->state,
            'city' => $order->city,
            'zip' => $order->zip,
            'phone' => $order->phone,
            'notes' => $order->notes,
            'admin_notes' => $order->admin_notes,
            'subtotal' => (float) $order->subtotal,
            'shipping' => (float) $order->shipping,
            'tax' => (float) $order->tax,
            'tax_rate' => Order::TAX_RATE,
            'total' => (float) $order->total,
            'status' => $order->status,
            'units' => $order->items->sum('quantity'),
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'items' => $order->items->map(fn (OrderItem $item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name' => $item->name,
                'color' => $item->color,
                'size' => $item->size,
                'design' => $item->design,
                'image' => $item->image,
                'price' => (float) $item->price,
                'quantity' => $item->quantity,
                'line_total' => round((float) $item->price * $item->quantity, 2),
            ])->values(),
        ];
    }
}
