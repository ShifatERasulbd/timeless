import { requestJson } from '@/lib/apiClient';

export async function fetchOrders() {
    const payload = await requestJson('/api/orders');
    return Array.isArray(payload) ? payload : [];
}

export async function fetchOrder(id) {
    return requestJson(`/api/orders/${id}`);
}

/** Accepts any subset of the order fields, e.g. `{ status: 'shipped' }` for a status-only change. */
export async function updateOrder(id, data) {
    const payload = await requestJson(`/api/orders/${id}`, {
        method: 'PUT',
        needsCsrf: true,
        body: JSON.stringify(data),
    });

    return payload?.data;
}
