import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { featuresFontClass } from '../../utils/typography';
import SingleProductDetailsPanel from './SingleProductDetailsPanel.jsx';
import SingleProductMediaGallery from './SingleProductMediaGallery.jsx';

const product = {
    name: 'Corporate Full Sleeve T-Shirt',
    price: '$16.95',
    description:
        'Designed for comfort and professionalism, the Corporate Full Sleeve T-shirt combines premium fabric with a clean modern fit.',
    colors: [
        { label: 'Black', value: '#000000' },
        { label: 'Green', value: '#5d9b88' },
        { label: 'Cream', value: '#e8e3c7' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
};

const productOverrides = {
    1: {
        name: 'REGULAR COVERALL',
        price: '$95.00',
        description:
            'Built for durability and comfort, this regular coverall is made for demanding work environments and all-day wear.',
    },
    2: {
        name: 'CORPORATE POLO T-SHIRT',
        price: '$54.00',
        description:
            'A polished polo crafted for team identity and daily comfort, ideal for branded corporate uniforms.',
    },
    3: {
        name: 'FR WORK SHIRT',
        price: '$56.00',
        description:
            'Designed for safer performance on the job, this FR shirt balances protection, mobility, and professional styling.',
    },
    4: {
        name: 'BASIC BIB APRON',
        price: '$56.00',
        description:
            'A practical bib apron offering reliable coverage and a clean fit for hospitality and service teams.',
    },
    5: {
        name: 'CLASSIC TEAM HOODIE',
        price: '$72.00',
        description:
            'Soft, warm, and ready for daily use, this team hoodie is ideal for casual uniforms and active crews.',
    },
    6: {
        name: 'ATHLETIC TEAM JERSEY',
        price: '$60.00',
        description:
            'Lightweight and breathable, this athletic jersey supports movement while keeping branding front and center.',
    },
};

const productImages = [
    '/uploads/heroes/images/hero1.webp',
    '/uploads/heroes/images/hero1.webp',
    '/uploads/heroes/images/hero1.webp',
    '/uploads/heroes/images/hero1.webp',
    '/uploads/heroes/images/hero1.webp',
    '/uploads/heroes/images/hero1.webp',
];

export default function SingleProductMainSection() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const routeProduct = productId ? productOverrides[Number(productId)] : null;
    const resolvedProduct = routeProduct ? { ...product, ...routeProduct } : product;

    const [selectedImage, setSelectedImage] = useState(productImages[0]);
    const [selectedColor, setSelectedColor] = useState(resolvedProduct.colors[0].label);
    const [selectedSize, setSelectedSize] = useState('M');
    const [quantity, setQuantity] = useState(1);
    const [cartNotice, setCartNotice] = useState('');

    const breadcrumbs = useMemo(
        () => [
            { label: 'Home', to: '/' },
            { label: 'Shop', to: '/shop' },
            {
                label: resolvedProduct.name,
                to: productId ? `/singleProduct/${productId}` : '/singleProduct',
            },
        ],
        [productId, resolvedProduct.name]
    );

    function decreaseQuantity() {
        setQuantity((previous) => Math.max(1, previous - 1));
    }

    function increaseQuantity() {
        setQuantity((previous) => previous + 1);
    }

    function buildCartItem() {
        const safeProductId = Number(productId) || 0;

        return {
            id: `${safeProductId || resolvedProduct.name}-${selectedColor}-${selectedSize}`,
            productId: safeProductId,
            name: resolvedProduct.name,
            price: resolvedProduct.price,
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
                            images={productImages}
                            selectedImage={selectedImage}
                            onSelectImage={setSelectedImage}
                        />
                    </div>

                    <SingleProductDetailsPanel
                        product={resolvedProduct}
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