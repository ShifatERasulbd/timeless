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
        const message = payload?.message || 'Request failed';
        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}

function buildFeatureFormData(data = {}, asUpdate = false) {
    const formData = new FormData();

    formData.append('title', data.title || '');
    formData.append('description', data.description || '');
    formData.append('sort_order', String(data.sort_order ?? 0));

    if (data.icon instanceof File) {
        formData.append('icon', data.icon);
    }


    if (asUpdate) {
        formData.append('_method', 'PUT');
    }

    return formData;
}
// Features API All entries
export async function fetchFeatures(){
    const payload =await requestJson('/api/features');
    return Array.isArray(payload) ? payload : [];
}

export async function  fetchFeature(id){
    return await requestJson(`/api/features/${id}`);
}

export async function createFeature(data){
    await ensureCsrfCookie();
    return requestJson('/api/features',{
        method: 'POST',
        body: buildFeatureFormData(data)
    });
}

export async function updateFeature(id,data){
    await ensureCsrfCookie();
    return requestJson(`/api/features/${id}`,{
        method: 'POST',
        body: buildFeatureFormData(data, true)
    });
}

export async function deleteFeature(id){
    await ensureCsrfCookie();
    return requestJson(`/api/features/${id}`,{
        method: 'DELETE'
    });
}

