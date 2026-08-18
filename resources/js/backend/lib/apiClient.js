async function ensureCsrfCookie() {
    const response = await fetch('/sanctum/csrf-cookie', {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    if (!response.ok) {
        throw new Error('Unable to initialize the secure request.');
    }
}

export async function requestJson(url, options = {}) {
    const { needsCsrf = false, headers = {}, ...fetchOptions } = options;
    const contentHeaders = typeof fetchOptions.body === 'string'
        ? { 'Content-Type': 'application/json' }
        : {};

    if (needsCsrf) {
        await ensureCsrfCookie();
    }

    const response = await fetch(url, {
        credentials: 'include',
        ...fetchOptions,
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...contentHeaders,
            ...headers,
        },
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
        const error = new Error(payload?.message || 'Request failed.');
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}