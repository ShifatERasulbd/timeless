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

export async function fetchColors() {
    const payload = await requestJson('/api/products');
    const products = Array.isArray(payload) ? payload : (payload?.data || payload?.items || []);
    const colors = new Set();

    products.forEach((product) => {
        asList(product?.color).forEach((color) => {
            const value = String(color).trim();
            if (value) colors.add(value);
        });
    });

    return Array.from(colors)
        .sort((first, second) => first.localeCompare(second))
        .map((color) => ({
            id: color,
            name: color,
            color_code: /^#[0-9a-f]{3,8}$/i.test(color) ? color : null,
        }));
}