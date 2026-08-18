import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { featuresFontClass } from '../../utils/typography';

function readCart() {
    try {
        const raw = localStorage.getItem('timeless_cart');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeCart(items) {
    localStorage.setItem('timeless_cart', JSON.stringify(items));
}

export default function CartPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState(() => readCart());

    const total = useMemo(() => {
        return items.reduce((sum, item) => {
            const value = Number(String(item.price).replace(/[^0-9.]/g, '')) || 0;
            return sum + value * (item.quantity || 0);
        }, 0);
    }, [items]);

    function updateQuantity(itemId, delta) {
        setItems((previous) => {
            const next = previous
                .map((item) => {
                    if (item.id !== itemId) {
                        return item;
                    }

                    const qty = Math.max(1, (item.quantity || 1) + delta);
                    return { ...item, quantity: qty };
                });

            writeCart(next);
            return next;
        });
    }

    function removeItem(itemId) {
        setItems((previous) => {
            const next = previous.filter((item) => item.id !== itemId);
            writeCart(next);
            return next;
        });
    }

    function proceedToCheckout() {
        localStorage.setItem('timeless_checkout_now', JSON.stringify(items));
        navigate('/checkout');
    }

    return (
        <section className={`${featuresFontClass} bg-white px-5 py-10 sm:px-8 lg:px-12`}>
            <div className="mx-auto w-full max-w-[1200px]">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Your Cart</h1>

                {items.length === 0 ? (
                    <div className="mt-8 rounded-md border border-zinc-200 p-6">
                        <p className="text-zinc-600">Your cart is empty.</p>
                        <Link to="/shop" className="mt-4 inline-flex bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
                        <div className="space-y-4">
                            {items.map((item) => (
                                <article key={item.id} className="grid items-center gap-4 rounded-md border border-zinc-200 p-4 sm:grid-cols-[90px_1fr_auto]">
                                    <img src={item.image} alt={item.name} className="h-20 w-20 object-cover" />

                                    <div>
                                        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">{item.name}</h2>
                                        <p className="mt-1 text-sm text-zinc-600">{item.price} | {item.color} | {item.size}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => updateQuantity(item.id, -1)} className="h-9 w-9 border border-zinc-300 text-zinc-800">-</button>
                                        <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                        <button type="button" onClick={() => updateQuantity(item.id, 1)} className="h-9 w-9 border border-zinc-300 text-zinc-800">+</button>
                                        <button type="button" onClick={() => removeItem(item.id)} className="ml-2 text-sm text-red-600 hover:text-red-700">Remove</button>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <aside className="h-fit rounded-md border border-zinc-200 p-5">
                            <h3 className="text-lg font-semibold text-zinc-900">Summary</h3>
                            <p className="mt-4 text-sm text-zinc-600">Items: {items.length}</p>
                            <p className="mt-1 text-xl font-semibold text-zinc-900">Total: ${total.toFixed(2)}</p>
                            <button
                                type="button"
                                onClick={proceedToCheckout}
                                className="mt-5 w-full bg-[#e65c00] py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#d55400]"
                            >
                                Proceed to Checkout
                            </button>
                        </aside>
                    </div>
                )}
            </div>
        </section>
    );
}
