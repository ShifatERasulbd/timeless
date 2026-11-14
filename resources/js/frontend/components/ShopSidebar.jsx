import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { categoryShopPath } from '../../utils/shopPaths';

const optionTextClass = 'text-[0.88rem] text-zinc-600 transition-colors hover:text-zinc-950';
const activeOptionTextClass = 'text-[0.88rem] font-medium text-zinc-950';

function FilterSection({ title, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-zinc-200">
            <button
                type="button"
                onClick={() => setOpen((previous) => !previous)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 py-4 text-left"
            >
                <span className="text-[0.92rem] uppercase text-zinc-800">{title}</span>
                <ChevronDown
                    className={`size-4 shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
                    strokeWidth={1.5}
                />
            </button>

            {open ? <div className="pb-5">{children}</div> : null}
        </div>
    );
}

function EmptyOption({ children }) {
    return <p className="text-[0.85rem] text-zinc-400">{children}</p>;
}

function ColourFilter({ options, selected, onToggle }) {
    if (!options.length) return <EmptyOption>No colours available.</EmptyOption>;

    return (
        <ul className="space-y-2.5">
            {options.map((option) => {
                const isSelected = selected.includes(option.key);

                return (
                    <li key={option.key}>
                        <button
                            type="button"
                            onClick={() => onToggle(option.key)}
                            aria-pressed={isSelected}
                            className={`flex w-full items-center gap-3 text-left ${isSelected ? activeOptionTextClass : optionTextClass}`}
                        >
                            <span
                                className={`size-[18px] shrink-0 rounded-full border border-zinc-300 ${isSelected ? 'ring-2 ring-zinc-900 ring-offset-2' : ''}`}
                                style={{ backgroundColor: option.value }}
                                aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1 truncate">{option.label}</span>
                            <span className="text-[0.78rem] text-zinc-400">({option.count})</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

function SizeFilter({ options, selected, onToggle }) {
    if (!options.length) return <EmptyOption>No sizes available.</EmptyOption>;

    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => {
                const isSelected = selected.includes(option.key);

                return (
                    <button
                        key={option.key}
                        type="button"
                        onClick={() => onToggle(option.key)}
                        aria-pressed={isSelected}
                        className={`min-w-11 border px-3 py-1.5 text-[0.8rem] transition-colors ${
                            isSelected
                                ? 'border-zinc-900 bg-zinc-900 text-white'
                                : 'border-zinc-300 text-zinc-700 hover:border-zinc-900'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

function ProductTypeFilter({ categories, categorySlug, subCategorySlug, grandChildSlug }) {
    const linkClass = (isActive) => (isActive ? activeOptionTextClass : optionTextClass);

    return (
        <ul className="space-y-2.5">
            <li>
                <Link to="/shop" className={linkClass(!categorySlug)}>
                    All Products
                </Link>
            </li>

            {categories.map((category) => {
                const inCategory = category.slug === categorySlug;
                const subCategories = Array.isArray(category.sub_categories) ? category.sub_categories : [];

                return (
                    <li key={category.id}>
                        <Link to={categoryShopPath(category)} className={linkClass(inCategory && !subCategorySlug)}>
                            {category.name}
                        </Link>

                        {subCategories.length ? (
                            <ul className="mt-2.5 space-y-2.5 border-l border-zinc-200 pl-4">
                                {subCategories.map((subCategory) => {
                                    const inSubCategory = inCategory && subCategory.slug === subCategorySlug;
                                    const grandChilds = Array.isArray(subCategory.grand_childs) ? subCategory.grand_childs : [];

                                    return (
                                        <li key={subCategory.id}>
                                            <Link
                                                to={categoryShopPath(category, subCategory)}
                                                className={linkClass(inSubCategory && !grandChildSlug)}
                                            >
                                                {subCategory.name}
                                            </Link>

                                            {grandChilds.length ? (
                                                <ul className="mt-2.5 space-y-2.5 border-l border-zinc-200 pl-4">
                                                    {grandChilds.map((grandChild) => (
                                                        <li key={grandChild.id}>
                                                            <Link
                                                                to={categoryShopPath(category, subCategory, grandChild)}
                                                                className={linkClass(inSubCategory && grandChild.slug === grandChildSlug)}
                                                            >
                                                                {grandChild.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );
}

export default function ShopSidebar({
    categories = [],
    categorySlug = '',
    subCategorySlug = '',
    grandChildSlug = '',
    colourOptions = [],
    selectedColours = [],
    onToggleColour,
    sizeOptions = [],
    selectedSizes = [],
    onToggleSize,
    hasActiveFilters = false,
    onClearAll,
}) {
    return (
        <aside className="lg:pl-11">
            <div className="flex items-baseline justify-between gap-3 border-b border-zinc-200 pb-5">
                <h2 className="text-[1rem] font-semibold uppercase text-zinc-950">Filter Products</h2>
                {hasActiveFilters ? (
                    <button
                        type="button"
                        onClick={onClearAll}
                        className="text-[0.8rem] text-zinc-500 underline underline-offset-4 transition-colors hover:text-zinc-950"
                    >
                        Clear all
                    </button>
                ) : null}
            </div>

            <FilterSection title="All Colour" defaultOpen={selectedColours.length > 0}>
                <ColourFilter options={colourOptions} selected={selectedColours} onToggle={onToggleColour} />
            </FilterSection>

            <FilterSection title="Size" defaultOpen={selectedSizes.length > 0}>
                <SizeFilter options={sizeOptions} selected={selectedSizes} onToggle={onToggleSize} />
            </FilterSection>

            <FilterSection title="Product Type" defaultOpen={Boolean(categorySlug)}>
                <ProductTypeFilter
                    categories={categories}
                    categorySlug={categorySlug}
                    subCategorySlug={subCategorySlug}
                    grandChildSlug={grandChildSlug}
                />
            </FilterSection>
        </aside>
    );
}
