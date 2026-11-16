import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { accountApi } from '../../api/accountApi';
import OrdersTable from '../../components/account/OrdersTable.jsx';
import { Alert, PanelHeading, PanelSkeleton, SecondaryButton } from '../../components/account/ui.jsx';
import useAccountResource from '../../hooks/useAccountResource';

const statusFilters = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
];

export default function AccountOrders() {
    const [searchParams, setSearchParams] = useSearchParams();
    const status = statusFilters.some((filter) => filter.value === searchParams.get('status'))
        ? searchParams.get('status')
        : '';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);

    const { data, error, isLoading, reload } = useAccountResource(() => accountApi.orders({ status, page }), [status, page]);

    function changeParams(next) {
        const params = new URLSearchParams();
        if (next.status) params.set('status', next.status);
        if (next.page > 1) params.set('page', String(next.page));
        setSearchParams(params);
    }

    const counts = data?.status_counts || {};
    const totalCount = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
    const meta = data?.meta;

    return (
        <div className="space-y-6">
            <PanelHeading title="Orders" description="Track your orders and review past purchases." />

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter orders by status">
                {statusFilters.map((filter) => {
                    const count = filter.value ? Number(counts[filter.value] || 0) : totalCount;
                    const isActive = filter.value === status;

                    return (
                        <button
                            key={filter.value || 'all'}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => changeParams({ status: filter.value, page: 1 })}
                            className={`inline-flex shrink-0 items-center gap-2 border px-3.5 py-2 text-[0.78rem] font-semibold uppercase tracking-[0.08em] transition-colors ${
                                isActive
                                    ? 'border-zinc-900 bg-zinc-900 text-white'
                                    : 'border-zinc-200 text-zinc-700 hover:border-zinc-900'
                            }`}
                        >
                            {filter.label}
                            {data ? (
                                <span className={`tabular-nums ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{count}</span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            {isLoading && !data ? <PanelSkeleton rows={4} /> : null}

            {error ? (
                <div className="space-y-4">
                    <Alert>{error.message}</Alert>
                    <SecondaryButton onClick={reload}>Try again</SecondaryButton>
                </div>
            ) : null}

            {data && !error ? (
                <div className={isLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                    {data.data.length ? (
                        <OrdersTable orders={data.data} />
                    ) : (
                        <div className="border border-dashed border-zinc-300 px-6 py-12 text-center">
                            <p className="text-slate-600">
                                {status ? `You have no ${status} orders.` : "You haven't placed any orders yet."}
                            </p>
                            <Link
                                to="/shop"
                                className="mt-4 inline-flex h-11 items-center justify-center bg-black px-6 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-white hover:bg-zinc-800"
                            >
                                Browse the shop
                            </Link>
                        </div>
                    )}

                    {meta && meta.last_page > 1 ? (
                        <div className="mt-6 flex items-center justify-between gap-4">
                            <p className="text-[0.88rem] text-slate-500">
                                Page {meta.current_page} of {meta.last_page} · {meta.total} orders
                            </p>
                            <div className="flex gap-2">
                                <SecondaryButton
                                    onClick={() => changeParams({ status, page: meta.current_page - 1 })}
                                    disabled={meta.current_page <= 1 || isLoading}
                                    aria-label="Previous page"
                                    className="px-3"
                                >
                                    <ChevronLeft className="size-4" />
                                </SecondaryButton>
                                <SecondaryButton
                                    onClick={() => changeParams({ status, page: meta.current_page + 1 })}
                                    disabled={meta.current_page >= meta.last_page || isLoading}
                                    aria-label="Next page"
                                    className="px-3"
                                >
                                    <ChevronRight className="size-4" />
                                </SecondaryButton>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
