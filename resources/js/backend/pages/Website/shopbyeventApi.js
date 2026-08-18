async function ensureCsrfCookie() {
    await fetch('/sanctum/csrf-cookie', {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(options.headers || {}),
        },
        ...options,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
        const error = new Error(payload?.message || 'Request failed');
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}

export async function fetchShopByIndustry() {
    return requestJson('/api/shop-by-industry');
}

export async function updateShopByIndustrySection(data = {}) {
    await ensureCsrfCookie();

    return requestJson('/api/shop-by-industry', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: data.title || '',
            subtitle: data.subtitle || '',
        }),
    });
}

export async function createShopByIndustryItem(data = {}) {
    await ensureCsrfCookie();

    const formData = new FormData();
    formData.append('title', data.title || '');
    formData.append('sort_order', String(data.sort_order ?? 0));

    if (data.image instanceof File) {
        formData.append('image', data.image);
    }

    return requestJson('/api/shop-by-industry/items', {
        method: 'POST',
        body: formData,
    });
}

export async function updateShopByIndustryItem(id, data = {}) {
    await ensureCsrfCookie();

    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('title', data.title || '');
    formData.append('sort_order', String(data.sort_order ?? 0));

    if (data.image instanceof File) {
        formData.append('image', data.image);
    }

    return requestJson(`/api/shop-by-industry/items/${id}`, {
        method: 'POST',
        body: formData,
    });
}

export async function deleteShopByIndustryItem(id) {
    await ensureCsrfCookie();

    return requestJson(`/api/shop-by-industry/items/${id}`, {
        method: 'DELETE',
    });
}
