import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CART_UPDATED_EVENT, readCart, summarizeCart, writeCart } from '../../utils/cart';

export default function CartDropdown() {
    const [items, setItems] = useState(() => readCart());

    useEffect(() => {
        function refresh() {
            setItems(readCart());
        }

        window.addEventListener(CART_UPDATED_EVENT, refresh);
        window.addEventListener('storage', refresh);

        return () => {
            window.removeEventListener(CART_UPDATED_EVENT, refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    function removeItem(itemId) {
        const next = items.filter((item) => item.id !== itemId);
        writeCart(next);
        setItems(next);
    }

    const total = summarizeCart(items).total;

    return (
        // Padding-top keeps the hover area contiguous with the trigger icon (no dead gap).
        <div className="invisible absolute right-0 top-full z-50 max-h-0 w-[340px] overflow-hidden pt-3 opacity-0 transition-[max-height,opacity] duration-300 ease-out group-focus-within:visible group-focus-within:max-h-[480px] group-focus-within:opacity-100 group-hover:visible group-hover:max-h-[480px] group-hover:opacity-100">
            <div className="border border-zinc-200 bg-white p-4 text-left shadow-[0_18px_60px_rgba(0,0,0,0.12)]">
                {items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-zinc-500">Your cart is empty.</p>
                ) : (
                    <>
                        <ul className="max-h-[280px] space-y-3 overflow-y-auto">
                            {items.map((item) => (
                                <li key={item.id} className="flex items-center gap-3">
                                    <img src={item.image} alt={item.name} className="h-14 w-14 shrink-0 object-cover" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[0.8rem] font-semibold uppercase tracking-wide text-zinc-900">
                                            {item.name}
                                        </p>
                                        <p className="text-[0.78rem] text-zinc-500">{item.price} × {item.quantity}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        aria-label={`Remove ${item.name}`}
                                        className="text-[0.75rem] font-medium text-red-600 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3">
                            <span className="text-sm font-medium text-zinc-600">Subtotal</span>
                            <span className="text-sm font-semibold text-zinc-900">${total.toFixed(2)}</span>
                        </div>
                    </>
                )}

                <Link
                    to="/cart"
                    className="mt-4 block w-full bg-zinc-900 py-2.5 text-center text-[0.78rem] font-semibold uppercase tracking-[0.15em] text-white hover:bg-black"
                >
                    View Cart
                </Link>
            </div>
        </div>
    );
}
