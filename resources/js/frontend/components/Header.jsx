import { Menu, Search, ShoppingCart, SlidersHorizontal, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { timelessFontClass } from '../../utils/typography';

const navigationItems = [
    { label: 'Best Sellers', href: '#best-sellers' },
    { label: 'Shop', href: '/shop' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
];

const shopMegaMenuColumns = [
    {
        title: 'Men',
        items: ['Tshirt', 'Sweatshirt', 'Hoodie', 'Full Sleeve t-shirt'],
    },
    {
        title: 'Women',
        items: ['Tshirt', 'Sweatshirt', 'Hoodie', 'Full Sleeve t-shirt'],
    },
    {
        title: 'Youth',
        items: ['Tshirt', 'Sweatshirt', 'Hoodie', 'Full Sleeve t-shirt'],
    },
    {
        title: 'Shop By Event',
        items: ['Corporates', 'Spirit wear', 'Education', 'Sports'],
    },
];

const shopMegaMenuImage = '/uploads/heroes/images/hero1.webp';

const utilityIcons = [
    { label: 'Account', icon: UserRound, href: '/login' },
    { label: 'Search', icon: Search, href: '#search' },
    { label: 'Cart', icon: ShoppingCart, href: '/cart' },
];

export default function Header() {
    const [tickerText, setTickerText] = useState('');

    useEffect(() => {
        let ignore = false;

        async function loadHeroTicker() {
            try {
                const response = await fetch('/api/public/hero', {
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) {
                    return;
                }

                const payload = await response.json();
                if (!ignore) {
                    setTickerText(payload?.ticker_text || '');
                }
            } catch {
                // Keep header stable if ticker cannot be loaded.
            }
        }

        loadHeroTicker();

        return () => {
            ignore = true;
        };
    }, []);

    return (
        <header className={`${timelessFontClass} sticky top-0 z-50 w-full text-zinc-950`}>
            {/* Top Announcement Bar */}
            {tickerText ? (
                <div className="bg-[#e65c00] px-4 py-2 text-center text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white sm:text-[0.75rem]">
                    {tickerText}
                </div>
            ) : null}

            {/* Main Header Container */}
            <div className="border-b border-zinc-200 bg-[#f4f4f4] backdrop-blur">
                <div className="mx-auto flex h-[90px] max-w-[1920px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
                    
                    {/* Left: Navigation Menu Items */}
                    <nav className="hidden flex-1 items-center justify-start gap-10 xl:flex" aria-label="Primary">
                        {navigationItems.map((item) =>
                            item.label === 'Shop' ? (
                                <div key={item.label} className="group relative flex items-center py-4">
                                    <Link
                                        to={item.href}
                                        className="text-[0.85rem] font-medium uppercase tracking-[0.22em] text-zinc-950 transition-opacity hover:opacity-60"
                                    >
                                        {item.label}
                                    </Link>

                                    <div className="invisible fixed left-0 right-0 top-[126px] z-50 max-h-0 w-full overflow-hidden pt-3 opacity-0 transition-[max-height,opacity] duration-300 ease-out group-hover:visible group-hover:max-h-[540px] group-hover:opacity-100">
                                        <div className="border border-zinc-200 bg-white px-4 py-8 shadow-[0_18px_60px_rgba(0,0,0,0.08)] sm:px-6 lg:px-10">
                                            <div className="mx-auto grid w-full max-w-[1920px] grid-cols-[1.15fr_1.15fr_1.15fr_1.15fr_1.1fr] gap-8 xl:gap-10">
                                                {shopMegaMenuColumns.map((column) => (
                                                    <div key={column.title} className="space-y-4">
                                                        <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-zinc-400">
                                                            {column.title}
                                                        </h3>
                                                        <ul className="space-y-2 text-[0.88rem] leading-6 text-zinc-600">
                                                            {column.items.map((itemLabel) => (
                                                                <li key={itemLabel}>
                                                                    <Link
                                                                        to="/shop"
                                                                        className="transition-colors hover:text-zinc-950"
                                                                    >
                                                                        {itemLabel}
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}

                                                <div className="flex justify-center">
                                                    <figure className="w-full max-w-[260px] text-center">
                                                        <Link to="/shop" className="block overflow-hidden bg-zinc-100 p-3">
                                                            <img
                                                                src={shopMegaMenuImage}
                                                                alt="Future Classics New Arrivals"
                                                                className="h-[256px] w-full object-cover object-center"
                                                            />
                                                        </Link>
                                                        <figcaption className="mt-3 text-[0.7rem] uppercase tracking-[0.08em] text-zinc-500">
                                                            Future Classics New Arrivals
                                                        </figcaption>
                                                    </figure>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : item.href.startsWith('/') ? (
                                <Link
                                    key={item.label}
                                    to={item.href}
                                    className="text-[0.85rem] font-medium uppercase tracking-[0.22em] text-zinc-950 transition-opacity hover:opacity-60"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    className="text-[0.85rem] font-medium uppercase tracking-[0.22em] text-zinc-950 transition-opacity hover:opacity-60"
                                >
                                    {item.label}
                                </a>
                            )
                        )}
                    </nav>

                    {/* Center: Brand Logo */}
                    <div className="flex xl:absolute xl:left-1/2 xl:-translate-x-1/2">
                        <Link
                            to="/"
                            className="flex min-w-0 items-center text-[1.65rem] font-black tracking-[0.22em] text-zinc-950 transition-opacity hover:opacity-80 sm:text-[1.9rem]"
                            aria-label="Timeless home"
                        >
                            TIMLESS
                        </Link>
                    </div>

                    {/* Right: Customizing Button & Utility Icons */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <a
                            href="#customize"
                            aria-label="Start customizing"
                            className="inline-flex size-10 items-center justify-center rounded-sm bg-[#e65c00] text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-white transition-transform hover:-translate-y-0.5 hover:bg-[#d55400] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2"
                        >
                            <SlidersHorizontal className="size-4 shrink-0" />
                            <span className="hidden whitespace-nowrap sm:inline">Start Customizing</span>
                        </a>

                        <div className="hidden items-center gap-1 md:flex">
                            {utilityIcons.map(({ label, icon: Icon, href }) =>
                                href.startsWith('/') ? (
                                    <Link
                                        key={label}
                                        to={href}
                                        aria-label={label}
                                        className="inline-flex size-11 items-center justify-center rounded-full text-zinc-950 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
                                    >
                                        <Icon className="size-5" strokeWidth={1.75} />
                                    </Link>
                                ) : (
                                    <a
                                        key={label}
                                        href={href}
                                        aria-label={label}
                                        className="inline-flex size-11 items-center justify-center rounded-full text-zinc-950 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
                                    >
                                        <Icon className="size-5" strokeWidth={1.75} />
                                    </a>
                                )
                            )}
                        </div>

                        <button
                            type="button"
                            className="inline-flex size-11 items-center justify-center rounded-full text-zinc-950 transition-colors hover:bg-zinc-200 md:hidden"
                            aria-label="Open menu"
                        >
                            <Menu className="size-5" strokeWidth={1.75} />
                        </button>
                    </div>

                </div>
            </div>
        </header>
    );
}