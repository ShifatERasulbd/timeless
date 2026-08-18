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

function buildHeroFormData(data = {}, asUpdate = false) {
    const formData = new FormData();

    formData.append('title', data.title || '');
    formData.append('description', data.description || '');
    formData.append('title_font_size', data.title_font_size || '');
    formData.append('title_font_family', data.title_font_family || '');
    formData.append('description_font_size', data.description_font_size || '');
    formData.append('description_font_family', data.description_font_family || '');
    formData.append('ticker_text', data.ticker_text || '');
    formData.append('sub_title', data.sub_title || '');
    formData.append('button_text', data.button_text || '');

    if (typeof data.button_enabled === 'boolean') {
        formData.append('button_enabled', data.button_enabled ? '1' : '0');
    }

    if (data.image instanceof File) {
        formData.append('image', data.image);
    }

    if (data.video instanceof File) {
        formData.append('video', data.video);
    }

    if (Array.isArray(data.existingSlides)) {
        data.existingSlides.forEach((slide, index) => {
            if (slide?.id) {
                formData.append('existing_slide_ids[]', String(slide.id));
                formData.append(`existing_slide_orders[${slide.id}]`, String(index + 1));
            }
        });
    }

    if (Array.isArray(data.newSlides)) {
        data.newSlides.forEach((slide, index) => {
            if (slide?.file instanceof File) {
                formData.append('slides[]', slide.file);
                formData.append('slide_orders[]', String(slide.sort_order || index + 1));
            }
        });
    }

    if (asUpdate) {
        formData.append('_method', 'PUT');
    }

    return formData;
}

export async function fetchHeroes() {
    const payload = await requestJson('/api/heroes');
    return Array.isArray(payload) ? payload : [];
}

export async function fetchHero(id) {
    return requestJson(`/api/heroes/${id}`);
}

export async function createHero(data) {
    await ensureCsrfCookie();

    return requestJson('/api/heroes', {
        method: 'POST',
        body: buildHeroFormData(data),
    });
}

export async function updateHero(id, data) {
    await ensureCsrfCookie();

    return requestJson(`/api/heroes/${id}`, {
        method: 'POST',
        body: buildHeroFormData(data, true),
    });
}

export async function deleteHero(id) {

    
    await ensureCsrfCookie();

    return requestJson(`/api/heroes/${id}`, {
        method: 'DELETE',
    });
}
