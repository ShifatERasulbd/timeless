<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    // Must match SHIPPING_FLAT_RATE and TAX_RATE in resources/js/utils/cart.js.
    public const SHIPPING_FLAT_RATE = 10;
    public const TAX_RATE = 0.10;

    protected $fillable = [
        'user_id',
        'order_number',
        'first_name',
        'last_name',
        'email',
        'company_name',
        'country',
        'street_address',
        'apartment',
        'state',
        'city',
        'zip',
        'phone',
        'notes',
        'subtotal',
        'shipping',
        'tax',
        'total',
        'status',
        'admin_notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'shipping' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Totals for a set of lines, each with a per-unit `price` and a `quantity`.
     * Mirrors orderTotals() in resources/js/utils/cart.js so the storefront and the stored order agree.
     *
     * @param  iterable<array{price: float|int|string, quantity: int|string}>  $lines
     * @return array{subtotal: float, shipping: float, tax: float, total: float}
     */
    public static function calculateTotals(iterable $lines, float $shipping): array
    {
        $subtotal = 0.0;
        foreach ($lines as $line) {
            $subtotal += round((float) $line['price'], 2) * (int) $line['quantity'];
        }

        $subtotal = round($subtotal, 2);
        $tax = round($subtotal * self::TAX_RATE, 2);
        $total = $subtotal > 0 ? $subtotal + $shipping + $tax : 0.0;

        return [
            'subtotal' => $subtotal,
            'shipping' => round($shipping, 2),
            'tax' => $tax,
            'total' => round($total, 2),
        ];
    }
}
