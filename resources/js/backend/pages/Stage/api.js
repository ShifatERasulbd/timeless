// api/stages.js

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

let csrfReady = null;
function ensureCsrfCookieOnce() {
    if (!csrfReady) {
        csrfReady = fetch('/sanctum/csrf-cookie', {
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
    }
    return csrfReady;
}

async function requestJson(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();

    // Make sure we have a CSRF cookie before any mutating request
    if (method !== 'GET' && method !== 'HEAD') {
        await ensureCsrfCookieOnce();
    }

    const headers = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(options.headers || {}),
    };

    if (method !== 'GET' && method !== 'HEAD') {
        const token = getCookie('XSRF-TOKEN');
        if (token) headers['X-XSRF-TOKEN'] = token;
    }

    const response = await fetch(url, {
        credentials: 'include',
        ...options,
        method,
        headers,
    });

    // DELETE / 204 responses often have no body
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
        ? await response.json()
        : null;

    if (!response.ok) {
        const message = payload?.message || 'Request failed';
        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}

function buildStageFormData(data) {
    const formData = new FormData();
    formData.append('minimum_quantity', data.minimum_quantity ?? '');
    formData.append('maximum_quantity', data.maximum_quantity ?? '');
    return formData;
}

// --- CRUD ---

export async function fetchStages() {
    const payload = await requestJson('/api/stages');
    return Array.isArray(payload) ? payload : [];
}

export async function fetchStage(id) {
    return requestJson(`/api/stages/${id}`);
}

export async function createStage(data) {
    return requestJson('/api/stages', {
        method: 'POST',
        body: buildStageFormData(data),
    });
}

export async function updateStage(id, data) {
    // FormData + PUT doesn't get parsed by PHP, so use POST + method spoofing
    const formData = buildStageFormData(data);
    formData.append('_method', 'PUT');

    return requestJson(`/api/stages/${id}`, {
        method: 'POST',
        body: formData,
    });
}

export async function deleteStage(id) {
    return requestJson(`/api/stages/${id}`, {
        method: 'DELETE',
    });
}