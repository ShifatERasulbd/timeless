import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
    TAX_RATE,
    cartItemDesignPrice,
    cartItemLineTotal,
    cartItemUnitPrice,
    orderTotals,
    readCart,
    withQuantity,
    writeCart,
} from '../../utils/cart';

// Product | Details | Quantity | Price | Total | Action
const COLUMNS = 'md:grid-cols-[96px_minmax(0,1fr)_128px_88px_88px_56px]';
const cardClass = 'rounded-2xl border border-zinc-200/80 bg-white shadow-[0_8px_30px_rgba(15,29,64,0.06)]';

function money(amount) {
    return `$${amount.toFixed(2)}`;
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4 text-zinc-600">
            <dt>{label}</dt>
            <dd className="font-medium tabular-nums text-zinc-900">{value}</dd>
        </div>
    );
}

function QuantityStepper({ item, onChange }) {
    const quantity = Number(item.quantity) || 1;

    return (
        <div className="inline-flex h-10 items-center rounded-lg border border-zinc-300 bg-white">
            <button
                type="button"
                onClick={() => onChange(-1)}
                disabled={quantity <= 1}
                aria-label={`Decrease quantity of ${item.name}`}
                className="flex h-full w-10 items-center justify-center text-zinc-700 transition-colors hover:text-zinc-950 disabled:text-zinc-300"
            >
                <Minus className="size-4" strokeWidth={1.75} />
            </button>
            <span className="min-w-8 text-center text-[0.92rem] font-medium tabular-nums text-zinc-900" aria-live="polite">
                {quantity}
            </span>
            <button
                type="button"
                onClick={() => onChange(1)}
                aria-label={`Increase quantity of ${item.name}`}
                className="flex h-full w-10 items-center justify-center text-zinc-700 transition-colors hover:text-zinc-950"
            >
                <Plus className="size-4" strokeWidth={1.75} />
            </button>
        </div>
    );
}

function CartRow({ item, onQuantityChange, onRemove }) {
    const designPrice = cartItemDesignPrice(item);

    return (
        <li className={`grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-4 px-5 py-6 md:items-center md:gap-x-4 md:px-6 ${COLUMNS}`}>
            <img src={item.image} alt={item.name} className="aspect-[4/5] w-full rounded-lg bg-zinc-100 object-cover" />

            {/* Details */}
            <div className="min-w-0 space-y-1.5 text-[0.88rem] text-zinc-600">
                <h2 className="text-[1rem] font-semibold text-[#0f1d40]">{item.name}</h2>
                {item.color ? (
                    <p className="flex items-center gap-2">
                        Colour: <span className="font-medium text-zinc-900">{item.color}</span>
                        {item.colorValue ? (
                            <span className="size-4 rounded-full border border-zinc-300" style={{ backgroundColor: item.colorValue }} aria-hidden="true" />
                        ) : null}
                    </p>
                ) : null}
                {item.size ? (
                    <p>
                        Size: <span className="font-semibold text-zinc-900">{item.size}</span>
                    </p>
                ) : null}
                {item.design ? (
                    <div className="flex items-center gap-2 pt-1">
                        {item.design.image ? (
                            <img src={item.design.image} alt="" className="size-8 rounded border border-zinc-200 object-contain" />
                        ) : null}
                        <p>
                            Design: <span className="font-medium text-zinc-900">{item.design.title || 'Custom design'}</span>
                            <span className="text-zinc-500"> (+{money(designPrice)} / unit)</span>
                        </p>
                    </div>
                ) : null}
            </div>

            {/* Quantity, price, total and remove: one row on mobile, separate columns on desktop. */}
            <div className="col-span-2 flex flex-wrap items-center justify-between gap-4 md:contents">
                <QuantityStepper item={item} onChange={onQuantityChange} />

                <div className="text-[0.92rem]">
                    <span className="mr-1 text-zinc-500 md:hidden">Price</span>
                    <span className="font-semibold tabular-nums text-[#0f1d40]">{money(cartItemUnitPrice(item))}</span>
                    {designPrice > 0 ? (
                        <span className="block text-[0.75rem] text-zinc-500">+{money(designPrice)} design</span>
                    ) : null}
                </div>

                <div className="text-[0.92rem]">
                    <span className="mr-1 text-zinc-500 md:hidden">Total</span>
                    <span className="font-semibold tabular-nums text-[#0f1d40]">{money(cartItemLineTotal(item))}</span>
                </div>

                <div className="md:text-right">
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label={`Remove ${item.name}`}
                        className="inline-flex size-9 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                        <Trash2 className="size-[18px]" strokeWidth={1.75} />
                    </button>
                </div>
            </div>
        </li>
    );
}

export default function CartPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState(() => readCart());
    const totals = useMemo(() => orderTotals(items), [items]);

    function saveItems(next) {
        writeCart(next);
        setItems(next);
    }

    function updateQuantity(itemId, delta) {
        saveItems(items.map((item) => (
            item.id === itemId ? withQuantity(item, (Number(item.quantity) || 1) + delta) : item
        )));
    }

    function removeItem(itemId) {
        saveItems(items.filter((item) => item.id !== itemId));
    }

    function clearCart() {
        if (window.confirm('Remove all items from your cart?')) saveItems([]);
    }

    function proceedToCheckout() {
        localStorage.setItem('timeless_checkout_now', JSON.stringify(items));
        navigate('/checkout');
    }

    return (
        <section className="bg-[#f9f9f8] px-5 py-10 font-poppins sm:px-8 lg:px-12 lg:py-14">
            <div className="mx-auto w-full max-w-[1280px]">
                <h1 className="text-[2.1rem] font-bold tracking-tight text-[#0f1d40] sm:text-[2.4rem]">Your Cart</h1>
                <p className="mt-1 text-[0.95rem] text-zinc-500">Manage your shopping cart items</p>

                {items.length === 0 ? (
                    <div className={`${cardClass} mt-8 flex flex-col items-center px-6 py-16 text-center`}>
                        <ShoppingCart className="size-10 text-zinc-300" strokeWidth={1.5} />
                        <p className="mt-4 text-[1rem] text-zinc-600">Your cart is empty.</p>
                        <Link
                            to="/shop"
                            className="mt-6 inline-flex h-12 items-center gap-2 rounded-lg bg-[#0f1d40] px-6 text-[0.9rem] font-medium text-white transition-colors hover:bg-[#1b2c5a]"
                        >
                            Continue Shopping
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <div>
                            <div className={`${cardClass} overflow-hidden`}>
                                <div className={`hidden gap-x-4 border-b border-zinc-200 px-6 py-4 text-[0.88rem] font-semibold text-[#0f1d40] md:grid ${COLUMNS}`}>
                                    <span>Product</span>
                                    <span>Details</span>
                                    <span>Quantity</span>
                                    <span>Price</span>
                                    <span>Total</span>
                                    <span className="text-right">Action</span>
                                </div>

                                <ul className="divide-y divide-zinc-200">
                                    {items.map((item) => (
                                        <CartRow
                                            key={item.id}
                                            item={item}
                                            onQuantityChange={(delta) => updateQuantity(item.id, delta)}
                                            onRemove={() => removeItem(item.id)}
                                        />
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                                <Link
                                    to="/shop"
                                    className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#0f1d40] bg-white px-6 text-[0.9rem] font-medium text-[#0f1d40] transition-colors hover:bg-[#0f1d40] hover:text-white"
                                >
                                    <ArrowLeft className="size-4" />
                                    Continue Shopping
                                </Link>
                                <button
                                    type="button"
                                    onClick={clearCart}
                                    className="inline-flex items-center gap-2 text-[0.9rem] text-zinc-700 transition-colors hover:text-red-600"
                                >
                                    <Trash2 className="size-[18px]" strokeWidth={1.75} />
                                    Clear Cart
                                </button>
                            </div>
                        </div>

                        <aside className={`${cardClass} p-6 lg:sticky lg:top-28`}>
                            <h2 className="text-[1.2rem] font-semibold text-[#0f1d40]">Order Summary</h2>

                            <dl className="mt-6 space-y-4 text-[0.92rem]">
                                <div>
                                    <SummaryRow
                                        label={`Subtotal (${totals.units} ${totals.units === 1 ? 'unit' : 'units'})`}
                                        value={money(totals.subtotal)}
                                    />
                                    {totals.designs > 0 ? (
                                        <p className="mt-1 text-[0.78rem] text-zinc-500">Includes {money(totals.designs)} in design charges</p>
                                    ) : null}
                                </div>
                                <SummaryRow label="Shipping" value={money(totals.shipping)} />
                                <SummaryRow label={`Tax (${Math.round(TAX_RATE * 100)}%)`} value={money(totals.tax)} />
                            </dl>

                            <div className="my-5 h-px bg-zinc-200" />

                            <div className="flex items-baseline justify-between text-[1.2rem] font-bold text-[#0f1d40]">
                                <span>Total</span>
                                <span className="tabular-nums">{money(totals.total)}</span>
                            </div>

                            <button
                                type="button"
                                onClick={proceedToCheckout}
                                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0f1d40] text-[0.92rem] font-medium text-white transition-colors hover:bg-[#1b2c5a]"
                            >
                                Proceed to Checkout
                                <ArrowRight className="size-4" />
                            </button>
                        </aside>
                    </div>
                )}
            </div>
        </section>
    );
}
