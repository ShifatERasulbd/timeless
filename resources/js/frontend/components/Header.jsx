import { Menu, Search, ShoppingCart, SlidersHorizontal, UserRound } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import useCartCount from '../hooks/useCartCount';
import useCategories from '../hooks/useCategories';
import { categoryShopPath } from '../../utils/shopPaths';
import { timelessFontClass } from '../../utils/typography';
import CartDropdown from './CartDropdown.jsx';

const navLinkClass =
    'text-[0.85rem] font-medium uppercase tracking-[0.22em] text-zinc-950 transition-opacity hover:opacity-60';

const megaMenuImage = '/uploads/heroes/images/hero1.webp';

// Open on hover / keyboard focus. Once a link is clicked the menu stays hidden until the pointer
// leaves the item, so it doesn't hang open over the page that was just opened.
function dropdownStateClass(isDismissed) {
    return isDismissed
        ? 'invisible -translate-y-1 opacity-0'
        : 'invisible -translate-y-1 opacity-0 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100';
}

function CategoryNavItem({ category }) {
    const [isDismissed, setIsDismissed] = useState(false);
    const subCategories = Array.isArray(category.sub_categories) ? category.sub_categories : [];
    // Grandchildren present anywhere under this category -> full-width mega menu.
    const hasMegaMenu = subCategories.some((subCategory) => subCategory.grand_childs?.length);
    const itemRef = useRef(null);
    const rowRef = useRef(null);
    const [rowOffset, setRowOffset] = useState(0);

    function dismiss(event) {
        event.currentTarget.blur();
        setIsDismissed(true);
    }

    // Centre the sub-category row under this category, keeping it inside the bar near the edges.
    function alignRow() {
        const item = itemRef.current;
        const row = rowRef.current;
        const bar = row?.parentElement;
        if (!item || !row || !bar) return;

        const gutter = 16;
        const barRect = bar.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        const centre = itemRect.left - barRect.left + itemRect.width / 2;
        const maxOffset = Math.max(gutter, barRect.width - row.offsetWidth - gutter);
        setRowOffset(Math.min(Math.max(centre - row.offsetWidth / 2, gutter), maxOffset));
    }

    return (
        // Full header height so the hover area runs straight into the menu. The item is not
        // `relative`, so its menu is positioned against the header and spans its full width.
        <div
            ref={itemRef}
            className="group flex items-center self-stretch"
            onMouseEnter={alignRow}
            onMouseLeave={() => setIsDismissed(false)}
            onFocus={() => {
                setIsDismissed(false);
                alignRow();
            }}
        >
            <Link to={categoryShopPath(category)} onClick={dismiss} className={navLinkClass}>
                {category.name}
            </Link>

            {hasMegaMenu ? (
                <div className={`absolute inset-x-0 top-full z-50 transition duration-200 ease-out ${dropdownStateClass(isDismissed)}`}>
                    <div className="border-y border-zinc-200 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
                        <div className="mx-auto flex max-w-[1920px] items-start gap-12 px-4 py-10 sm:px-6 lg:px-12">
                            <div className="flex flex-1 flex-wrap gap-x-12 gap-y-10 font-condensed uppercase">
                                {subCategories.map((subCategory) => (
                                    <div key={subCategory.id} className="w-[200px]">
                                        <Link
                                            to={categoryShopPath(category, subCategory)}
                                            onClick={dismiss}
                                            className="text-[0.8rem] font-semibold tracking-[0.16em] text-zinc-400 transition-colors hover:text-zinc-950"
                                        >
                                            {subCategory.name}
                                        </Link>

                                        {subCategory.grand_childs?.length ? (
                                            <ul className="mt-6 space-y-4">
                                                {subCategory.grand_childs.map((grandChild) => (
                                                    <li key={grandChild.id}>
                                                        <Link
                                                            to={categoryShopPath(category, subCategory, grandChild)}
                                                            onClick={dismiss}
                                                            className="text-[0.95rem] font-medium tracking-[0.02em] text-zinc-700 transition-colors hover:text-zinc-950"
                                                        >
                                                            {grandChild.name}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </div>
                                ))}
                            </div>

                            <Link
                                to={categoryShopPath(category)}
                                onClick={dismiss}
                                aria-label={`Shop all ${category.name}`}
                                className="block w-[min(32vw,480px)] shrink-0 border border-zinc-200 bg-zinc-100 p-3 transition-opacity hover:opacity-90"
                            >
                                <img
                                    src={megaMenuImage}
                                    alt=""
                                    loading="lazy"
                                    className="aspect-[3/2] w-full object-cover object-center"
                                />
                            </Link>
                        </div>
                    </div>
                </div>
            ) : subCategories.length ? (
                // Sub-categories only: a full-width bar with the links in one row under this category.
                <div className={`absolute inset-x-0 top-full z-50 border-y border-zinc-200 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.05)] transition duration-200 ease-out ${dropdownStateClass(isDismissed)}`}>
                    <ul
                        ref={rowRef}
                        style={{ marginLeft: rowOffset }}
                        className="flex w-max max-w-[calc(100%-2rem)] flex-wrap items-center justify-center gap-x-10 gap-y-3 py-5 font-gothic"
                    >
                        {subCategories.map((subCategory) => (
                            <li key={subCategory.id}>
                                <Link
                                    to={categoryShopPath(category, subCategory)}
                                    onClick={dismiss}
                                    className="whitespace-nowrap text-[0.95rem] tracking-[0.03em] text-zinc-950 transition-opacity hover:opacity-60"
                                >
                                    {subCategory.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}

const utilityIcons = [
    { label: 'Account', icon: UserRound, href: '/login' },
    { label: 'Search', icon: Search, href: '#search' },
    { label: 'Cart', icon: ShoppingCart, href: '/cart' },
];

export default function Header() {
    const cartCount = useCartCount();
    const categories = useCategories();

    return (
        <header className={`${timelessFontClass} sticky top-0 z-50 w-full text-zinc-950`}>
            {/* Main Header Container */}
            <div className="border-b border-zinc-200 bg-[#f4f4f4] backdrop-blur">
                <div className="mx-auto flex h-[90px] max-w-[1920px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
                    
                    {/* Left: Category navigation (from the categories table) */}
                    <nav className="hidden flex-1 items-center justify-start gap-10 self-stretch xl:flex" aria-label="Primary">
                        {categories.map((category) => (
                            <CategoryNavItem key={category.id} category={category} />
                        ))}
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
                        {/* <a
                            href="#customize"
                            aria-label="Start customizing"
                            className="inline-flex size-10 items-center justify-center rounded-sm bg-[#e65c00] text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-white transition-transform hover:-translate-y-0.5 hover:bg-[#d55400] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2"
                        >
                            <SlidersHorizontal className="size-4 shrink-0" />
                            <span className="hidden whitespace-nowrap sm:inline">Start Customizing</span>
                        </a> */}

                        <div className="hidden items-center gap-1 md:flex">
                            {utilityIcons.map(({ label, icon: Icon, href }) => {
                                if (label === 'Cart') {
                                    return (
                                        // Not a link: hovering (or keyboard focus) opens the cart
                                        // dropdown, which has its own "View Cart" button.
                                        <div key={label} className="group relative">
                                            <button
                                                type="button"
                                                aria-label={cartCount > 0 ? `${label}, ${cartCount} items` : label}
                                                aria-haspopup="true"
                                                className="relative inline-flex size-11 cursor-default items-center justify-center rounded-full text-zinc-950 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
                                            >
                                                <Icon className="size-5" strokeWidth={1.75} />
                                                {cartCount > 0 ? (
                                                    <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#e65c00] text-[0.6rem] font-semibold leading-none text-white">
                                                        {cartCount > 99 ? '99+' : cartCount}
                                                    </span>
                                                ) : null}
                                            </button>
                                            <CartDropdown />
                                        </div>
                                    );
                                }

                                return href.startsWith('/') ? (
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
                                );
                            })}
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