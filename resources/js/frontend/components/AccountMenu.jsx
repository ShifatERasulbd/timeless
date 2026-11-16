import { UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import useAuth, { logout } from '../hooks/useAuth';

const iconButtonClass =
    'relative inline-flex size-11 items-center justify-center rounded-full text-zinc-950 transition-colors hover:bg-zinc-200 hover:text-zinc-700';

const menuLinks = [
    { to: '/account', label: 'Dashboard' },
    { to: '/account/orders', label: 'Orders' },
    { to: '/account/designs', label: 'My Designs' },
    { to: '/account/addresses', label: 'Addresses' },
    { to: '/account/details', label: 'Account Details' },
];

/** Header account icon: links to login for guests, opens an account menu on hover for signed-in customers. */
export default function AccountMenu() {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return (
            <Link to="/login" aria-label="Log in or create an account" className={iconButtonClass}>
                <UserRound className="size-5" strokeWidth={1.75} />
            </Link>
        );
    }

    async function handleLogout(event) {
        event.currentTarget.blur();
        try {
            await logout();
        } catch {
            // Local session is cleared either way.
        }
        // The header also renders inside the personalizer (a separate SPA), so do a full navigation.
        window.location.assign('/login');
    }

    const displayName = user.account_type === 'corporate' ? user.company_name || user.name : user.first_name || user.name;

    return (
        <div className="group relative">
            <Link to="/account" aria-label="My account" aria-haspopup="true" className={iconButtonClass}>
                <UserRound className="size-5" strokeWidth={1.75} />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-emerald-500 ring-2 ring-[#f4f4f4]" aria-hidden="true" />
            </Link>

            {/* Same open-on-hover / keyboard-focus behaviour as the cart dropdown. */}
            <div className="invisible absolute right-0 top-full z-50 w-[240px] pt-3 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100 group-has-[:focus-visible]:visible group-has-[:focus-visible]:opacity-100">
                <div className="border border-zinc-200 bg-white text-left shadow-[0_18px_60px_rgba(0,0,0,0.12)]">
                    <div className="border-b border-zinc-200 px-4 py-3">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">Signed in as</p>
                        <p className="mt-0.5 truncate text-[0.9rem] font-semibold text-zinc-950">{displayName}</p>
                        <p className="truncate text-[0.8rem] text-slate-500">{user.email}</p>
                    </div>
                    <ul className="py-1.5">
                        {menuLinks.map(({ to, label }) => (
                            <li key={to}>
                                <Link
                                    to={to}
                                    onClick={(event) => event.currentTarget.blur()}
                                    className="block px-4 py-2 text-[0.85rem] text-zinc-800 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="border-t border-zinc-200 py-1.5">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="block w-full px-4 py-2 text-left text-[0.85rem] font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
