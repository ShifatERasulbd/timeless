// Helpers for showing products from /api/public/products on the storefront (shop grid, quick add).

export const PLACEHOLDER_PRODUCT_IMAGE = '/uploads/heroes/images/hero1.webp';

export function normalizeImagePath(image) {
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

export function productImageUrl(product) {
    const galleryImage = Array.isArray(product.image_gallery)
        ? product.image_gallery.find(Boolean)
        : null;
    const image = product.cover_image_url || product.cover_image || galleryImage;
    return image ? normalizeImagePath(image) : PLACEHOLDER_PRODUCT_IMAGE;
}

// `color_variant_images` (from the API) is keyed by each color's raw token (see `token` below),
// with arrays of admin-attached image paths for that color.
function colorImages(product, token) {
    const variantImages = product.color_variant_images && typeof product.color_variant_images === 'object'
        ? product.color_variant_images[token]
        : null;
    return Array.isArray(variantImages) ? variantImages.map(normalizeImagePath).filter(Boolean) : [];
}

export function colorImageUrl(product, token) {
    return colorImages(product, token)[0] || null;
}

/** All images for a colour (its own images, else the cover + gallery), without duplicates. */
export function productGallery(product, token) {
    const ownImages = colorImages(product, token);
    const images = ownImages.length
        ? ownImages
        : [product.cover_image_url || product.cover_image, ...(Array.isArray(product.image_gallery) ? product.image_gallery : [])]
            .map(normalizeImagePath)
            .filter(Boolean);
    const unique = images.filter((image, index) => images.indexOf(image) === index);
    return unique.length ? unique : [PLACEHOLDER_PRODUCT_IMAGE];
}

export function priceAmount(price) {
    const amount = Number(String(price ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(amount) ? amount : 0;
}

export function formatPrice(price) {
    const amount = Number(String(price).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : price;
}

const NAMED_COLORS = {
    black: '#111111',
    white: '#ffffff',
    navy: '#1f2d49',
    red: '#b52a2f',
    grey: '#9ca3af',
    gray: '#9ca3af',
    blue: '#315f91',
    green: '#526c55',
};

function colorValue(color) {
    const normalized = String(color).toLowerCase();
    return NAMED_COLORS[normalized] || color;
}

// `product.colors` (from the API) already resolves color IDs/names into { label, value } hex
// codes; `product.color` is the raw stored value (often a numeric Color id) and isn't a valid
// CSS color on its own, so prefer `colors` and only fall back to `color` for legacy data.
export function productColors(product) {
    const source = (Array.isArray(product.colors) && product.colors.length)
        ? product.colors
        : (Array.isArray(product.color) ? product.color : []);

    return source.map((color) => (
        typeof color === 'object' && color !== null
            ? { label: color.label ?? color.value, value: color.value, token: color.token }
            : { label: color, value: colorValue(color), token: color }
    ));
}

/** Sizes as `{ token, label, position }`, resolved by the API from the Size admin. */
export function productSizes(product) {
    return Array.isArray(product.size_options) ? product.size_options : [];
}

/**
 * False only when the product's variant rows explicitly list this colour + size with zero stock.
 * Missing rows or blank stock count as available, since not every product tracks stock per variant.
 */
export function isVariantInStock(product, colorToken, sizeToken) {
    const rows = Array.isArray(product.variant_rows) ? product.variant_rows : [];
    const row = rows.find((variant) => String(variant?.color) === String(colorToken) && String(variant?.size) === String(sizeToken));
    if (!row || row.stock === '' || row.stock === null || row.stock === undefined) return true;
    return Number(row.stock) > 0;
}
