import { ChevronDown, ChevronRight, House, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import useCategories from '../hooks/useCategories';
import {
    PLACEHOLDER_PRODUCT_IMAGE as productImage,
    colorImageUrl,
    formatPrice,
    priceAmount,
    productColors,
    productImageUrl,
    productSizes,
} from '../../utils/productDisplay';
import { categoryShopPath } from '../../utils/shopPaths';
import QuickAddModal from './QuickAddModal.jsx';
import ShopSidebar from './ShopSidebar.jsx';

const mockColors = [
    { label: 'Black', value: '#000000' },
    { label: 'Green', value: '#2d6a4f' },
    { label: 'Cream', value: '#fefae0' },
    { label: 'Navy', value: '#1d3557' },
    { label: 'Grey', value: '#adb5bd' },
];

// Shown only when the products API is unreachable or returns nothing. They aren't real products,
// so they can't be added to the cart.
const fallbackProducts = [
    { id: 1, name: 'REGULAR COVERALL', price: '$95.00', colors: mockColors, position: 'object-[42%_center]' },
    { id: 2, name: 'CORPORATE POLO T-SHIRT', price: '$54.00', colors: mockColors, position: 'object-[50%_center]' },
    { id: 3, name: 'FR WORK SHIRT', price: '$56.00', colors: mockColors, position: 'object-[58%_center]' },
    { id: 4, name: 'BASIC BIB APRON', price: '$56.00', colors: mockColors, position: 'object-[65%_center]' },
    { id: 5, name: 'CLASSIC TEAM HOODIE', price: '$72.00', colors: mockColors, position: 'object-[45%_center]' },
    { id: 6, name: 'ATHLETIC TEAM JERSEY', price: '$60.00', colors: mockColors, position: 'object-[55%_center]' },
].map((product) => ({ ...product, isPlaceholder: true }));

const PRODUCTS_PER_PAGE = 12;

const sortOptions = [
    { value: 'name-asc', label: 'Alphabetically, A-Z' },
    { value: 'name-desc', label: 'Alphabetically, Z-A' },
    { value: 'price-low', label: 'Price, low to high' },
    { value: 'price-high', label: 'Price, high to low' },
];

const filterKey = (label) => String(label ?? '').trim().toLowerCase();

// Readable fallback label when the category tree hasn't loaded or doesn't contain the slug.
function labelFromSlug(slug) {
    return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ProductCard({ product, onQuickAdd }) {
    const productPath = `/singleProduct/${encodeURIComponent(product.slug || product.id)}`;
    const colors = productColors(product);
    const [selectedColorIndex, setSelectedColorIndex] = useState(0);
    const selectedToken = colors[selectedColorIndex]?.token;
    const displayImage = colorImageUrl(product, selectedToken) || productImageUrl(product);

    return (
        <article className="group flex flex-col">
            <Link
                to={productPath}
                aria-label={`Open ${product.name} details`}
                className="block aspect-[2/3] w-full overflow-hidden bg-[#f4f4f4]"
            >
                <img
                    src={displayImage}
                    alt={product.name}
                    loading="lazy"
                    onError={(event) => {
                        if (!event.currentTarget.src.endsWith(productImage)) {
                            event.currentTarget.src = productImage;
                        }
                    }}
                    className={`h-full w-full object-cover ${product.position || 'object-center'} transition-transform duration-500 group-hover:scale-[1.03]`}
                />
            </Link>

            <div className="mt-4 flex flex-col items-center px-2 text-center">
                <Link
                    to={productPath}
                    className="text-[1.02rem] leading-6 text-zinc-900 transition-colors hover:text-zinc-500"
                >
                    {product.name}
                </Link>
                <p className="mt-1 text-[0.9rem] text-zinc-600">{formatPrice(product.price)}</p>

                {colors.length ? (
                    <>
                        <p className="mt-1 text-[0.72rem] text-zinc-400">
                            {colors.length} {colors.length === 1 ? 'colour' : 'colours'}
                        </p>
                        <div className="mt-2 flex max-w-[200px] flex-wrap justify-center gap-1.5">
                            {colors.map((color, index) => (
                                <button
                                    key={`${color.value}-${index}`}
                                    type="button"
                                    onClick={() => setSelectedColorIndex(index)}
                                    aria-label={`Show ${color.label} colour`}
                                    aria-pressed={selectedColorIndex === index}
                                    title={color.label}
                                    className={`size-[18px] rounded-full border transition-transform hover:scale-110 ${
                                        selectedColorIndex === index
                                            ? 'border-zinc-900 ring-1 ring-zinc-900 ring-offset-1'
                                            : 'border-zinc-300'
                                    }`}
                                    style={{ backgroundColor: color.value }}
                                />
                            ))}
                        </div>
                    </>
                ) : null}

                {!product.isPlaceholder ? (
                    <button
                        type="button"
                        onClick={() => onQuickAdd(product, selectedColorIndex)}
                        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 border border-zinc-900 text-[0.85rem] font-medium text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
                    >
                        <ShoppingCart className="size-4" strokeWidth={1.75} />
                        Add to Cart
                    </button>
                ) : null}
            </div>
        </article>
    );
}

function Breadcrumbs({ crumbs }) {
    // The last crumb is the current page; everything before it is a link.
    const items = [{ label: 'Products', to: '/shop' }, ...crumbs];

    return (
        <nav aria-label="Breadcrumb" className="mt-8">
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.95rem] italic text-zinc-900">
                <li className="flex items-center gap-1.5">
                    <House className="size-4 fill-zinc-900" strokeWidth={1.5} aria-hidden="true" />
                    <Link to="/" className="transition-colors hover:text-zinc-500">Home</Link>
                </li>
                {items.map((item, index) => {
                    const isCurrent = index === items.length - 1;

                    return (
                        <li key={`${item.label}-${index}`} className="flex items-center gap-3">
                            <ChevronRight className="size-4 text-zinc-500" strokeWidth={1.5} aria-hidden="true" />
                            {isCurrent ? (
                                <span aria-current="page" className="font-semibold">{item.label}</span>
                            ) : (
                                <Link to={item.to} className="transition-colors hover:text-zinc-500">{item.label}</Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

function ShopToolbar({ count, isLoading, showFilters, onToggleFilters, sort, onSortChange }) {
    return (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[1.15rem] text-zinc-400">
                {isLoading ? 'Loading products...' : `${count} ${count === 1 ? 'Product' : 'Products'} Found`}
            </p>

            <div className="flex flex-wrap items-center gap-5">
                <button
                    type="button"
                    onClick={onToggleFilters}
                    aria-pressed={showFilters}
                    className="inline-flex items-center gap-3 text-[1.05rem] text-zinc-900 transition-opacity hover:opacity-70"
                >
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                    <SlidersHorizontal className="size-5" strokeWidth={1.75} />
                </button>

                <span className="hidden h-7 w-px bg-zinc-300 sm:block" aria-hidden="true" />

                <label className="flex items-center gap-3 text-[1.05rem] text-zinc-900">
                    Sort by:
                    <span className="relative">
                        <select
                            value={sort}
                            onChange={(event) => onSortChange(event.target.value)}
                            className="h-11 min-w-[200px] appearance-none border border-zinc-900 bg-white pl-4 pr-10 text-[0.9rem] text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" strokeWidth={1.5} />
                    </span>
                </label>
            </div>
        </div>
    );
}

function ShopProductsGrid({ products, isLoading, showFilters, page, onPageChange, hasActiveFilters, onClearAll, onQuickAdd }) {
    const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
    const visibleProducts = products.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);

    if (!isLoading && products.length === 0) {
        return (
            <div className="border border-dashed border-zinc-300 px-6 py-16 text-center">
                <p className="text-[0.95rem] text-zinc-700">No products match these filters yet.</p>
                {hasActiveFilters ? (
                    <button
                        type="button"
                        onClick={onClearAll}
                        className="mt-4 border-b border-zinc-400 pb-0.5 text-[0.85rem] text-zinc-700 transition-colors hover:text-zinc-950"
                    >
                        View all products
                    </button>
                ) : null}
            </div>
        );
    }

    return (
        <>
            <div className={`grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 xl:grid-cols-4 ${showFilters ? '' : '2xl:grid-cols-5'}`}>
                {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onQuickAdd={onQuickAdd} />
                ))}
            </div>

            {totalPages > 1 ? (
                <div className="mt-12 flex items-center justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                        <button
                            key={pageNumber}
                            type="button"
                            onClick={() => onPageChange(pageNumber)}
                            aria-current={pageNumber === page ? 'page' : undefined}
                            className={`inline-flex h-10 min-w-10 items-center justify-center border px-3 text-[0.85rem] ${
                                pageNumber === page
                                    ? 'border-zinc-900 bg-zinc-900 text-white'
                                    : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-900'
                            }`}
                        >
                            {pageNumber}
                        </button>
                    ))}
                </div>
            ) : null}
        </>
    );
}

// Count products per option (by case-insensitive label) for the sidebar filters.
function collectOptions(products, getOptions) {
    const options = new Map();
    products.forEach((product) => {
        const seen = new Set();
        getOptions(product).forEach((option) => {
            const key = filterKey(option.label);
            if (!key || seen.has(key)) return;
            seen.add(key);
            const existing = options.get(key);
            if (existing) existing.count += 1;
            else options.set(key, { ...option, key, count: 1 });
        });
    });
    return [...options.values()];
}

function toggleValue(list, value) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function ShopCatalogSection() {
    const [products, setProducts] = useState(fallbackProducts);
    const [isLoading, setIsLoading] = useState(true);
    const [sort, setSort] = useState('name-asc');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(true);
    const [selectedColours, setSelectedColours] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const categories = useCategories();
    // Product (and the colour picked on its card) shown in the "Add to Cart" popup.
    const [quickAdd, setQuickAdd] = useState(null);
    const openQuickAdd = useCallback((product, colorIndex) => setQuickAdd({ product, colorIndex }), []);
    const closeQuickAdd = useCallback(() => setQuickAdd(null), []);

    // Set by the header category menu, the Product Type filter and the home page cards,
    // e.g. /shop?category=mens-ware, ...&subcategory=tops, or ...&subcategory=tops&grandchild=t-shirts.
    const [searchParams, setSearchParams] = useSearchParams();
    const categorySlug = searchParams.get('category') || '';
    const subCategorySlug = searchParams.get('subcategory') || '';
    const grandChildSlug = searchParams.get('grandchild') || '';

    // A new category has its own colours/sizes, so start its filters fresh.
    useEffect(() => {
        setPage(1);
        setSelectedColours([]);
        setSelectedSizes([]);
    }, [categorySlug, subCategorySlug, grandChildSlug]);

    useEffect(() => {
        let ignore = false;

        fetch('/api/public/products', { headers: { Accept: 'application/json' } })
            .then((response) => response.ok ? response.json() : Promise.reject())
            .then((payload) => {
                if (!ignore && Array.isArray(payload) && payload.length) setProducts(payload);
            })
            .catch(() => {})
            .finally(() => {
                if (!ignore) setIsLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, []);

    // Breadcrumb trail for the selected category level(s), named from the category tree.
    const crumbs = useMemo(() => {
        if (!categorySlug) return [];

        const category = categories.find((item) => item.slug === categorySlug);
        const subCategory = subCategorySlug
            ? category?.sub_categories?.find((item) => item.slug === subCategorySlug)
            : null;
        const grandChild = grandChildSlug
            ? subCategory?.grand_childs?.find((item) => item.slug === grandChildSlug)
            : null;

        const categoryRef = { slug: categorySlug };
        const subCategoryRef = { slug: subCategorySlug };
        const trail = [{ label: category?.name || labelFromSlug(categorySlug), to: categoryShopPath(categoryRef) }];
        if (subCategorySlug) {
            trail.push({ label: subCategory?.name || labelFromSlug(subCategorySlug), to: categoryShopPath(categoryRef, subCategoryRef) });
        }
        if (subCategorySlug && grandChildSlug) {
            trail.push({ label: grandChild?.name || labelFromSlug(grandChildSlug), to: categoryShopPath(categoryRef, subCategoryRef, { slug: grandChildSlug }) });
        }
        return trail;
    }, [categories, categorySlug, subCategorySlug, grandChildSlug]);

    const inCategory = useMemo(() => products.filter((product) =>
        (!categorySlug || product.category?.slug === categorySlug)
        && (!subCategorySlug || product.subcategory?.slug === subCategorySlug)
        && (!grandChildSlug || product.grand_child?.slug === grandChildSlug)), [products, categorySlug, subCategorySlug, grandChildSlug]);

    // Filter options reflect the products in the selected category.
    const colourOptions = useMemo(
        () => collectOptions(inCategory, productColors).sort((first, second) => first.label.localeCompare(second.label)),
        [inCategory],
    );
    const sizeOptions = useMemo(
        () => collectOptions(inCategory, productSizes)
            .sort((first, second) => (first.position ?? Infinity) - (second.position ?? Infinity) || first.label.localeCompare(second.label)),
        [inCategory],
    );

    const visibleProducts = useMemo(() => {
        const filtered = inCategory.filter((product) =>
            (!selectedColours.length || productColors(product).some((color) => selectedColours.includes(filterKey(color.label))))
            && (!selectedSizes.length || productSizes(product).some((size) => selectedSizes.includes(filterKey(size.label)))));

        const byName = (first, second) => String(first.name).localeCompare(String(second.name));
        if (sort === 'name-asc') filtered.sort(byName);
        if (sort === 'name-desc') filtered.sort((first, second) => byName(second, first));
        if (sort === 'price-low') filtered.sort((first, second) => priceAmount(first.price) - priceAmount(second.price));
        if (sort === 'price-high') filtered.sort((first, second) => priceAmount(second.price) - priceAmount(first.price));
        return filtered;
    }, [inCategory, selectedColours, selectedSizes, sort]);

    const hasActiveFilters = Boolean(categorySlug || selectedColours.length || selectedSizes.length);

    function clearAll() {
        setSelectedColours([]);
        setSelectedSizes([]);
        setPage(1);
        const next = new URLSearchParams(searchParams);
        ['category', 'subcategory', 'grandchild'].forEach((key) => next.delete(key));
        setSearchParams(next);
    }

    return (
        <section className="bg-white px-5 py-10 font-poppins sm:px-8 lg:px-12 lg:py-14">
            <div className="mx-auto w-full max-w-[1400px]">
                <h1 className="text-[1.9rem] font-normal leading-tight text-zinc-950 sm:text-[2.1rem]">
                    {crumbs.length ? crumbs[crumbs.length - 1].label : 'Products'}
                </h1>
                <Breadcrumbs crumbs={crumbs} />

                <div className={`mt-10 grid grid-cols-1 gap-10 ${showFilters ? 'lg:grid-cols-[330px_minmax(0,1fr)] lg:gap-11' : ''}`}>
                    {showFilters ? (
                        <ShopSidebar
                            categories={categories}
                            categorySlug={categorySlug}
                            subCategorySlug={subCategorySlug}
                            grandChildSlug={grandChildSlug}
                            colourOptions={colourOptions}
                            selectedColours={selectedColours}
                            onToggleColour={(key) => {
                                setSelectedColours((previous) => toggleValue(previous, key));
                                setPage(1);
                            }}
                            sizeOptions={sizeOptions}
                            selectedSizes={selectedSizes}
                            onToggleSize={(key) => {
                                setSelectedSizes((previous) => toggleValue(previous, key));
                                setPage(1);
                            }}
                            hasActiveFilters={hasActiveFilters}
                            onClearAll={clearAll}
                        />
                    ) : null}

                    <div className="min-w-0">
                        <ShopToolbar
                            count={visibleProducts.length}
                            isLoading={isLoading}
                            showFilters={showFilters}
                            onToggleFilters={() => setShowFilters((previous) => !previous)}
                            sort={sort}
                            onSortChange={(value) => {
                                setSort(value);
                                setPage(1);
                            }}
                        />
                        <ShopProductsGrid
                            products={visibleProducts}
                            isLoading={isLoading}
                            showFilters={showFilters}
                            page={page}
                            onPageChange={setPage}
                            hasActiveFilters={hasActiveFilters}
                            onClearAll={clearAll}
                            onQuickAdd={openQuickAdd}
                        />
                    </div>
                </div>
            </div>

            {quickAdd ? (
                <QuickAddModal
                    key={quickAdd.product.id}
                    product={quickAdd.product}
                    initialColorIndex={quickAdd.colorIndex}
                    onClose={closeQuickAdd}
                />
            ) : null}
        </section>
    );
}
