<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'country' => ['required', 'string', 'max:255'],
            'street_address' => ['required', 'string', 'max:255'],
            'apartment' => ['nullable', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'zip' => ['required', 'string', 'max:50'],
            'phone' => ['required', 'string', 'max:50'],
            'subtotal' => ['required', 'numeric', 'min:0'],
            'shipping' => ['required', 'numeric', 'min:0'],
            'tax' => ['required', 'numeric', 'min:0'],
            'total' => ['required', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['nullable'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.image' => ['nullable', 'string'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $order = Order::query()->create([
            'user_id' => $request->user()?->id,
            'order_number' => $this->generateOrderNumber(),
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'company_name' => $validated['company_name'] ?? null,
            'country' => $validated['country'],
            'street_address' => $validated['street_address'],
            'apartment' => $validated['apartment'] ?? null,
            'state' => $validated['state'],
            'city' => $validated['city'],
            'zip' => $validated['zip'],
            'phone' => $validated['phone'],
            'subtotal' => $validated['subtotal'],
            'shipping' => $validated['shipping'],
            'tax' => $validated['tax'],
            'total' => $validated['total'],
            'status' => 'pending',
        ]);

        foreach ($validated['items'] as $item) {
            $order->items()->create([
                'product_id' => is_numeric($item['id'] ?? null) ? (int) $item['id'] : null,
                'name' => $item['name'],
                'image' => $item['image'] ?? null,
                'price' => (float) $item['price'],
                'quantity' => (int) $item['quantity'],
            ]);
        }

        $order->load('items');

        return response()->json([
            'message' => 'Order placed successfully.',
            'data' => $this->transformOrder($order),
        ], 201);
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
            'company_name' => $order->company_name,
            'country' => $order->country,
            'street_address' => $order->street_address,
            'apartment' => $order->apartment,
            'state' => $order->state,
            'city' => $order->city,
            'zip' => $order->zip,
            'phone' => $order->phone,
            'subtotal' => (float) $order->subtotal,
            'shipping' => (float) $order->shipping,
            'tax' => (float) $order->tax,
            'total' => (float) $order->total,
            'status' => $order->status,
            'created_at' => $order->created_at,
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->product_id,
                'name' => $item->name,
                'image' => $item->image,
                'price' => (float) $item->price,
                'quantity' => $item->quantity,
            ]),
        ];
    }
}
