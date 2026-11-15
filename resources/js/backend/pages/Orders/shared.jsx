import { cn } from '@/lib/utils';

// Must match Order::STATUSES on the server.
export const ORDER_STATUSES = [
    { value: 'pending', label: 'Pending', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    { value: 'processing', label: 'Processing', className: 'border-sky-200 bg-sky-50 text-sky-700' },
    { value: 'shipped', label: 'Shipped', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
    { value: 'delivered', label: 'Delivered', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { value: 'cancelled', label: 'Cancelled', className: 'border-zinc-200 bg-zinc-100 text-zinc-600' },
];

export const selectClass = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export const textareaClass = 'flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring';

export function StatusBadge({ status, className }) {
    const match = ORDER_STATUSES.find((option) => option.value === status);

    return (
        <span
            className={cn(
                'inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                match?.className || 'border-zinc-200 bg-zinc-50 text-zinc-600',
                className,
            )}
        >
            {match?.label || status || 'Unknown'}
        </span>
    );
}

export function formatCurrency(value) {
    const numberValue = Number(value || 0);
    return `$${(Number.isNaN(numberValue) ? 0 : numberValue).toFixed(2)}`;
}

export function formatDate(value) {
    if (!value) return '-';

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

export function customerName(order) {
    return [order?.first_name, order?.last_name].filter(Boolean).join(' ') || '-';
}

/** Colour, size and design for an order line, e.g. "Red · M · Design: Logo". */
export function variantSummary(item) {
    return [
        item.color,
        item.size,
        item.design ? `Design: ${item.design.title || 'Custom design'}` : null,
    ].filter(Boolean).join(' · ');
}

/** Laravel 422 validation errors as `{ field: firstMessage }`. */
export function firstFieldErrors(error) {
    const errors = error?.payload?.errors || {};
    return Object.fromEntries(Object.entries(errors).map(([key, messages]) => [key, messages?.[0]]));
}
