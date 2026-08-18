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

export async function fetchHowWeHelp() {
    return requestJson('/api/how-we-help');
}

export async function updateHowWeHelpSection(data = {}) {
    await ensureCsrfCookie();

    return requestJson('/api/how-we-help', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: data.title || '',
            description: data.description || '',
        }),
    });
}

export async function createHowWeHelpItem(data = {}) {
    await ensureCsrfCookie();

    const formData = createItemFormData(data);

    return requestJson('/api/how-we-help/items', {
        method: 'POST',
        body: formData,
    });
}

export async function updateHowWeHelpItem(id, data = {}) {
    await ensureCsrfCookie();

    const formData = createItemFormData(data);
    formData.append('_method', 'PUT');

    return requestJson(`/api/how-we-help/items/${id}`, {
        method: 'POST',
        body: formData,
    });
}

export async function deleteHowWeHelpItem(id) {
    await ensureCsrfCookie();

    return requestJson(`/api/how-we-help/items/${id}`, {
        method: 'DELETE',
    });
}

function createItemFormData(data) {
    const formData = new FormData();
    formData.append('title', data.title || '');
    formData.append('description', data.description || '');
    formData.append('sort_order', String(data.sort_order ?? 0));

    if (data.image instanceof File) {
        formData.append('image', data.image);
    }

    return formData;
}