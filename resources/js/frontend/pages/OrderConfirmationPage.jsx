import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

import { featuresFontClass } from '../../utils/typography';
import { ORDER_STORAGE_KEY } from '../api/ordersApi';
import useAuth from '../hooks/useAuth';

function readStoredOrder() {
    try {
        const raw = sessionStorage.getItem(ORDER_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        // Older entries were saved in a different shape before orders came back from the API.
        return parsed?.order_number ? parsed : null;
    } catch {
        return null;
    }
}

function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

function DetailBlock({ title, children }) {
    return (
        <div>
            <h2 className="mb-2 text-[0.8rem] font-medium uppercase tracking-wider text-zinc-500">{title}</h2>
            {children}
        </div>
    );
}

export default function OrderConfirmationPage() {
    const location = useLocation();
    const [order] = useState(() => location.state?.order || readStoredOrder());
    const { isAuthenticated } = useAuth();

    const formattedDate = useMemo(() => {
        if (!order?.created_at) return '-';

        try {
            return new Date(order.created_at).toLocaleString();
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

    return (
        <section className={`${featuresFontClass} bg-white px-5 py-10 sm:px-8 lg:px-12`}>
            <div className="mx-auto w-full max-w-[900px]">
                <div className="flex flex-col items-center gap-3 border-b border-zinc-200 pb-8 text-center">
                    <CheckCircle2 className="size-12 text-emerald-600" />
                    <h1 className="text-[2rem] font-normal uppercase tracking-wide text-zinc-900">Order Confirmed</h1>
                    <p className="text-zinc-600">
                        Thank you, {order.first_name}! Your order has been placed successfully.
                        {order.email ? <> We'll send updates to <span className="font-medium text-zinc-900">{order.email}</span>.</> : null}
                    </p>
                </div>

                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                    <DetailBlock title="Order Number">
                        <p className="text-sm font-semibold text-zinc-900">{order.order_number}</p>
                    </DetailBlock>
                    <DetailBlock title="Date Placed">
                        <p className="text-sm font-semibold text-zinc-900">{formattedDate}</p>
                    </DetailBlock>
                    <DetailBlock title="Shipping Address">
                        <p className="text-sm text-zinc-700">
                            {order.first_name} {order.last_name}
                            {order.company_name ? <><br />{order.company_name}</> : null}
                            <br />
                            {order.street_address}
                            {order.apartment ? `, ${order.apartment}` : ''}
                            <br />
                            {order.city}, {order.state} {order.zip}
                            <br />
                            {order.country}
                        </p>
                    </DetailBlock>
                    <DetailBlock title="Contact">
                        <p className="text-sm text-zinc-700">
                            {order.email ? <>{order.email}<br /></> : null}
                            {order.phone}
                        </p>
                    </DetailBlock>
                    {order.notes ? (
                        <DetailBlock title="Order Notes">
                            <p className="whitespace-pre-line text-sm text-zinc-700">{order.notes}</p>
                        </DetailBlock>
                    ) : null}
                </div>

                <div className="mt-10">
                    <h2 className="border-b border-zinc-200 pb-4 text-[1.1rem] font-medium uppercase tracking-wide text-zinc-900">
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
                                <div className="flex flex-1 items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                                        <p className="mt-0.5 text-xs text-zinc-500">
                                            {[item.color, item.size, `Qty: ${item.quantity}`].filter(Boolean).join(' · ')}
                                        </p>
                                        {item.design ? (
                                            <p className="mt-0.5 text-xs text-zinc-500">Design: {item.design.title || 'Custom design'}</p>
                                        ) : null}
                                    </div>
                                    <p className="text-sm font-medium tabular-nums text-zinc-900">{money(item.line_total)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-medium tabular-nums text-zinc-900">{money(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span className="font-medium tabular-nums text-zinc-900">{money(order.shipping)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax</span>
                            <span className="font-medium tabular-nums text-zinc-900">{money(order.tax)}</span>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
                        <span className="text-base font-semibold text-zinc-900">Total</span>
                        <span className="text-xl font-bold tabular-nums text-zinc-900">{money(order.total)}</span>
                    </div>
                </div>

                <div className="mt-10 flex flex-wrap justify-center gap-3">
                    <Link to="/shop" className="inline-flex bg-zinc-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-black">
                        Continue Shopping
                    </Link>
                    {isAuthenticated ? (
                        <Link
                            to={`/account/orders/${encodeURIComponent(order.order_number)}`}
                            className="inline-flex border border-zinc-400 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900 hover:border-zinc-900"
                        >
                            Track this order
                        </Link>
                    ) : (
                        <Link
                            to="/register"
                            className="inline-flex border border-zinc-400 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900 hover:border-zinc-900"
                        >
                            Create an account
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
