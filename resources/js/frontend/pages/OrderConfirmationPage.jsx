import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

import { featuresFontClass } from '../../utils/typography';

const ORDER_STORAGE_KEY = 'timeless_last_order';

function readStoredOrder() {
    try {
        const raw = sessionStorage.getItem(ORDER_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export default function OrderConfirmationPage() {
    const location = useLocation();
    const [order] = useState(() => location.state?.order || readStoredOrder());

    const formattedDate = useMemo(() => {
        if (!order?.createdAt) return '-';

        try {
            return new Date(order.createdAt).toLocaleString();
        } catch {
            return '-';
        }
    }, [order]);

    if (!order) {
        return (
            <section className={`${featuresFontClass} bg-white px-5 py-16 sm:px-8 lg:px-12`}>
                <div className="mx-auto flex w-full max-w-[700px] flex-col items-center gap-4 text-center">
                    <h1 className="text-2xl font-semibold text-zinc-900">No order found</h1>
                    <p className="text-zinc-600">We couldn't find any recent order. Please place an order first.</p>
                    <Link to="/shop" className="mt-2 inline-flex bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
                        Go to Shop
                    </Link>
                </div>
            </section>
        );
    }

    const { billing = {} } = order;

    return (
        <section className={`${featuresFontClass} bg-white px-5 py-10 sm:px-8 lg:px-12`}>
            <div className="mx-auto w-full max-w-[900px]">
                <div className="flex flex-col items-center gap-3 border-b border-zinc-200 pb-8 text-center">
                    <CheckCircle2 className="size-12 text-emerald-600" />
                    <h1 className="text-[2rem] font-normal uppercase tracking-wide text-zinc-900">Order Confirmed</h1>
                    <p className="text-zinc-600">Thank you, {billing.firstName}! Your order has been placed successfully.</p>
                </div>

                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                    <div>
                        <h2 className="text-[0.8rem] font-medium uppercase tracking-wider text-zinc-500 mb-2">Order Number</h2>
                        <p className="text-sm font-semibold text-zinc-900">{order.orderNumber}</p>
                    </div>
                    <div>
                        <h2 className="text-[0.8rem] font-medium uppercase tracking-wider text-zinc-500 mb-2">Date Placed</h2>
                        <p className="text-sm font-semibold text-zinc-900">{formattedDate}</p>
                    </div>
                    <div>
                        <h2 className="text-[0.8rem] font-medium uppercase tracking-wider text-zinc-500 mb-2">Shipping Address</h2>
                        <p className="text-sm text-zinc-700">
                            {billing.firstName} {billing.lastName}
                            <br />
                            {billing.streetAddress}
                            {billing.apartment ? `, ${billing.apartment}` : ''}
                            <br />
                            {billing.city}, {billing.state} {billing.zip}
                            <br />
                            {billing.country}
                        </p>
                    </div>
                    <div>
                        <h2 className="text-[0.8rem] font-medium uppercase tracking-wider text-zinc-500 mb-2">Contact</h2>
                        <p className="text-sm text-zinc-700">{billing.phone}</p>
                    </div>
                </div>

                <div className="mt-10">
                    <h2 className="text-[1.1rem] font-medium uppercase tracking-wide text-zinc-900 pb-4 border-b border-zinc-200">
                        Order Summary
                    </h2>
                    <div className="divide-y divide-zinc-200">
                        {(order.items || []).map((item, index) => (
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
                            <span className="font-medium text-zinc-900">${Number(order.subtotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span className="font-medium text-zinc-900">${Number(order.shipping || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax</span>
                            <span className="font-medium text-zinc-900">${Number(order.tax || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
                        <span className="text-base font-semibold text-zinc-900">Total</span>
                        <span className="text-xl font-bold text-zinc-900">${Number(order.total || 0).toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-10 flex justify-center">
                    <Link to="/shop" className="inline-flex bg-zinc-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-black">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </section>
    );
}
