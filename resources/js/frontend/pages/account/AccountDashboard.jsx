import { ArrowRight, MapPin, Package, Palette, Truck, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

import { accountApi } from '../../api/accountApi';
import {
    Alert,
    formatAddressLines,
    formatDate,
    money,
    PanelSkeleton,
    SecondaryButton,
} from '../../components/account/ui.jsx';
import OrdersTable from '../../components/account/OrdersTable.jsx';
import useAccountResource from '../../hooks/useAccountResource';

function StatCard({ icon: Icon, label, value, to }) {
    const content = (
        <>
            <div className="flex items-center justify-between">
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                <Icon className="size-4 text-zinc-400" strokeWidth={1.75} />
            </div>
            <p className="mt-3 text-[1.8rem] font-semibold tabular-nums leading-none text-zinc-950">{value}</p>
        </>
    );

    const className = 'block border border-zinc-200 bg-[#fafaf8] p-5 transition-colors';

    return to ? (
        <Link to={to} className={`${className} hover:border-zinc-900`}>
            {content}
        </Link>
    ) : (
        <div className={className}>{content}</div>
    );
}

export default function AccountDashboard() {
    const { data, error, isLoading, reload } = useAccountResource(() => accountApi.dashboard());

    if (isLoading && !data) return <PanelSkeleton rows={3} />;

    if (error && !data) {
        return (
            <div className="space-y-4">
                <Alert>{error.message}</Alert>
                <SecondaryButton onClick={reload}>Try again</SecondaryButton>
            </div>
        );
    }

    const { user, stats, recent_orders: recentOrders, default_address: defaultAddress } = data;
    const isCorporate = user.account_type === 'corporate';

    return (
        <div className="space-y-10">
            <p className="max-w-3xl text-[1rem] leading-relaxed text-slate-600">
                From your account dashboard you can view your{' '}
                <Link to="/account/orders" className="font-semibold text-zinc-900 underline underline-offset-4">recent orders</Link>, manage your{' '}
                <Link to="/account/addresses" className="font-semibold text-zinc-900 underline underline-offset-4">shipping addresses</Link>, and{' '}
                <Link to="/account/details" className="font-semibold text-zinc-900 underline underline-offset-4">edit your password and account details</Link>.
            </p>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatCard icon={Package} label="Total orders" value={stats.total_orders} to="/account/orders" />
                <StatCard icon={Truck} label="In progress" value={stats.active_orders} to="/account/orders" />
                <StatCard icon={Wallet} label="Total spent" value={money(stats.total_spent)} />
                <StatCard icon={Palette} label="Saved designs" value={stats.saved_designs} to="/account/designs" />
            </div>

            <div>
                <div className="mb-4 flex items-end justify-between gap-4">
                    <h2 className="font-serif text-[1.45rem] uppercase tracking-[0.02em] text-zinc-900">Recent orders</h2>
                    {recentOrders.length ? (
                        <Link
                            to="/account/orders"
                            className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-zinc-800 hover:text-zinc-950"
                        >
                            View all <ArrowRight className="size-3.5" />
                        </Link>
                    ) : null}
                </div>

                {recentOrders.length ? (
                    <OrdersTable orders={recentOrders} />
                ) : (
                    <div className="border border-dashed border-zinc-300 px-6 py-10 text-center">
                        <p className="text-slate-600">You haven&apos;t placed any orders yet.</p>
                        <Link
                            to="/shop"
                            className="mt-4 inline-flex h-11 items-center justify-center bg-black px-6 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-white hover:bg-zinc-800"
                        >
                            Start shopping
                        </Link>
                    </div>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="border border-zinc-200 p-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Account information</h3>
                        <Link to="/account/details" className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-zinc-900 hover:underline">
                            Edit
                        </Link>
                    </div>
                    <dl className="mt-4 space-y-2 text-[0.95rem]">
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">{isCorporate ? 'Company' : 'Name'}</dt>
                            <dd className="text-right font-medium text-zinc-900">{isCorporate ? user.company_name : user.name}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">Email</dt>
                            <dd className="break-all text-right font-medium text-zinc-900">{user.email}</dd>
                        </div>
                        {user.phone ? (
                            <div className="flex justify-between gap-4">
                                <dt className="text-slate-500">Phone</dt>
                                <dd className="text-right font-medium text-zinc-900">{user.phone}</dd>
                            </div>
                        ) : null}
                        {isCorporate && user.tax_id ? (
                            <div className="flex justify-between gap-4">
                                <dt className="text-slate-500">Tax ID</dt>
                                <dd className="text-right font-medium text-zinc-900">{user.tax_id}</dd>
                            </div>
                        ) : null}
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">Member since</dt>
                            <dd className="text-right font-medium text-zinc-900">{formatDate(user.created_at)}</dd>
                        </div>
                    </dl>
                </div>

                <div className="border border-zinc-200 p-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Default shipping address</h3>
                        <Link to="/account/addresses" className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-zinc-900 hover:underline">
                            Manage
                        </Link>
                    </div>
                    {defaultAddress ? (
                        <address className="mt-4 space-y-0.5 text-[0.95rem] not-italic text-zinc-800">
                            {formatAddressLines(defaultAddress).map((line) => (
                                <p key={line}>{line}</p>
                            ))}
                        </address>
                    ) : (
                        <div className="mt-4 flex items-start gap-3 text-[0.95rem] text-slate-600">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                            <p>
                                No address saved yet.{' '}
                                <Link to="/account/addresses?new=1" className="font-semibold text-zinc-900 underline underline-offset-4">
                                    Add one
                                </Link>{' '}
                                to check out faster.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
