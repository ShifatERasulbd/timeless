import { ArrowLeft, Check, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { normalizeImagePath } from '../../../utils/productDisplay';
import { accountApi } from '../../api/accountApi';
import {
    Alert,
    formatAddressLines,
    formatDate,
    money,
    PanelSkeleton,
    SecondaryButton,
    StatusBadge,
} from '../../components/account/ui.jsx';
import useAccountResource from '../../hooks/useAccountResource';

const FALLBACK_IMAGE = '/uploads/heroes/images/hero1.webp';
const progressSteps = ['pending', 'processing', 'shipped', 'delivered'];
const stepLabels = { pending: 'Order placed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered' };

function OrderProgress({ status }) {
    if (status === 'cancelled') {
        return (
            <div className="flex items-start gap-3 border border-zinc-200 bg-zinc-50 px-4 py-3 text-[0.95rem] text-zinc-700">
                <XCircle className="mt-0.5 size-5 shrink-0 text-zinc-500" />
                <p>This order was cancelled. If you were charged, any payment will be refunded.</p>
            </div>
        );
    }

    const currentIndex = Math.max(0, progressSteps.indexOf(status));

    return (
        <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
            {progressSteps.map((step, index) => {
                const isDone = index <= currentIndex;
                return (
                    <li key={step} className="flex flex-col gap-2" aria-current={index === currentIndex ? 'step' : undefined}>
                        <div className={`h-1.5 w-full ${isDone ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
                        <div className="flex items-center gap-1.5">
                            {isDone ? <Check className="hidden size-3.5 text-zinc-900 sm:block" strokeWidth={2.5} /> : null}
                            <span
                                className={`text-[0.72rem] font-semibold uppercase tracking-[0.08em] sm:text-[0.78rem] ${
                                    isDone ? 'text-zinc-900' : 'text-slate-400'
                                }`}
                            >
                                {stepLabels[step]}
                            </span>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

export default function AccountOrderDetail() {
    const { orderNumber } = useParams();
    const { data: order, setData, error, isLoading, reload } = useAccountResource(
        () => accountApi.order(orderNumber),
        [orderNumber]
    );
    const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [actionMessage, setActionMessage] = useState({ tone: 'success', text: '' });

    async function handleCancel() {
        setIsCancelling(true);
        setActionMessage({ tone: 'success', text: '' });
        try {
            const response = await accountApi.cancelOrder(orderNumber);
            setData(response.data);
            setActionMessage({ tone: 'success', text: response.message });
        } catch (cancelError) {
            setActionMessage({ tone: 'error', text: cancelError.message });
            // The status may have changed on the server (e.g. the shop started processing it).
            reload();
        } finally {
            setIsCancelling(false);
            setIsConfirmingCancel(false);
        }
    }

    const backLink = (
        <Link
            to="/account/orders"
            className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-slate-500 hover:text-zinc-900"
        >
            <ArrowLeft className="size-4" /> All orders
        </Link>
    );

    if (isLoading && !order) return <PanelSkeleton rows={3} />;

    if (error && !order) {
        return (
            <div className="space-y-4">
                {backLink}
                <Alert>{error.status === 404 ? "We couldn't find that order in your account." : error.message}</Alert>
                {error.status !== 404 ? <SecondaryButton onClick={reload}>Try again</SecondaryButton> : null}
            </div>
        );
    }

    const addressLines = formatAddressLines(order);

    return (
        <div className="space-y-8">
            {backLink}

            <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="font-serif text-[1.7rem] uppercase tracking-[0.02em] text-zinc-900">Order #{order.order_number}</h2>
                    <p className="mt-1 text-[0.95rem] text-slate-500">
                        Placed on {formatDate(order.created_at, true)} · {order.units} {order.units === 1 ? 'item' : 'items'}
                    </p>
                </div>
                <StatusBadge status={order.status} />
            </div>

            {actionMessage.text ? <Alert tone={actionMessage.tone}>{actionMessage.text}</Alert> : null}

            <OrderProgress status={order.status} />

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                    <h3 className="mb-3 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Items</h3>
                    <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
                        {order.items.map((item) => (
                            <li key={item.id} className="flex gap-4 py-4">
                                <img
                                    src={normalizeImagePath(item.image) || FALLBACK_IMAGE}
                                    alt=""
                                    className="h-20 w-16 shrink-0 bg-zinc-100 object-cover"
                                    onError={(event) => {
                                        event.currentTarget.src = FALLBACK_IMAGE;
                                    }}
                                />
                                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-zinc-900">{item.name}</p>
                                        <p className="mt-0.5 text-[0.85rem] text-slate-500">
                                            {[item.color && `Color: ${item.color}`, item.size && `Size: ${item.size}`].filter(Boolean).join(' · ') || '—'}
                                        </p>
                                        {item.design ? (
                                            <div className="mt-2 flex items-center gap-2">
                                                {item.design.image ? (
                                                    <img
                                                        src={normalizeImagePath(item.design.image)}
                                                        alt=""
                                                        className="size-10 border border-zinc-200 bg-white object-contain"
                                                    />
                                                ) : null}
                                                <p className="text-[0.82rem] text-slate-600">
                                                    Design: {item.design.title || 'Custom design'}
                                                    {item.design.unit_price ? ` (+${money(item.design.unit_price)} each)` : ''}
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="shrink-0 text-left sm:text-right">
                                        <p className="text-[0.85rem] tabular-nums text-slate-500">
                                            {item.quantity} × {money(item.price)}
                                        </p>
                                        <p className="font-semibold tabular-nums text-zinc-900">{money(item.line_total)}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {order.notes ? (
                        <div className="mt-6">
                            <h3 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Order notes</h3>
                            <p className="whitespace-pre-line text-[0.95rem] text-zinc-700">{order.notes}</p>
                        </div>
                    ) : null}
                </div>

                <div className="space-y-6">
                    <div className="border border-zinc-200 bg-[#fafaf8] p-5">
                        <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Summary</h3>
                        <dl className="mt-4 space-y-2.5 text-[0.95rem]">
                            <div className="flex justify-between">
                                <dt className="text-slate-600">Subtotal</dt>
                                <dd className="tabular-nums text-zinc-900">{money(order.subtotal)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-600">Shipping</dt>
                                <dd className="tabular-nums text-zinc-900">{money(order.shipping)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-600">Tax ({Math.round((order.tax_rate || 0) * 100)}%)</dt>
                                <dd className="tabular-nums text-zinc-900">{money(order.tax)}</dd>
                            </div>
                            <div className="flex justify-between border-t border-zinc-200 pt-3 text-[1.05rem] font-semibold">
                                <dt className="text-zinc-900">Total</dt>
                                <dd className="tabular-nums text-zinc-950">{money(order.total)}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="border border-zinc-200 p-5">
                        <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Shipping address</h3>
                        <address className="mt-3 space-y-0.5 text-[0.95rem] not-italic text-zinc-800">
                            {addressLines.map((line) => (
                                <p key={line}>{line}</p>
                            ))}
                            {order.email ? <p className="break-all pt-1 text-slate-600">{order.email}</p> : null}
                        </address>
                    </div>

                    {order.can_cancel ? (
                        <div className="border border-zinc-200 p-5">
                            <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Need to change something?</h3>
                            <p className="mt-2 text-[0.9rem] text-slate-600">You can cancel this order until we start processing it.</p>
                            {isConfirmingCancel ? (
                                <div className="mt-4 space-y-3">
                                    <p className="text-[0.9rem] font-semibold text-zinc-900">Cancel this order?</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={isCancelling}
                                            className="inline-flex h-10 items-center justify-center bg-red-600 px-4 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-white hover:bg-red-700 disabled:opacity-60"
                                        >
                                            {isCancelling ? 'Cancelling…' : 'Yes, cancel order'}
                                        </button>
                                        <SecondaryButton onClick={() => setIsConfirmingCancel(false)} disabled={isCancelling} className="h-10">
                                            Keep order
                                        </SecondaryButton>
                                    </div>
                                </div>
                            ) : (
                                <SecondaryButton onClick={() => setIsConfirmingCancel(true)} className="mt-4 w-full">
                                    Cancel order
                                </SecondaryButton>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
