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

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(payload?.message || 'Request failed.');
    }

    return payload;
}

export async function fetchAboutPageSections() {
    return requestJson('/api/about-page');
}

export async function updateAboutPageSection(sectionKey, data = {}) {
    await ensureCsrfCookie();

    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('title', data.title || '');
    formData.append('description', data.description || '');

    if (data.image instanceof File) {
        formData.append('image', data.image);
    }

    return requestJson(`/api/about-page/${sectionKey}`, {
        method: 'POST',
        body: formData,
    });
}

export async function deleteAboutPageSectionImage(sectionKey) {
    await ensureCsrfCookie();

    return requestJson(`/api/about-page/${sectionKey}/image`, {
        method: 'DELETE',
    });
}

export async function deleteAboutPageSection(sectionKey) {
    await ensureCsrfCookie();

    return requestJson(`/api/about-page/${sectionKey}`, {
        method: 'DELETE',
    });
}