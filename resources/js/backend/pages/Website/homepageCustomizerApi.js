async function ensureCsrfCookie() {
    await fetch('/sanctum/csrf-cookie', {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });
}
 
function getXsrfToken() {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
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
 
    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || 'Request failed.');
    }
 
    if (response.status === 204) {
        return null;
    }
 
    return response.json();
}
 
export async function fetchHomepageCustomizer() {
    return requestJson('/api/customize-home-page');
}
 
export async function updateHomepageCustomizer(data = {}) {
    await ensureCsrfCookie();
 
    // The controller reads this as a multipart update, and PHP only
    // populates $_FILES for POST bodies, so PUT is spoofed via _method.
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('title', data.title || '');
    formData.append('description', data.description || '');
    if (data.image instanceof File) {
        formData.append('image', data.image);
    }
 
    return requestJson('/api/customize-home-page', {
        method: 'POST',
        headers: {
            'X-XSRF-TOKEN': getXsrfToken() || '',
        },
        body: formData,
    });
}
 
export async function deleteHomepageImage() {
    await ensureCsrfCookie();
 
    return requestJson('/api/customize-home-page/image', {
        method: 'DELETE',
        headers: {
            'X-XSRF-TOKEN': getXsrfToken() || '',
        },
    });
}
 