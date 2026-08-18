import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const eventFilters = [
    'Men Long Sleeve',
    'Men Half Sleeve',
    'Women Half Sleeve',
    'Medical Scrubs',
    'Men Basic Chef Coat',
    'Men Basic Chef Coat',
    'FR Work Shirt',
];

const collectionFilters = ['Hospitality', 'Country Clubs', 'Corporate Wear', 'Healthcare', 'Workwear'];

function SidebarFilterRow({ title, open, onToggle, children }) {
    return (
        <div>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 border-b border-zinc-300 pb-2"
            >
                <span className="text-left text-[0.72rem] font-semibold uppercase text-zinc-900">
                    {title}
                </span>
                <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open ? <div className="pt-2.5">{children}</div> : null}
        </div>
    );
}

function FilterList({ items, activeFilter, onFilterChange }) {
    return (
        <ul className="space-y-1 text-[0.72rem] leading-5 text-zinc-500">
            {items.map((item, index) => (
                <li key={`${item}-${index}`}>
                    <button
                        type="button"
                        onClick={() => onFilterChange(item)}
                        className={`text-left transition-colors hover:text-zinc-950 ${activeFilter === item ? 'font-medium text-zinc-950' : ''}`}
                    >
                        {item}
                    </button>
                </li>
            ))}
        </ul>
    );
}

export default function ShopSidebar({ activeFilter, onFilterChange }) {
    const [openSections, setOpenSections] = useState({
        event: true,
        collection: true,
    });

    function toggleSection(sectionKey) {
        setOpenSections((previous) => ({
            ...previous,
            [sectionKey]: !previous[sectionKey],
        }));
    }

    return (
        <aside className="bg-white lg:pr-8">
            <h2 className="mb-6 whitespace-nowrap font-serif text-[1.75rem] font-normal text-zinc-950">Shop By Event</h2>
            <div className="space-y-8">
                <SidebarFilterRow
                    title="All"
                    open={openSections.event}
                    onToggle={() => toggleSection('event')}
                >
                    <FilterList items={eventFilters} activeFilter={activeFilter} onFilterChange={onFilterChange} />
                </SidebarFilterRow>

                <SidebarFilterRow
                    title="Shop By Collection"
                    open={openSections.collection}
                    onToggle={() => toggleSection('collection')}
                >
                    <FilterList items={collectionFilters} activeFilter={activeFilter} onFilterChange={onFilterChange} />
                </SidebarFilterRow>
            </div>
        </aside>
    );
}
