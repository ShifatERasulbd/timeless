import { Link } from 'react-router-dom';

import { formatDate, money, StatusBadge } from './ui.jsx';

export default function OrdersTable({ orders }) {
    return (
        <div className="divide-y divide-zinc-200 border-y border-zinc-200">
            <div className="hidden grid-cols-[1.3fr_1fr_1fr_0.8fr_auto] gap-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid">
                <span>Order</span>
                <span>Date</span>
                <span>Status</span>
                <span className="text-right">Total</span>
                <span className="w-16" />
            </div>
            {orders.map((order) => (
                <div
                    key={order.id}
                    className="grid grid-cols-2 items-center gap-x-4 gap-y-2 py-4 md:grid-cols-[1.3fr_1fr_1fr_0.8fr_auto]"
                >
                    <Link
                        to={`/account/orders/${encodeURIComponent(order.order_number)}`}
                        className="font-semibold text-zinc-950 underline-offset-4 hover:underline"
                    >
                        #{order.order_number}
                    </Link>
                    <span className="text-right text-[0.92rem] text-slate-600 md:text-left">{formatDate(order.created_at)}</span>
                    <span>
                        <StatusBadge status={order.status} />
                    </span>
                    <span className="text-right text-[0.95rem] tabular-nums text-zinc-900">
                        {money(order.total)}
                        <span className="block text-[0.78rem] text-slate-500">
                            {order.units} {order.units === 1 ? 'item' : 'items'}
                        </span>
                    </span>
                    <Link
                        to={`/account/orders/${encodeURIComponent(order.order_number)}`}
                        className="col-span-2 inline-flex h-9 items-center justify-center border border-zinc-300 px-4 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-zinc-800 transition-colors hover:border-zinc-900 md:col-span-1 md:w-16 md:px-0"
                    >
                        View
                    </Link>
                </div>
            ))}
        </div>
    );
}
