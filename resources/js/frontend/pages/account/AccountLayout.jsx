import { LayoutDashboard, LogOut, MapPin, Package, Palette, ShieldCheck, UserRound } from 'lucide-react';
import { Suspense, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { PanelSkeleton } from '../../components/account/ui.jsx';
import useAuth, { logout } from '../../hooks/useAuth';

const navItems = [
    { to: '/account', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/account/orders', label: 'Orders', icon: Package },
    { to: '/account/designs', label: 'My Designs', icon: Palette },
    { to: '/account/addresses', label: 'Addresses', icon: MapPin },
    { to: '/account/details', label: 'Account Details', icon: UserRound },
];

function navClass({ isActive }) {
    return `flex shrink-0 items-center gap-3 whitespace-nowrap border-b-2 px-1 py-3 text-[0.82rem] font-semibold uppercase tracking-[0.1em] transition-colors lg:border-b-0 lg:border-l-2 lg:px-4 ${
        isActive
            ? 'border-zinc-900 text-zinc-950 lg:bg-white'
            : 'border-transparent text-slate-500 hover:text-zinc-900'
    }`;
}

export default function AccountLayout() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    if (isLoading) {
        return (
            <section className="bg-[#f5f5f3] px-5 py-12 sm:px-8 lg:px-12">
                <div className="mx-auto w-full max-w-[1400px]">
                    <PanelSkeleton rows={3} />
                </div>
            </section>
        );
    }

    if (!isAuthenticated) {
        const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
        return <Navigate to={`/login?redirect=${redirect}`} replace />;
    }

    async function handleLogout() {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await logout();
        } catch {
            // The local session is cleared either way.
        }
        navigate('/login', { replace: true });
    }

    const isCorporate = user.account_type === 'corporate';
    const displayName = isCorporate ? user.company_name || user.name : user.first_name || user.name;

    return (
        <section className="bg-[#f5f5f3] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
            <div className="mx-auto w-full max-w-[1400px]">
                <div className="flex flex-col gap-2 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-slate-500">My Account</p>
                        <h1 className="mt-1 font-serif text-[2.1rem] uppercase tracking-[0.02em] text-zinc-900 sm:text-[2.6rem]">
                            Hello, {displayName}
                        </h1>
                    </div>
                    <span className="inline-flex w-fit items-center gap-1.5 border border-zinc-300 bg-white px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                        {isCorporate ? 'Corporate account' : 'Personal account'}
                    </span>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
                    <aside className="min-w-0">
                        <nav
                            aria-label="Account"
                            className="-mx-5 flex gap-6 overflow-x-auto border-b border-zinc-200 px-5 sm:mx-0 sm:px-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:border-b-0"
                        >
                            {navItems.map(({ to, label, icon: Icon, end }) => (
                                <NavLink key={to} to={to} end={end} className={navClass}>
                                    <Icon className="hidden size-4 lg:block" strokeWidth={1.75} />
                                    {label}
                                </NavLink>
                            ))}

                            {user.is_admin ? (
                                <a href="/admin/dashboard" className={navClass({ isActive: false })}>
                                    <ShieldCheck className="hidden size-4 lg:block" strokeWidth={1.75} />
                                    Admin Panel
                                </a>
                            ) : null}

                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className={`${navClass({ isActive: false })} text-left disabled:opacity-60`}
                            >
                                <LogOut className="hidden size-4 lg:block" strokeWidth={1.75} />
                                {isLoggingOut ? 'Logging out…' : 'Log out'}
                            </button>
                        </nav>
                    </aside>

                    <div className="min-w-0 border border-zinc-200 bg-white p-5 sm:p-8">
                        <Suspense fallback={<PanelSkeleton />}>
                            <Outlet />
                        </Suspense>
                    </div>
                </div>
            </div>
        </section>
    );
}
