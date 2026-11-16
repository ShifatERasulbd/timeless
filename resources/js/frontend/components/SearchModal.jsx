import { LoaderCircle, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';

import { PLACEHOLDER_PRODUCT_IMAGE, formatPrice, productImageUrl } from '../../utils/productDisplay';
import { timelessFontClass } from '../../utils/typography';

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 20; // Matches the cap in ApiProductController::search.
const DEBOUNCE_MS = 250;

// Result links use tabIndex -1 (arrow keys move through them), so leave them out of the Tab cycle.
const FOCUSABLE = 'a[href]:not([tabindex="-1"]), button:not([disabled]), input:not([disabled])';

const productPath = (product) => `/singleProduct/${encodeURIComponent(product.slug || product.id)}`;

/** Bold the first case-insensitive occurrence of `term` in `text`. */
function Highlight({ text, term }) {
    const value = String(text ?? '');
    const index = term ? value.toLowerCase().indexOf(term.toLowerCase()) : -1;
    if (index === -1) return value;

    return (
        <>
            {value.slice(0, index)}
            <mark className="bg-transparent font-semibold text-zinc-950">{value.slice(index, index + term.length)}</mark>
            {value.slice(index + term.length)}
        </>
    );
}

/**
 * Header search: finds products by name or style number (SKU) as you type.
 * `onClose` should be a stable callback.
 */
export default function SearchModal({ onClose }) {
    const navigate = useNavigate();
    const inputId = useId();
    const listId = useId();
    const dialogRef = useRef(null);
    const inputRef = useRef(null);

    const [query, setQuery] = useState('');
    // `term` is the query the current results belong to, so highlights stay in sync while typing.
    const [search, setSearch] = useState({ status: 'idle', results: [], term: '' });
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isShown, setIsShown] = useState(false);

    const trimmedQuery = query.trim();
    const isQueryTooShort = trimmedQuery.length < MIN_QUERY_LENGTH;
    const results = isQueryTooShort ? [] : search.results;
    const activeOption = activeIndex < results.length ? activeIndex : -1;
    const optionId = (index) => `${listId}-option-${index}`;

    // Lock page scroll, focus the input, close on Escape, and give focus back when it closes.
    useEffect(() => {
        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        inputRef.current?.focus();
        const frame = requestAnimationFrame(() => setIsShown(true));

        function handleKeyDown(event) {
            if (event.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            if (previouslyFocused?.isConnected) previouslyFocused.focus();
        };
    }, [onClose]);

    // Debounced fetch; a newer keystroke cancels the pending or in-flight request.
    useEffect(() => {
        if (trimmedQuery.length < MIN_QUERY_LENGTH) return undefined;

        const controller = new AbortController();
        const timer = setTimeout(() => {
            setSearch((previous) => ({ ...previous, status: 'loading' }));

            fetch(`/api/public/products/search?q=${encodeURIComponent(trimmedQuery)}`, {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            })
                .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Search failed.'))))
                .then((payload) => {
                    setSearch({ status: 'done', results: Array.isArray(payload) ? payload : [], term: trimmedQuery });
                    setActiveIndex(-1);
                })
                .catch((error) => {
                    if (error.name !== 'AbortError') {
                        setSearch({ status: 'error', results: [], term: trimmedQuery });
                        setActiveIndex(-1);
                    }
                });
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [trimmedQuery]);

    // Keep the keyboard-highlighted result visible inside the scrolling list.
    useEffect(() => {
        if (activeIndex >= 0) {
            document.getElementById(`${listId}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex, listId]);

    function openProduct(product) {
        navigate(productPath(product));
        onClose();
    }

    function handleInputKeyDown(event) {
        if (!results.length) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((activeOption + 1) % results.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(activeOption <= 0 ? results.length - 1 : activeOption - 1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            openProduct(results[activeOption >= 0 ? activeOption : 0]);
        }
    }

    // Keep Tab / Shift+Tab inside the dialog.
    function trapFocus(event) {
        if (event.key !== 'Tab' || !dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll(FOCUSABLE);
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function clearQuery() {
        setQuery('');
        setActiveIndex(-1);
        inputRef.current?.focus();
    }

    const isLoading = !isQueryTooShort && (search.status === 'loading' || search.term !== trimmedQuery);
    const hasSettled = !isQueryTooShort && search.status !== 'loading' && search.term === trimmedQuery;

    let body;
    if (isQueryTooShort) {
        body = (
            <p className="py-4 text-[0.95rem] text-zinc-500">
                Search by product name, like <span className="text-zinc-800">“Coverall”</span>, or by style number.
            </p>
        );
    } else if (search.status === 'error' && hasSettled) {
        body = (
            <p role="alert" className="py-4 text-[0.95rem] text-red-700">
                Search isn&apos;t available right now. Please try again.
            </p>
        );
    } else if (hasSettled && !results.length) {
        body = (
            <div className="py-4">
                <p className="text-[1rem] text-zinc-900">No products match “{search.term}”.</p>
                <p className="mt-1 text-[0.9rem] text-zinc-500">Check the spelling, or try the full style number.</p>
            </div>
        );
    } else if (results.length) {
        body = (
            <>
                <p className="px-3 pb-3 text-[0.75rem] font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Products ({results.length >= RESULT_LIMIT ? `${RESULT_LIMIT}+` : results.length})
                </p>
                <div id={listId} role="listbox" aria-label="Search results" className="space-y-1">
                    {results.map((product, index) => (
                        <Link
                            key={product.id}
                            id={optionId(index)}
                            to={productPath(product)}
                            onClick={onClose}
                            onMouseMove={() => setActiveIndex(index)}
                            role="option"
                            aria-selected={index === activeOption}
                            tabIndex={-1}
                            className={`flex items-center gap-4 rounded-md px-3 py-3 transition-colors ${
                                index === activeOption ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                            }`}
                        >
                            <div className="h-[72px] w-12 shrink-0 overflow-hidden bg-[#f4f4f4]">
                                <img
                                    src={productImageUrl(product)}
                                    alt=""
                                    loading="lazy"
                                    onError={(event) => {
                                        if (!event.currentTarget.src.endsWith(PLACEHOLDER_PRODUCT_IMAGE)) {
                                            event.currentTarget.src = PLACEHOLDER_PRODUCT_IMAGE;
                                        }
                                    }}
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[1rem] text-zinc-800">
                                    <Highlight text={product.name} term={search.term} />
                                </p>
                                <p className="mt-1 truncate text-[0.8rem] text-zinc-500">
                                    {product.sku ? (
                                        <>
                                            Style # <span className="tracking-wide text-zinc-700"><Highlight text={product.sku} term={search.term} /></span>
                                        </>
                                    ) : null}
                                    {product.sku && product.category ? <span aria-hidden="true"> · </span> : null}
                                    {product.category}
                                </p>
                            </div>

                            {product.price !== null && product.price !== undefined && product.price !== '' ? (
                                <p className="shrink-0 text-[0.95rem] text-zinc-900">{formatPrice(product.price)}</p>
                            ) : null}
                        </Link>
                    ))}
                </div>
                {results.length >= RESULT_LIMIT ? (
                    <p className="px-3 pt-4 text-[0.82rem] text-zinc-500">
                        Showing the first {RESULT_LIMIT} matches. Add more of the name or style number to narrow it down.
                    </p>
                ) : null}
            </>
        );
    } else {
        // First request for this query is still pending.
        body = <p className="py-4 text-[0.95rem] text-zinc-500">Searching…</p>;
    }

    return createPortal(
        <div
            className={`${timelessFontClass} fixed inset-0 z-[100] bg-zinc-900/40 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${
                isShown ? 'opacity-100' : 'opacity-0'
            }`}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Search products"
                onKeyDown={trapFocus}
                className={`w-full border-b border-zinc-200 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
                    isShown ? 'translate-y-0' : '-translate-y-4'
                }`}
            >
                <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-10">
                    <div className="flex h-[90px] items-center gap-3 border-b border-zinc-200 sm:gap-4">
                        <label htmlFor={inputId} className="shrink-0 text-zinc-950">
                            <Search className="size-6" strokeWidth={1.75} aria-hidden="true" />
                            <span className="sr-only">Search products</span>
                        </label>
                        <input
                            ref={inputRef}
                            id={inputId}
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={handleInputKeyDown}
                            placeholder="Search by product name or style number"
                            autoComplete="off"
                            spellCheck={false}
                            role="combobox"
                            aria-autocomplete="list"
                            aria-expanded={results.length > 0}
                            aria-controls={results.length ? listId : undefined}
                            aria-activedescendant={activeOption >= 0 ? optionId(activeOption) : undefined}
                            className="h-full min-w-0 flex-1 bg-transparent text-[1.1rem] text-zinc-950 outline-none placeholder:text-zinc-400 sm:text-[1.4rem] [&::-webkit-search-cancel-button]:appearance-none"
                        />
                        {isLoading ? (
                            <LoaderCircle className="size-5 shrink-0 animate-spin text-zinc-400" strokeWidth={1.75} aria-hidden="true" />
                        ) : null}
                        {query ? (
                            <button
                                type="button"
                                onClick={clearQuery}
                                className="shrink-0 text-[0.75rem] font-medium uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-950"
                            >
                                Clear
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close search"
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-zinc-950 transition-colors hover:bg-zinc-100"
                        >
                            <X className="size-6" strokeWidth={1.75} />
                        </button>
                    </div>

                    <div className="max-h-[calc(100dvh-90px-4rem)] overflow-y-auto overscroll-contain py-5">
                        {body}
                    </div>

                    {/* Short announcement for screen readers instead of reading the whole list. */}
                    <p role="status" className="sr-only">
                        {hasSettled && search.status === 'done'
                            ? `${results.length >= RESULT_LIMIT ? `${RESULT_LIMIT} or more` : results.length} ${results.length === 1 ? 'product' : 'products'} found`
                            : ''}
                    </p>
                </div>
            </div>
        </div>,
        document.body,
    );
}
