import { Check, ChevronRight, Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

import { addCartItem, cartItemId, resolveUnitPrice } from '../../utils/cart';
import {
    formatPrice,
    isVariantInStock,
    priceAmount,
    productColors,
    productGallery,
    productSizes,
} from '../../utils/productDisplay';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

const primaryButtonClass =
    'inline-flex h-14 items-center justify-center gap-2 rounded-md bg-zinc-950 px-6 text-[1rem] font-medium text-white transition-colors hover:bg-zinc-800';
const secondaryButtonClass =
    'inline-flex h-14 items-center justify-center gap-2 rounded-md border border-zinc-900 bg-white px-6 text-[1rem] font-medium text-zinc-950 transition-colors hover:bg-zinc-50';

/**
 * "Add to cart" popup for the shop grid: pick colour, size and quantity, then add to the same
 * localStorage cart the product page uses. `onClose` should be a stable callback.
 */
export default function QuickAddModal({ product, initialColorIndex = 0, onClose }) {
    const titleId = useId();
    const dialogRef = useRef(null);
    const colors = useMemo(() => productColors(product), [product]);
    const sizes = useMemo(() => productSizes(product), [product]);

    const [colorIndex, setColorIndex] = useState(() => Math.min(initialColorIndex, Math.max(colors.length - 1, 0)));
    const [sizeToken, setSizeToken] = useState(() => (sizes.length === 1 ? sizes[0].token : ''));
    const [quantity, setQuantity] = useState(1);
    const [imageIndex, setImageIndex] = useState(0);
    const [status, setStatus] = useState('idle'); // 'idle' | 'added' | 'error'
    const [showSizeHint, setShowSizeHint] = useState(false);

    const color = colors[colorIndex];
    const size = sizes.find((option) => option.token === sizeToken);
    const gallery = useMemo(() => productGallery(product, color?.token), [product, color?.token]);
    const image = gallery[Math.min(imageIndex, gallery.length - 1)];
    const unitPrice = resolveUnitPrice(product.stage_prices, quantity, priceAmount(product.price));
    const productPath = `/singleProduct/${encodeURIComponent(product.slug || product.id)}`;

    // Lock page scroll, focus the dialog, close on Escape, and give focus back when it closes.
    useEffect(() => {
        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialogRef.current?.focus();

        function handleKeyDown(event) {
            if (event.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            if (previouslyFocused?.isConnected) previouslyFocused.focus();
        };
    }, [onClose]);

    // Keep Tab / Shift+Tab inside the dialog.
    function trapFocus(event) {
        if (event.key !== 'Tab' || !dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll(FOCUSABLE);
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    // Changing any choice after adding means the next click adds a new selection.
    function selectColor(index) {
        const nextColor = colors[index];
        setColorIndex(index);
        setImageIndex(0);
        if (sizeToken && !isVariantInStock(product, nextColor?.token, sizeToken)) setSizeToken('');
        setStatus('idle');
    }

    function selectSize(token) {
        setSizeToken(token);
        setShowSizeHint(false);
        setStatus('idle');
    }

    function changeQuantity(next) {
        const value = Math.floor(Number(next));
        setQuantity(Number.isFinite(value) && value > 0 ? value : 1);
        setStatus('idle');
    }

    function handleAddToCart() {
        if (sizes.length && !size) {
            setShowSizeHint(true);
            return;
        }

        const productId = Number(product.id) || 0;
        const colorLabel = color?.label ?? '';
        const sizeLabel = size?.label ?? '';

        try {
            addCartItem({
                id: cartItemId(productId, product.name, colorLabel, sizeLabel),
                productId,
                name: product.name,
                price: `$${unitPrice.toFixed(2)}`,
                basePrice: priceAmount(product.price),
                stagePrices: Array.isArray(product.stage_prices) ? product.stage_prices : [],
                color: colorLabel,
                colorValue: color?.value ?? '',
                size: sizeLabel,
                quantity,
                image,
            });
            setStatus('added');
        } catch {
            setStatus('error');
        }
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/50 p-4 font-poppins backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onKeyDown={trapFocus}
                className="relative max-h-[92vh] w-full max-w-[1020px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl outline-none sm:p-8 lg:p-10"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full text-zinc-900 transition-colors hover:bg-zinc-100 sm:right-5 sm:top-5"
                >
                    <X className="size-6" strokeWidth={1.75} />
                </button>

                <div className="grid gap-8 md:grid-cols-[0.9fr_1fr] md:gap-10">
                    {/* Images */}
                    <div>
                        <div className="aspect-[4/5] overflow-hidden rounded-lg bg-[#f4f4f4]">
                            <img src={image} alt={product.name} className="h-full w-full object-cover" />
                        </div>

                        {gallery.length > 1 ? (
                            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                                {gallery.slice(0, 6).map((thumbnail, index) => (
                                    <button
                                        key={thumbnail}
                                        type="button"
                                        onClick={() => setImageIndex(index)}
                                        aria-label={`Show image ${index + 1}`}
                                        aria-pressed={image === thumbnail}
                                        className={`size-20 shrink-0 overflow-hidden rounded-md border-2 bg-[#f4f4f4] transition-colors ${
                                            image === thumbnail ? 'border-zinc-900' : 'border-transparent hover:border-zinc-300'
                                        }`}
                                    >
                                        <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {/* Options */}
                    <div className="flex flex-col">
                        {status === 'added' ? (
                            <div role="status" className="mb-6 flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3.5 sm:mr-10">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                                    <Check className="size-4" strokeWidth={3} />
                                </span>
                                <p className="flex-1 text-[0.92rem] font-medium text-emerald-700">Product added to cart successfully!</p>
                                <button
                                    type="button"
                                    onClick={() => setStatus('idle')}
                                    aria-label="Dismiss message"
                                    className="text-emerald-800 transition-opacity hover:opacity-70"
                                >
                                    <X className="size-5" strokeWidth={1.75} />
                                </button>
                            </div>
                        ) : null}

                        {status === 'error' ? (
                            <p role="alert" className="mb-6 rounded-lg bg-red-50 px-4 py-3.5 text-[0.92rem] text-red-700 sm:mr-10">
                                Couldn't add this item right now. Please try again.
                            </p>
                        ) : null}

                        <h2 id={titleId} className="pr-10 text-[1.75rem] font-semibold leading-tight text-zinc-950">
                            {product.name}
                        </h2>
                        <p className="mt-3 text-[1.75rem] font-semibold text-zinc-950">{formatPrice(unitPrice)}</p>
                        {product.stage_prices?.length ? (
                            <p className="mt-1 text-[0.78rem] text-zinc-500">Price per item at this quantity.</p>
                        ) : null}

                        {colors.length ? (
                            <div className="mt-6">
                                <p className="text-[0.95rem] text-zinc-700">
                                    {colors.length} {colors.length === 1 ? 'Colour' : 'Colours'}
                                    {color ? <span className="text-zinc-400"> · {color.label}</span> : null}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2.5">
                                    {colors.map((option, index) => (
                                        <button
                                            key={`${option.value}-${index}`}
                                            type="button"
                                            onClick={() => selectColor(index)}
                                            aria-label={`Colour ${option.label}`}
                                            aria-pressed={index === colorIndex}
                                            title={option.label}
                                            className={`size-9 rounded-full border border-zinc-300 transition-transform hover:scale-105 ${
                                                index === colorIndex ? 'ring-2 ring-zinc-900 ring-offset-2' : ''
                                            }`}
                                            style={{ backgroundColor: option.value }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className="my-6 h-px bg-zinc-200" />

                        {sizes.length ? (
                            <fieldset>
                                <legend className="text-[0.95rem] font-semibold text-zinc-950">Size</legend>
                                <div className="mt-3 flex flex-wrap gap-3">
                                    {sizes.map((option) => {
                                        const inStock = isVariantInStock(product, color?.token, option.token);
                                        const isSelected = option.token === sizeToken;

                                        return (
                                            <button
                                                key={option.token}
                                                type="button"
                                                onClick={() => selectSize(option.token)}
                                                disabled={!inStock}
                                                aria-pressed={isSelected}
                                                title={inStock ? undefined : 'Out of stock'}
                                                className={`h-12 min-w-[64px] rounded-md border px-4 text-[0.92rem] font-medium transition-colors disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-300 disabled:line-through ${
                                                    isSelected
                                                        ? 'border-zinc-950 bg-zinc-950 text-white'
                                                        : 'border-zinc-300 text-zinc-900 hover:border-zinc-900'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {showSizeHint && !size ? (
                                    <p role="alert" className="mt-2 text-[0.82rem] text-red-600">Please select a size.</p>
                                ) : null}
                            </fieldset>
                        ) : null}

                        <div className={sizes.length ? 'mt-6' : ''}>
                            <p className="text-[0.95rem] font-semibold text-zinc-950">Quantity</p>
                            <div className="mt-3 inline-flex h-12 items-center rounded-md border border-zinc-300">
                                <button
                                    type="button"
                                    onClick={() => changeQuantity(quantity - 1)}
                                    disabled={quantity <= 1}
                                    aria-label="Decrease quantity"
                                    className="flex h-full w-12 items-center justify-center text-zinc-700 transition-colors hover:text-zinc-950 disabled:text-zinc-300"
                                >
                                    <Minus className="size-4" strokeWidth={1.75} />
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    inputMode="numeric"
                                    value={quantity}
                                    onChange={(event) => changeQuantity(event.target.value)}
                                    aria-label="Quantity"
                                    className="h-full w-14 bg-transparent text-center text-[1rem] text-zinc-950 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => changeQuantity(quantity + 1)}
                                    aria-label="Increase quantity"
                                    className="flex h-full w-12 items-center justify-center text-zinc-700 transition-colors hover:text-zinc-950"
                                >
                                    <Plus className="size-4" strokeWidth={1.75} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 grid gap-3 sm:grid-cols-2">
                            {status === 'added' ? (
                                <>
                                    <Link to="/cart" onClick={onClose} className={secondaryButtonClass}>
                                        View Cart
                                        <ShoppingCart className="size-5" strokeWidth={1.75} />
                                    </Link>
                                    <button type="button" onClick={onClose} className={primaryButtonClass}>
                                        Continue Shopping
                                        <ChevronRight className="size-5" strokeWidth={1.75} />
                                    </button>
                                </>
                            ) : (
                                <button type="button" onClick={handleAddToCart} className={`${primaryButtonClass} sm:col-span-2`}>
                                    Add to Cart
                                    <ShoppingCart className="size-5" strokeWidth={1.75} />
                                </button>
                            )}
                        </div>

                        <Link
                            to={productPath}
                            onClick={onClose}
                            className="mt-5 self-center text-[0.85rem] text-zinc-500 underline underline-offset-4 transition-colors hover:text-zinc-950"
                        >
                            View full product details
                        </Link>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
