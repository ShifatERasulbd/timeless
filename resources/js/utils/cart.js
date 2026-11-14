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
