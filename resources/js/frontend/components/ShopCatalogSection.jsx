import { ChevronDown, Eye, Heart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { featuresFontClass } from '../../utils/typography';
import ShopSidebar from './ShopSidebar.jsx';

const productImage = '/uploads/heroes/images/hero1.webp';

const fallbackProducts = [
    {
        id: 1,
        name: 'REGULAR COVERALL',
        price: '$95.00',
        colors: ['#000000', '#2d6a4f', '#fefae0', '#1d3557', '#adb5bd'],
        position: 'object-[42%_center]',
    },
    {
        id: 2,
        name: 'CORPORATE POLO T-SHIRT',
        price: '$54.00',
        colors: ['#000000', '#2d6a4f', '#fefae0', '#1d3557', '#adb5bd'],
        position: 'object-[50%_center]',
    },
    {
        id: 3,
        name: 'FR WORK SHIRT',
        price: '$56.00',
        colors: ['#000000', '#2d6a4f', '#fefae0', '#1d3557', '#adb5bd'],
        position: 'object-[58%_center]',
    },
    {
        id: 4,
        name: 'BASIC BIB APRON',
        price: '$56.00',
        colors: ['#000000', '#2d6a4f', '#fefae0', '#1d3557', '#adb5bd'],
        position: 'object-[65%_center]',
    },
    {
        id: 5,
        name: 'CLASSIC TEAM HOODIE',
        price: '$72.00',
        colors: ['#000000', '#2d6a4f', '#fefae0', '#1d3557', '#adb5bd'],
        position: 'object-[45%_center]',
    },
    {
        id: 6,
        name: 'ATHLETIC TEAM JERSEY',
        price: '$60.00',
        colors: ['#000000', '#2d6a4f', '#fefae0', '#1d3557', '#adb5bd'],
        position: 'object-[55%_center]',
    },
];

const PRODUCTS_PER_PAGE = 12;

function productImageUrl(product) {
    const image = product.cover_image_url || product.cover_image;
    if (!image) return productImage;
    if (/^https?:\/\//i.test(image)) {
        const imageUrl = new URL(image);
        if (['localhost', '127.0.0.1'].includes(imageUrl.hostname)) {
            return `${imageUrl.pathname}${imageUrl.search}`;
        }
        return image;
    }
    if (image.startsWith('/')) return image;
    return `/${image}`;
}

function productPrice(price) {
    const amount = Number(String(price).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : price;
}

function productColors(product) {
    const colors = Array.isArray(product.color) ? product.color : product.colors;
    return Array.isArray(colors) && colors.length ? colors : ['#111111', '#707070', '#d8d3ca'];
}

function colorValue(color) {
    const normalized = String(color).toLowerCase();
    const namedColors = {
        black: '#111111',
        white: '#ffffff',
        navy: '#1f2d49',
        red: '#b52a2f',
        grey: '#9ca3af',
        gray: '#9ca3af',
        blue: '#315f91',
        green: '#526c55',
    };
    return namedColors[normalized] || color;
}

function ProductCard({ product }) {
    return (
        <article className="group flex flex-col bg-white">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F4F4F4]">
                <Link to={`/singleProduct/${product.id}`} aria-label={`Open ${product.name} details`}>
                    <img
                        src={productImageUrl(product)}
                        alt={product.name}
                        onError={(event) => {
                            if (!event.currentTarget.src.endsWith(productImage)) {
                                event.currentTarget.src = productImage;
                            }
                        }}
                        className={`h-full w-full object-cover ${product.position || 'object-center'} transition-transform duration-500 group-hover:scale-105`}
                    />
                </Link>

                {/* Hover overlay actions (Add to Cart, Wishlist, Quick View) */}
                <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <button
                        type="button"
                        className="bg-white px-4 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.15em] text-zinc-900 shadow-sm transition-colors hover:bg-zinc-900 hover:text-white"
                    >
                        Add to Cart
                    </button>
                    <button
                        type="button"
                        className="flex size-10 items-center justify-center bg-white text-zinc-900 shadow-sm transition-colors hover:bg-zinc-900 hover:text-white"
                        aria-label="Wishlist"
                    >
                        <Heart className="size-4" strokeWidth={1.5} />
                    </button>
                    <button
                        type="button"
                        className="flex size-10 items-center justify-center bg-white text-zinc-900 shadow-sm transition-colors hover:bg-zinc-900 hover:text-white"
                        aria-label="Quick view"
                    >
                        <Eye className="size-4" strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            <div className="mt-4 flex flex-col space-y-1.5">
                <Link
                    to={`/singleProduct/${product.id}`}
                    className="text-[0.95rem] font-normal tracking-[0.06em] text-zinc-900 transition-colors hover:text-zinc-600"
                >
                    {product.name}
                </Link>
                <p className="text-[0.9rem] font-light text-zinc-600">{productPrice(product.price)}</p>
                
                <div className="mt-1 flex flex-col gap-1">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-zinc-400">Color</span>
                    <div className="flex items-center gap-2">
                        {productColors(product).slice(0, 5).map((color, index) => (
                            <span
                                key={`${color}-${index}`}
                                className="size-4 rounded-full border border-zinc-300 transition-transform hover:scale-110"
                                style={{ backgroundColor: colorValue(color) }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </article>
    );
}

function ShopProductsGrid({ products, isLoading, sort, onSortChange, page, onPageChange }) {
    const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
    const firstResult = products.length ? (page - 1) * PRODUCTS_PER_PAGE + 1 : 0;
    const lastResult = Math.min(page * PRODUCTS_PER_PAGE, products.length);
    const visibleProducts = products.slice(firstResult ? firstResult - 1 : 0, lastResult);

    return (
        <div>
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[0.85rem] text-zinc-500">
                    {isLoading ? 'Loading products...' : `Showing ${firstResult}-${lastResult} of ${products.length} results`}
                </p>

                <label className="relative inline-flex items-center bg-[#30302f] text-white">
                    <span className="sr-only">Sort products</span>
                    <select
                        value={sort}
                        onChange={(event) => onSortChange(event.target.value)}
                        className="appearance-none bg-transparent py-2 pl-4 pr-9 text-[0.68rem] text-white outline-none"
                    >
                        <option value="default">Sort by</option>
                        <option value="name">Name</option>
                        <option value="price-low">Price: low to high</option>
                        <option value="price-high">Price: high to low</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 size-3" />
                </label>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {totalPages > 1 ? <div className="mt-12 flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                        key={pageNumber}
                        type="button"
                        onClick={() => onPageChange(pageNumber)}
                        className={`inline-flex h-10 min-w-10 items-center justify-center border px-3 text-[0.75rem] font-semibold uppercase tracking-[0.14em] ${
                            pageNumber === page
                                ? 'border-zinc-900 bg-zinc-900 text-white'
                                : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500'
                        }`}
                    >
                        {pageNumber}
                    </button>
                ))}
            </div> : null}
        </div>
    );
}

export default function ShopCatalogSection() {
    const [products, setProducts] = useState(fallbackProducts);
    const [isLoading, setIsLoading] = useState(true);
    const [sort, setSort] = useState('default');
    const [activeFilter, setActiveFilter] = useState('');
    const [page, setPage] = useState(1);

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

    const visibleProducts = useMemo(() => {
        const filter = activeFilter.toLowerCase();
        const filtered = filter
            ? products.filter((product) => [product.name, product.description, product.available_products?.category]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(filter)))
            : [...products];

        if (sort === 'name') filtered.sort((first, second) => first.name.localeCompare(second.name));
        if (sort === 'price-low') filtered.sort((first, second) => Number(first.price) - Number(second.price));
        if (sort === 'price-high') filtered.sort((first, second) => Number(second.price) - Number(first.price));
        return filtered;
    }, [activeFilter, products, sort]);

    function handleFilterChange(filter) {
        setActiveFilter((current) => current === filter ? '' : filter);
        setPage(1);
    }

    return (
        <section className={`${featuresFontClass} bg-white px-6 py-12 sm:px-10 lg:px-14 lg:py-16`}>
            <div className="mx-auto grid w-full max-w-[1320px] gap-10 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12">
                <ShopSidebar activeFilter={activeFilter} onFilterChange={handleFilterChange} />
                <ShopProductsGrid
                    products={visibleProducts}
                    isLoading={isLoading}
                    sort={sort}
                    onSortChange={(value) => {
                        setSort(value);
                        setPage(1);
                    }}
                    page={page}
                    onPageChange={setPage}
                />
            </div>
        </section>
    );
}