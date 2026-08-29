import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { featuresFontClass } from '../../utils/typography';
import SingleProductDetailsPanel from './SingleProductDetailsPanel.jsx';
import SingleProductMediaGallery from './SingleProductMediaGallery.jsx';

const product = {
    name: 'Corporate Full Sleeve T-Shirt',
    price: '$16.95',
    basePrice: 16.95,
    stagePrices: [],
    description:
        'Designed for comfort and professionalism, the Corporate Full Sleeve T-shirt combines premium fabric with a clean modern fit.',
    colors: [
        { label: 'Black', value: '#000000' },
        { label: 'Green', value: '#5d9b88' },
        { label: 'Cream', value: '#e8e3c7' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
};

const productImages = [
    '/uploads/heroes/images/hero1.webp',
    '/uploads/heroes/images/hero1.webp',
    '/uploads/heroes/images/hero1.webp',
    '/uploads/heroes/images/hero1.webp',
    '/uploads/heroes/images/hero1.webp',
    '/uploads/heroes/images/hero1.webp',
];

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

function normalizeImageUrl(image) {
    if (!image) return null;
    if (/^https?:\/\//i.test(image)) {
        const imageUrl = new URL(image);
        if (['localhost', '127.0.0.1'].includes(imageUrl.hostname)) {
            return `${imageUrl.pathname}${imageUrl.search}`;
        }
        return image;
    }
    return image.startsWith('/') ? image : `/${image}`;
}

function asList(value) {
    if (Array.isArray(value)) return value;
    return value === null || value === undefined || value === '' ? [] : [value];
}

function toPlainText(value) {
    if (!value) return '';
    return new DOMParser().parseFromString(String(value), 'text/html').body.textContent?.trim() || '';
}

// Picks the price tier whose quantity range contains the selected quantity, preferring the
// "Guest" status tier since the storefront has no logged-in customer accounts.
function resolveUnitPrice(stagePrices, quantity, basePrice) {
    if (!Array.isArray(stagePrices) || stagePrices.length === 0) return basePrice;

    const matches = stagePrices.filter((row) => (
        Number(quantity) >= Number(row.minimum_quantity)
        && Number(quantity) <= Number(row.maximum_quantity)
    ));

    if (matches.length === 0) return basePrice;

    const preferred = matches.find((row) => row.status === 'Guest') || matches[0];
    return Number(preferred.price);
}

function normalizeProduct(payload, colorOptions, sizeOptions) {
    const rawColors = asList(payload.color);
    const rawSizes = asList(payload.size);
    const gallery = Array.isArray(payload.image_gallery) ? payload.image_gallery : [];
    const images = [payload.cover_image_url, ...gallery]
        .map(normalizeImageUrl)
        .filter((image, index, allImages) => image && allImages.indexOf(image) === index);

    const colorVariantImages = payload.color_variant_images && typeof payload.color_variant_images === 'object'
        ? payload.color_variant_images
        : {};

    // Maps each color's label to its admin-attached images (keyed by raw color id in the API payload).
    const colorImages = {};

    return {
        ...payload,
        basePrice: Number(payload.price || 0),
        stagePrices: Array.isArray(payload.stage_prices) ? payload.stage_prices : [],
        price: `$${Number(payload.price || 0).toFixed(2)}`,
        description: toPlainText(payload.description || payload.long_description),
        colors: rawColors.map((color) => {
            const option = colorOptions.find((item) => String(item.id) === String(color));
            const label = option?.name || String(color);
            const attachedImages = Array.isArray(colorVariantImages[color])
                ? colorVariantImages[color].map(normalizeImageUrl).filter(Boolean)
                : [];
            if (attachedImages.length) colorImages[label] = attachedImages;
            return {
                label,
                value: option?.color_code || (label.startsWith('#')
                    ? label
                    : namedColors[label.toLowerCase()] || '#707070'),
            };
        }),
        colorImages,
        sizes: rawSizes.map((size) => {
            const option = sizeOptions.find((item) => String(item.id) === String(size));
            return String(option?.Size || option?.size || size);
        }),
        images: images.length ? images : productImages,
    };
}

export default function SingleProductMainSection() {
    const { productSlug } = useParams();
    const navigate = useNavigate();
    const [resolvedProduct, setResolvedProduct] = useState({ ...product, images: productImages });
    const [isLoading, setIsLoading] = useState(Boolean(productSlug));
    const [loadError, setLoadError] = useState('');

    const [selectedImage, setSelectedImage] = useState(productImages[0]);
    const [selectedColor, setSelectedColor] = useState(resolvedProduct.colors[0].label);
    const [selectedSize, setSelectedSize] = useState('M');
    const [quantity, setQuantity] = useState(1);
    const [cartNotice, setCartNotice] = useState('');

    useEffect(() => {
        if (!productSlug) return undefined;

        const controller = new AbortController();
        setIsLoading(true);
        setLoadError('');

        const requestOptions = { headers: { Accept: 'application/json' }, signal: controller.signal };
        const fetchOptions = (url) => fetch(url, requestOptions)
            .then((response) => response.ok ? response.json() : []);

        Promise.all([
            fetch(`/api/public/products/${encodeURIComponent(productSlug)}`, requestOptions)
                .then((response) => response.ok ? response.json() : Promise.reject(new Error('Product not found.'))),
            fetchOptions('/public/colors'),
            fetchOptions('/public/sizes'),
        ])
            .then(([payload, colorOptions, sizeOptions]) => {
                const nextProduct = normalizeProduct(payload, colorOptions, sizeOptions);
                setResolvedProduct(nextProduct);
                setSelectedImage(nextProduct.images[0]);
                setSelectedColor(nextProduct.colors[0]?.label || '');
                setSelectedSize(nextProduct.sizes[0] || '');
            })
            .catch((error) => {
                if (error.name !== 'AbortError') setLoadError(error.message || 'Unable to load this product.');
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false);
            });

        return () => controller.abort();
    }, [productSlug]);

    const breadcrumbs = useMemo(
        () => [
            { label: 'Home', to: '/' },
            { label: 'Shop', to: '/shop' },
            {
                label: resolvedProduct.name,
                to: productSlug ? `/singleProduct/${productSlug}` : '/singleProduct',
            },
        ],
        [productSlug, resolvedProduct.name]
    );

    const unitPrice = useMemo(
        () => resolveUnitPrice(resolvedProduct.stagePrices, quantity, resolvedProduct.basePrice ?? 0),
        [resolvedProduct.stagePrices, resolvedProduct.basePrice, quantity]
    );

    const galleryImages = useMemo(() => {
        const attachedImages = resolvedProduct.colorImages?.[selectedColor];
        return attachedImages?.length ? attachedImages : resolvedProduct.images;
    }, [resolvedProduct.colorImages, resolvedProduct.images, selectedColor]);

    useEffect(() => {
        setSelectedImage(galleryImages[0]);
    }, [galleryImages]);

    const displayProduct = useMemo(
        () => ({ ...resolvedProduct, price: `$${unitPrice.toFixed(2)}` }),
        [resolvedProduct, unitPrice]
    );

    function decreaseQuantity() {
        setQuantity((previous) => Math.max(1, previous - 1));
    }

    function increaseQuantity() {
        setQuantity((previous) => previous + 1);
    }

    function buildCartItem() {
        const safeProductId = Number(resolvedProduct.id) || 0;

        return {
            id: `${safeProductId || resolvedProduct.name}-${selectedColor}-${selectedSize}`,
            productId: safeProductId,
            name: resolvedProduct.name,
            price: `$${unitPrice.toFixed(2)}`,
            color: selectedColor,
            size: selectedSize,
            quantity,
            image: selectedImage,
        };
    }

    function saveToCart(item) {
        const storageKey = 'timeless_cart';
        const saved = localStorage.getItem(storageKey);
        const parsedCart = saved ? JSON.parse(saved) : [];
        const cart = Array.isArray(parsedCart) ? parsedCart : [];

        const existingIndex = cart.findIndex((cartEntry) => cartEntry.id === item.id);

        if (existingIndex >= 0) {
            cart[existingIndex].quantity += item.quantity;
        } else {
            cart.push(item);
        }

        localStorage.setItem(storageKey, JSON.stringify(cart));
        return cart;
    }

    function addToCart() {
        const cartItem = buildCartItem();

        try {
            saveToCart(cartItem);
            setCartNotice(`${resolvedProduct.name} added to cart.`);
            window.setTimeout(() => setCartNotice(''), 2200);
        } catch {
            setCartNotice('Unable to add item right now. Please try again.');
        }
    }

    function buyNow() {
        const cartItem = buildCartItem();

        try {
            saveToCart(cartItem);
            localStorage.setItem('timeless_checkout_now', JSON.stringify([cartItem]));
            navigate('/checkout');
        } catch {
            setCartNotice('Unable to start checkout right now. Please try again.');
        }
    }

    if (isLoading) {
        return <section className="min-h-[680px] bg-white px-5 py-16 text-center text-zinc-500">Loading product...</section>;
    }

    if (loadError) {
        return <section className="min-h-[680px] bg-white px-5 py-16 text-center text-zinc-700">{loadError}</section>;
    }

    return (
        <section className={`${featuresFontClass} bg-white px-5 py-8 sm:px-8 lg:px-12 lg:py-10`}>
            <div className="mx-auto w-full max-w-[1700px]">
                <p className="mb-4 text-[0.7rem] uppercase tracking-[0.15em] text-zinc-500 sm:mb-6">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={crumb.label}>
                            <Link to={crumb.to} className="transition-colors hover:text-zinc-900">
                                {crumb.label}
                            </Link>
                            {index < breadcrumbs.length - 1 ? ' / ' : ''}
                        </span>
                    ))}
                </p>

                <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
                    <div className="self-start">
                        <SingleProductMediaGallery
                            images={galleryImages}
                            selectedImage={selectedImage}
                            onSelectImage={setSelectedImage}
                            productName={resolvedProduct.name}
                        />
                    </div>

                    <SingleProductDetailsPanel
                        product={displayProduct}
                        productSlug={productSlug}
                        selectedColor={selectedColor}
                        onSelectColor={setSelectedColor}
                        selectedSize={selectedSize}
                        onSelectSize={setSelectedSize}
                        quantity={quantity}
                        onDecreaseQuantity={decreaseQuantity}
                        onIncreaseQuantity={increaseQuantity}
                        onAddToCart={addToCart}
                        onBuyNow={buyNow}
                        cartNotice={cartNotice}
                    />
                </div>
            </div>
        </section>
    );
}