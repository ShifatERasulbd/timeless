import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useId, useState } from 'react';

// Shared building blocks for the login/register forms and the customer account pages.

const inputBase =
    'w-full border bg-[#ebeff4] px-4 text-zinc-900 outline-none transition-colors placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60';

export function FormField({
    label,
    required = false,
    error,
    hint,
    size = 'lg',
    as = 'input',
    type = 'text',
    className = '',
    ...inputProps
}) {
    const generatedId = useId();
    const id = inputProps.id || generatedId;
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === 'password';
    const sizeClass = as === 'textarea' ? 'py-3 text-[1rem]' : size === 'lg' ? 'h-14 text-[1.05rem]' : 'h-12 text-[0.98rem]';
    const borderClass = error ? 'border-red-500 focus:border-red-600' : 'border-zinc-200 focus:border-zinc-900';
    const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined;
    const Element = as;

    return (
        <div className={className}>
            {label ? (
                <label htmlFor={id} className="text-[0.96rem] font-semibold text-zinc-900">
                    {label} {required ? <span className="text-red-500">*</span> : null}
                </label>
            ) : null}
            <div className="relative mt-2">
                <Element
                    id={id}
                    type={as === 'input' ? (isPassword && revealed ? 'text' : type) : undefined}
                    required={required}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={describedBy}
                    className={`${inputBase} ${sizeClass} ${borderClass} ${isPassword ? 'pr-12' : ''}`}
                    {...inputProps}
                />
                {isPassword ? (
                    <button
                        type="button"
                        onClick={() => setRevealed((value) => !value)}
                        aria-label={revealed ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition-colors hover:text-zinc-900"
                    >
                        {revealed ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                    </button>
                ) : null}
            </div>
            {hint && !error ? (
                <p id={`${id}-hint`} className="mt-1.5 text-[0.82rem] text-slate-500">{hint}</p>
            ) : null}
            {error ? (
                <p id={`${id}-error`} className="mt-1.5 text-[0.85rem] text-red-600">{error}</p>
            ) : null}
        </div>
    );
}

export function Alert({ tone = 'error', children }) {
    if (!children) return null;

    const isError = tone === 'error';
    const Icon = isError ? AlertCircle : CheckCircle2;

    return (
        <div
            role={isError ? 'alert' : 'status'}
            className={`flex items-start gap-2.5 border px-4 py-3 text-[0.92rem] ${
                isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
        >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <div>{children}</div>
        </div>
    );
}

export function PrimaryButton({ isLoading = false, loadingText, children, className = '', ...props }) {
    return (
        <button
            type="submit"
            disabled={isLoading || props.disabled}
            className={`inline-flex h-12 items-center justify-center gap-2 bg-black px-6 text-[0.9rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
            {...props}
        >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            {isLoading && loadingText ? loadingText : children}
        </button>
    );
}

export function SecondaryButton({ children, className = '', ...props }) {
    return (
        <button
            type="button"
            className={`inline-flex h-11 items-center justify-center gap-2 border border-zinc-400 px-5 text-[0.82rem] font-semibold uppercase tracking-[0.08em] text-zinc-800 transition-colors hover:border-zinc-900 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

const statusStyles = {
    pending: 'bg-amber-50 text-amber-800 ring-amber-200',
    processing: 'bg-sky-50 text-sky-800 ring-sky-200',
    shipped: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
    delivered: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    cancelled: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
    confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
};

export function StatusBadge({ status }) {
    const key = String(status || 'pending').toLowerCase();

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] ring-1 ring-inset ${
                statusStyles[key] || statusStyles.pending
            }`}
        >
            {key}
        </span>
    );
}

export function money(value) {
    return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value, withTime = false) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    });
}

export function formatAddressLines(address) {
    if (!address) return [];

    return [
        [address.first_name, address.last_name].filter(Boolean).join(' '),
        address.company_name,
        [address.street_address, address.apartment].filter(Boolean).join(', '),
        [address.city, address.state, address.zip].filter(Boolean).join(', '),
        address.country,
        address.phone,
    ].filter(Boolean);
}

export function PanelHeading({ title, description, action }) {
    return (
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 className="font-serif text-[1.7rem] uppercase tracking-[0.02em] text-zinc-900">{title}</h2>
                {description ? <p className="mt-1 text-[0.95rem] text-slate-500">{description}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}

export function PanelSkeleton({ rows = 3 }) {
    return (
        <div className="animate-pulse space-y-4" aria-hidden="true">
            <div className="h-9 w-48 bg-zinc-200" />
            {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="h-24 bg-zinc-200/70" />
            ))}
        </div>
    );
}
