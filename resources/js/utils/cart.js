export const CART_STORAGE_KEY = 'timeless_cart';
export const CART_UPDATED_EVENT = 'timeless-cart-updated';

export function readCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// Persists the cart and notifies listeners in the same tab (storage events only fire cross-tab).
export function writeCart(items) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export function getCartCount(items = readCart()) {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

/** Cart line id: one line per product + colour + size, so re-adding the same choice merges. */
export function cartItemId(productId, productName, color, size) {
    return `${productId || productName}-${color}-${size}`;
}

/** Adds an item to the cart, merging quantities into an existing line with the same id. */
export function addCartItem(item) {
    const cart = readCart();
    const existingIndex = cart.findIndex((cartEntry) => cartEntry.id === item.id);

    if (existingIndex >= 0) {
        const existing = cart[existingIndex];
        // Keep the newest pricing data, then re-price for the combined quantity.
        cart[existingIndex] = withQuantity({ ...existing, ...item }, (Number(existing.quantity) || 0) + item.quantity);
    } else {
        cart.push(withQuantity(item, item.quantity));
    }

    writeCart(cart);
    return cart;
}

function priceToNumber(price) {
    return Number(String(price ?? '').replace(/[^0-9.]/g, '')) || 0;
}

/**
 * Product price per unit for the item's current quantity. Items saved with `stagePrices`
 * (quantity price tiers) are re-priced so changing the quantity in the cart moves between tiers;
 * older items just use their stored `price`.
 */
export function cartItemUnitPrice(item) {
    if (Array.isArray(item.stagePrices) && item.stagePrices.length) {
        return resolveUnitPrice(item.stagePrices, Number(item.quantity) || 1, Number(item.basePrice ?? priceToNumber(item.price)) || 0);
    }
    return priceToNumber(item.price);
}

/** Per-unit charge for a personalised design on the item (0 when there is no design). */
export function cartItemDesignPrice(item) {
    return Number(item.design?.unitPrice) || 0;
}

/** Everything charged for one cart line: (product unit price + design per unit) × quantity. */
export function cartItemLineTotal(item) {
    return (cartItemUnitPrice(item) + cartItemDesignPrice(item)) * (Number(item.quantity) || 0);
}

/** Returns the item with a new quantity and its stored `price` updated to the matching tier. */
export function withQuantity(item, quantity) {
    const next = { ...item, quantity: Math.max(1, Number(quantity) || 1) };
    return { ...next, price: `$${cartItemUnitPrice(next).toFixed(2)}` };
}

export const SHIPPING_FLAT_RATE = 10;
export const TAX_RATE = 0.1;

/** Order totals shown on the cart page and charged at checkout. */
export function orderTotals(items) {
    const { total: subtotal, ...rest } = summarizeCart(items);
    const shipping = items.length > 0 ? SHIPPING_FLAT_RATE : 0;
    const tax = Number((subtotal * TAX_RATE).toFixed(2));

    return { ...rest, subtotal, shipping, tax, total: subtotal + (subtotal > 0 ? shipping + tax : 0) };
}

/** Totals for the cart summary and checkout. */
export function summarizeCart(items) {
    return items.reduce((summary, item) => {
        const quantity = Number(item.quantity) || 0;
        const products = cartItemUnitPrice(item) * quantity;
        const designs = cartItemDesignPrice(item) * quantity;

        return {
            units: summary.units + quantity,
            products: summary.products + products,
            designs: summary.designs + designs,
            total: summary.total + products + designs,
        };
    }, { units: 0, products: 0, designs: 0, total: 0 });
}

// Picks the price tier whose quantity range contains the selected quantity, preferring the
// "Guest" status tier since the storefront has no logged-in customer accounts.
export function resolveUnitPrice(stagePrices, quantity, basePrice) {
    if (!Array.isArray(stagePrices) || stagePrices.length === 0) return basePrice;

    const matches = stagePrices.filter((row) => (
        Number(quantity) >= Number(row.minimum_quantity)
        && Number(quantity) <= Number(row.maximum_quantity)
    ));

    if (matches.length === 0) return basePrice;

    const preferred = matches.find((row) => row.status === 'Guest') || matches[0];
    return Number(preferred.price);
}
