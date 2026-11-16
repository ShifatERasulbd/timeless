// Customer account API (session cookie auth via Sanctum's stateful SPA mode).

function readXsrfTokenFromCookie() {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

async function ensureCsrfCookie(force = false) {
    if (!force && readXsrfTokenFromCookie()) return;

    await fetch('/sanctum/csrf-cookie', {
        credentials: 'include',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    });
}

async function send(url, { method = 'GET', body } = {}) {
    const isMutation = method !== 'GET';

    return fetch(url, {
        method,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...(isMutation ? { 'X-XSRF-TOKEN': readXsrfTokenFromCookie() } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
}

/**
 * JSON request helper. Throws an Error carrying `status`, `payload` and `fieldErrors`
 * (first message per field, from Laravel validation responses).
 */
export async function apiRequest(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();

    if (method !== 'GET') {
        await ensureCsrfCookie();
    }

    let response = await send(url, { ...options, method });

    // 419 = CSRF token mismatch (e.g. the session expired). Refresh the token once and retry.
    if (response.status === 419 && method !== 'GET') {
        await ensureCsrfCookie(true);
        response = await send(url, { ...options, method });
    }

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
        const error = new Error(
            response.status === 429
                ? 'Too many attempts. Please wait a minute and try again.'
                : payload?.message || 'Something went wrong. Please try again.'
        );
        error.status = response.status;
        error.payload = payload;
        error.fieldErrors = Object.fromEntries(
            Object.entries(payload?.errors || {}).map(([key, messages]) => [key, Array.isArray(messages) ? messages[0] : messages])
        );
        throw error;
    }

    return payload;
}

export const accountApi = {
    session: () => apiRequest('/api/account/session'),
    login: (data) => apiRequest('/api/account/login', { method: 'POST', body: data }),
    register: (data) => apiRequest('/api/account/register', { method: 'POST', body: data }),
    logout: () => apiRequest('/api/account/logout', { method: 'POST' }),
    forgotPassword: (data) => apiRequest('/api/account/forgot-password', { method: 'POST', body: data }),
    resetPassword: (data) => apiRequest('/api/account/reset-password', { method: 'POST', body: data }),

    dashboard: () => apiRequest('/api/account/dashboard'),
    updateProfile: (data) => apiRequest('/api/account/profile', { method: 'PUT', body: data }),
    updatePassword: (data) => apiRequest('/api/account/password', { method: 'PUT', body: data }),

    orders: ({ status = '', page = 1 } = {}) => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (page > 1) params.set('page', String(page));
        const query = params.toString();
        return apiRequest(`/api/account/orders${query ? `?${query}` : ''}`);
    },
    order: (orderNumber) => apiRequest(`/api/account/orders/${encodeURIComponent(orderNumber)}`),
    cancelOrder: (orderNumber) =>
        apiRequest(`/api/account/orders/${encodeURIComponent(orderNumber)}/cancel`, { method: 'POST' }),

    addresses: () => apiRequest('/api/account/addresses'),
    createAddress: (data) => apiRequest('/api/account/addresses', { method: 'POST', body: data }),
    updateAddress: (id, data) => apiRequest(`/api/account/addresses/${id}`, { method: 'PUT', body: data }),
    deleteAddress: (id) => apiRequest(`/api/account/addresses/${id}`, { method: 'DELETE' }),
    setDefaultAddress: (id) => apiRequest(`/api/account/addresses/${id}/default`, { method: 'POST' }),

    designs: () => apiRequest('/api/account/designs'),
};
