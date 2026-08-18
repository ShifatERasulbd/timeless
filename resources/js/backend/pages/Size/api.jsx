import { requestJson } from '@/lib/apiClient';

function asList(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];

    try {
        const decoded = JSON.parse(value);
        return Array.isArray(decoded) ? decoded : [value];
    } catch {
        return value.trim() ? [value] : [];
    }
}

export async function fetchSizes() {
    const payload = await requestJson('/api/products');
    const products = Array.isArray(payload) ? payload : (payload?.data || payload?.items || []);
    const sizes = new Set();

    products.forEach((product) => {
        asList(product?.size).forEach((size) => {
            const value = String(size).trim();
            if (value) sizes.add(value);
        });
    });

    return Array.from(sizes).map((size) => ({ id: size, size }));
}