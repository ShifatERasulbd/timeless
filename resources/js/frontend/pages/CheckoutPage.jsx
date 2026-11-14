import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { featuresFontClass } from '../../utils/typography';
import { writeCart } from '../../utils/cart';
import { createOrder } from '../api/ordersApi';

const ORDER_STORAGE_KEY = 'timeless_last_order';

function readCheckoutItems() {
    try {
        const direct = localStorage.getItem('timeless_checkout_now');
        if (direct) {
            const parsedDirect = JSON.parse(direct);
            if (Array.isArray(parsedDirect) && parsedDirect.length) {
                return parsedDirect;
            }
        }

        const cart = localStorage.getItem('timeless_cart');
        const parsedCart = cart ? JSON.parse(cart) : [];
        return Array.isArray(parsedCart) ? parsedCart : [];
    } catch {
        return [];
    }
}

export default function CheckoutPage() {
    const navigate = useNavigate();
    const formRef = useRef(null);
    const [items] = useState(() => readCheckoutItems());
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [placeOrderError, setPlaceOrderError] = useState('');

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            const value = Number(String(item.price).replace(/[^0-9.]/g, '')) || 0;
            return sum + value * (item.quantity || 0);
        }, 0);
    }, [items]);

    const shipping = items.length > 0 ? 10.0 : 0.0;
    const tax = Number((subtotal * 0.1).toFixed(2));
    const total = subtotal + (subtotal > 0 ? shipping + tax : 0);

    function handlePlaceOrder(event) {
        event.preventDefault();

        const formData = new FormData(formRef.current);
        const billing = Object.fromEntries(formData.entries());

        setPlaceOrderError('');
        setIsPlacingOrder(true);

        createOrder({
            ...billing,
            subtotal,
            shipping,
            tax,
            total,
            items: items.map((item) => ({
                id: item.id,
                name: item.name,
                image: item.image || null,
                price: Number(String(item.price).replace(/[^0-9.]/g, '')) || 0,
                quantity: item.quantity || 1,
            })),
        })
            .then((savedOrder) => {
                const order = {
                    orderNumber: savedOrder.order_number,
                    createdAt: savedOrder.created_at,
                    items,
                    subtotal,
                    shipping,
                    tax,
                    total,
                    billing,
                };

                try {
                    sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
                } catch {
                    // ignore storage quota errors, order still passed via navigation state
                }

                writeCart([]);
                localStorage.removeItem('timeless_checkout_now');

                navigate('/order-confirmation', { state: { order } });
            })
            .catch((error) => {
                setPlaceOrderError(error.message || 'Unable to place the order. Please try again.');
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
                                    <div>
                                        <label className="block text-[0.8rem] uppercase tracking-wider text-zinc-700 mb-1.5">
                                            First name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            required
                                            className="w-full rounded-sm border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[0.8rem] uppercase tracking-wider text-zinc-700 mb-1.5">
                                            Last name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            required
                                            className="w-full rounded-sm border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[0.8rem] uppercase tracking-wider text-zinc-700 mb-1.5">
                                        Company name (optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        className="w-full rounded-sm border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[0.8rem] uppercase tracking-wider text-zinc-700 mb-1.5">
                                        Country / Region <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        required
                                        className="w-full rounded-sm border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[0.8rem] uppercase tracking-wider text-zinc-700 mb-1.5">
                                        Street address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="streetAddress"
                                        required
                                        placeholder="House number and street name"
                                        className="w-full rounded-sm border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        name="apartment"
                                        placeholder="Apartment, suite, unit, etc. (optional)"
                                        className="w-full rounded-sm border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[0.8rem] uppercase tracking-wider text-zinc-700 mb-1.5">
                                        State <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        required
                                        className="w-full rounded-sm border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-[0.8rem] uppercase tracking-wider text-zinc-700 mb-1.5">
                                            Town / City <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            required
                                            className="w-full rounded-sm border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[0.8rem] uppercase tracking-wider text-zinc-700 mb-1.5">
                                            ZIP Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="zip"
                                            required
                                            className="w-full rounded-sm border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[0.8rem] uppercase tracking-wider text-zinc-700 mb-1.5">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        className="w-full rounded-sm border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Right Column: Your Order Summary Box */}
                        <aside className="rounded-sm border border-zinc-200 bg-[#FBFBFA] p-6">
                            <h3 className="text-[1.1rem] font-medium uppercase tracking-wide text-zinc-900 pb-4 border-b border-zinc-200">
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
                                        <div className="flex flex-1 items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                                                <p className="text-xs text-zinc-500 mt-0.5">Qty: {item.quantity || 1}</p>
                                            </div>
                                            <p className="text-sm font-medium text-zinc-900">
                                                ${(Number(String(item.price).replace(/[^0-9.]/g, '')) * (item.quantity || 1)).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-zinc-900">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="font-medium text-zinc-900">${shipping.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span className="font-medium text-zinc-900">${tax.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
                                <span className="text-base font-semibold text-zinc-900">Total</span>
                                <span className="text-xl font-bold text-zinc-900">${total.toFixed(2)}</span>
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
                                <p className="mt-3 text-center text-xs font-medium text-red-600">{placeOrderError}</p>
                            )}

                            <p className="mt-4 text-[0.75rem] leading-relaxed text-zinc-500 text-center">
                                Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
                            </p>
                        </aside>
                    </div>
                )}
            </div>
        </section>
    );
}