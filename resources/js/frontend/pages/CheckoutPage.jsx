import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { featuresFontClass } from '../../utils/typography';
import {
    cartItemDesignPrice,
    cartItemLineTotal,
    cartItemUnitPrice,
    orderTotals,
    readCart,
    writeCart,
} from '../../utils/cart';
import { createOrder, ORDER_STORAGE_KEY } from '../api/ordersApi';

const CHECKOUT_NOW_KEY = 'timeless_checkout_now';

const inputClass = 'w-full rounded-sm border bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none';

function readCheckoutItems() {
    try {
        const direct = localStorage.getItem(CHECKOUT_NOW_KEY);
        if (direct) {
            const parsedDirect = JSON.parse(direct);
            if (Array.isArray(parsedDirect) && parsedDirect.length) {
                return parsedDirect;
            }
        }
    } catch {
        // fall back to the cart
    }

    return readCart();
}

/** Line payload for POST /api/orders. `price` is per unit and includes any design charge. */
function toOrderLine(item) {
    const designPrice = cartItemDesignPrice(item);

    return {
        product_id: Number(item.productId) || null,
        name: item.name,
        image: item.image || null,
        color: item.color || null,
        size: item.size || null,
        design: item.design
            ? {
                title: item.design.title || null,
                image: item.design.image || null,
                unit_price: designPrice,
            }
            : null,
        price: Number((cartItemUnitPrice(item) + designPrice).toFixed(2)),
        quantity: Number(item.quantity) || 1,
    };
}

function Field({ label, name, required = false, error, className = '', children, ...inputProps }) {
    const id = `checkout-${name}`;

    return (
        <div className={className}>
            {label ? (
                <label htmlFor={id} className="mb-1.5 block text-[0.8rem] uppercase tracking-wider text-zinc-700">
                    {label} {required ? <span className="text-red-500">*</span> : null}
                </label>
            ) : null}
            {children || (
                <input
                    id={id}
                    name={name}
                    required={required}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className={`${inputClass} ${error ? 'border-red-500 focus:border-red-600' : 'border-zinc-300 focus:border-zinc-900'}`}
                    {...inputProps}
                />
            )}
            {error ? (
                <p id={`${id}-error`} className="mt-1 text-xs text-red-600">{error}</p>
            ) : null}
        </div>
    );
}

export default function CheckoutPage() {
    const navigate = useNavigate();
    const formRef = useRef(null);
    const [items] = useState(() => readCheckoutItems());
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [placeOrderError, setPlaceOrderError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    // Same totals as the cart page: quantity price tiers plus any design charges.
    const { subtotal, shipping, tax, total } = useMemo(() => orderTotals(items), [items]);

    function handlePlaceOrder(event) {
        event.preventDefault();
        if (isPlacingOrder) return;

        const billing = Object.fromEntries(new FormData(formRef.current).entries());

        setPlaceOrderError('');
        setFieldErrors({});
        setIsPlacingOrder(true);

        createOrder({ ...billing, items: items.map(toOrderLine) })
            .then((savedOrder) => {
                try {
                    sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(savedOrder));
                } catch {
                    // ignore storage quota errors, the order is still passed via navigation state
                }

                // Only remove what was bought: "Buy now" checks out a single line and leaves the rest of the cart.
                const purchasedIds = new Set(items.map((item) => item.id));
                writeCart(readCart().filter((line) => !purchasedIds.has(line.id)));
                localStorage.removeItem(CHECKOUT_NOW_KEY);

                navigate('/order-confirmation', { replace: true, state: { order: savedOrder } });
            })
            .catch((error) => {
                const errors = error.payload?.errors || {};
                setFieldErrors(Object.fromEntries(Object.entries(errors).map(([key, messages]) => [key, messages[0]])));
                setPlaceOrderError(
                    error.status === 422
                        ? 'Please check the highlighted fields and try again.'
                        : error.message || 'Unable to place the order. Please try again.'
                );
                setIsPlacingOrder(false);
            });
    }

    return (
        <section className={`${featuresFontClass} bg-white px-5 py-10 sm:px-8 lg:px-12`}>
            <div className="mx-auto w-full max-w-[1400px]">
                <h1 className="text-[2.5rem] font-normal uppercase tracking-wide text-zinc-900">Checkout</h1>

                {items.length === 0 ? (
                    <div className="mt-8 rounded-md border border-zinc-200 p-6">
                        <p className="text-zinc-600">No items available for checkout.</p>
                        <Link to="/shop" className="mt-4 inline-flex bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
                            Go to Shop
                        </Link>
                    </div>
                ) : (
                    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_420px] lg:items-start">
                        {/* Left Column: Billing Details Form */}
                        <div className="space-y-6">
                            <h2 className="text-[1.25rem] font-medium uppercase tracking-wide text-zinc-900">Billing Details</h2>

                            <form id="checkout-form" ref={formRef} onSubmit={handlePlaceOrder} className="space-y-5">
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <Field label="First name" name="first_name" required autoComplete="given-name" error={fieldErrors.first_name} />
                                    <Field label="Last name" name="last_name" required autoComplete="family-name" error={fieldErrors.last_name} />
                                </div>

                                <Field label="Company name (optional)" name="company_name" autoComplete="organization" error={fieldErrors.company_name} />

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <Field label="Email address" name="email" type="email" required autoComplete="email" error={fieldErrors.email} />
                                    <Field label="Phone" name="phone" type="tel" required autoComplete="tel" error={fieldErrors.phone} />
                                </div>

                                <Field label="Country / Region" name="country" required autoComplete="country-name" error={fieldErrors.country} />

                                <div className="space-y-3">
                                    <Field
                                        label="Street address"
                                        name="street_address"
                                        required
                                        autoComplete="address-line1"
                                        placeholder="House number and street name"
                                        error={fieldErrors.street_address}
                                    />
                                    <Field
                                        name="apartment"
                                        autoComplete="address-line2"
                                        placeholder="Apartment, suite, unit, etc. (optional)"
                                        aria-label="Apartment, suite, unit (optional)"
                                        error={fieldErrors.apartment}
                                    />
                                </div>

                                <Field label="State" name="state" required autoComplete="address-level1" error={fieldErrors.state} />

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <Field label="Town / City" name="city" required autoComplete="address-level2" error={fieldErrors.city} />
                                    <Field label="ZIP Code" name="zip" required autoComplete="postal-code" error={fieldErrors.zip} />
                                </div>

                                <Field label="Order notes (optional)" name="notes" error={fieldErrors.notes}>
                                    <textarea
                                        id="checkout-notes"
                                        name="notes"
                                        rows={4}
                                        maxLength={2000}
                                        placeholder="Notes about your order, e.g. special notes for delivery."
                                        className={`${inputClass} border-zinc-300 focus:border-zinc-900`}
                                    />
                                </Field>
                            </form>
                        </div>

                        {/* Right Column: Your Order Summary Box */}
                        <aside className="rounded-sm border border-zinc-200 bg-[#FBFBFA] p-6">
                            <h3 className="border-b border-zinc-200 pb-4 text-[1.1rem] font-medium uppercase tracking-wide text-zinc-900">
                                Your Order
                            </h3>

                            <div className="divide-y divide-zinc-200">
                                {items.map((item, index) => (
                                    <div key={item.id || index} className="flex items-center gap-4 py-4">
                                        <div className="h-16 w-14 flex-shrink-0 overflow-hidden rounded bg-zinc-200">
                                            <img
                                                src={item.image || '/uploads/heroes/images/hero1.webp'}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-1 items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                                                <p className="mt-0.5 text-xs text-zinc-500">
                                                    {[item.color, item.size, `Qty: ${item.quantity || 1}`].filter(Boolean).join(' · ')}
                                                </p>
                                                {item.design ? (
                                                    <p className="mt-0.5 text-xs text-zinc-500">Design: {item.design.title || 'Custom design'}</p>
                                                ) : null}
                                            </div>
                                            <p className="text-sm font-medium tabular-nums text-zinc-900">
                                                ${cartItemLineTotal(item).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-medium tabular-nums text-zinc-900">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="font-medium tabular-nums text-zinc-900">${shipping.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span className="font-medium tabular-nums text-zinc-900">${tax.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
                                <span className="text-base font-semibold text-zinc-900">Total</span>
                                <span className="text-xl font-bold tabular-nums text-zinc-900">${total.toFixed(2)}</span>
                            </div>

                            <button
                                type="submit"
                                form="checkout-form"
                                disabled={isPlacingOrder}
                                className="mt-6 w-full bg-[#E56338] py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#d0552e] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isPlacingOrder ? 'Placing Order…' : 'Place Order'}
                            </button>

                            {placeOrderError && (
                                <p role="alert" className="mt-3 text-center text-xs font-medium text-red-600">{placeOrderError}</p>
                            )}

                            <p className="mt-4 text-center text-[0.75rem] leading-relaxed text-zinc-500">
                                Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
                            </p>
                        </aside>
                    </div>
                )}
            </div>
        </section>
    );
}
