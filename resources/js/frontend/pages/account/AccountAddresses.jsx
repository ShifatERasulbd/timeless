import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { accountApi } from '../../api/accountApi';
import {
    Alert,
    FormField,
    formatAddressLines,
    PanelHeading,
    PanelSkeleton,
    PrimaryButton,
    SecondaryButton,
} from '../../components/account/ui.jsx';
import useAccountResource from '../../hooks/useAccountResource';
import useAuth from '../../hooks/useAuth';

const MAX_ADDRESSES = 20;

const emptyAddress = {
    label: '',
    first_name: '',
    last_name: '',
    company_name: '',
    phone: '',
    country: '',
    street_address: '',
    apartment: '',
    state: '',
    city: '',
    zip: '',
    is_default: false,
};

function AddressForm({ initial, isFirst, onCancel, onSaved }) {
    const [form, setForm] = useState(() => ({ ...emptyAddress, ...initial }));
    const [fieldErrors, setFieldErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const isEditing = Boolean(initial?.id);

    function field(name) {
        return {
            name,
            value: form[name] ?? '',
            error: fieldErrors[name],
            size: 'md',
            onChange: (event) => {
                setForm((previous) => ({ ...previous, [name]: event.target.value }));
                setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
            },
        };
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSaving) return;

        setIsSaving(true);
        setErrorMessage('');
        setFieldErrors({});

        const payload = Object.fromEntries(Object.keys(emptyAddress).map((key) => [key, form[key]]));

        try {
            const response = isEditing
                ? await accountApi.updateAddress(initial.id, payload)
                : await accountApi.createAddress(payload);
            onSaved(response.message);
        } catch (error) {
            setFieldErrors(error.fieldErrors || {});
            setErrorMessage(error.status === 422 && Object.keys(error.fieldErrors || {}).length
                ? 'Please check the highlighted fields.'
                : error.message);
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4 border border-zinc-200 bg-[#fafaf8] p-5 sm:p-6">
            <h3 className="font-serif text-[1.3rem] uppercase tracking-[0.02em] text-zinc-900">
                {isEditing ? 'Edit address' : 'Add a new address'}
            </h3>

            <Alert>{errorMessage}</Alert>

            <FormField label="Address label" placeholder="e.g. Home, Office, Warehouse" maxLength={50} {...field('label')} />

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="First name" required autoComplete="given-name" {...field('first_name')} />
                <FormField label="Last name" required autoComplete="family-name" {...field('last_name')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Company name (optional)" autoComplete="organization" {...field('company_name')} />
                <FormField label="Phone" required type="tel" autoComplete="tel" {...field('phone')} />
            </div>

            <FormField label="Country / Region" required autoComplete="country-name" {...field('country')} />
            <FormField
                label="Street address"
                required
                autoComplete="address-line1"
                placeholder="House number and street name"
                {...field('street_address')}
            />
            <FormField
                label="Apartment, suite, unit (optional)"
                autoComplete="address-line2"
                {...field('apartment')}
            />

            <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Town / City" required autoComplete="address-level2" {...field('city')} />
                <FormField label="State" required autoComplete="address-level1" {...field('state')} />
                <FormField label="ZIP Code" required autoComplete="postal-code" {...field('zip')} />
            </div>

            {!isFirst && !initial?.is_default ? (
                <label className="inline-flex cursor-pointer items-center gap-2 text-[0.95rem] text-zinc-700">
                    <input
                        type="checkbox"
                        checked={Boolean(form.is_default)}
                        onChange={(event) => setForm((previous) => ({ ...previous, is_default: event.target.checked }))}
                        className="size-4 accent-black"
                    />
                    Set as my default address
                </label>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
                <PrimaryButton isLoading={isSaving} loadingText="Saving…">
                    {isEditing ? 'Save changes' : 'Save address'}
                </PrimaryButton>
                <SecondaryButton onClick={onCancel} disabled={isSaving} className="h-12">
                    Cancel
                </SecondaryButton>
            </div>
        </form>
    );
}

export default function AccountAddresses() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: addresses, error, isLoading, reload } = useAccountResource(() => accountApi.addresses());
    const [editing, setEditing] = useState(null); // null | 'new' | address object
    const [pendingDelete, setPendingDelete] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [message, setMessage] = useState({ tone: 'success', text: '' });

    // /account/addresses?new=1 (from the dashboard) opens the add form straight away.
    useEffect(() => {
        if (searchParams.get('new') === '1') {
            setEditing('new');
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    function startNew() {
        setMessage({ tone: 'success', text: '' });
        setEditing('new');
    }

    async function handleSaved(text) {
        setEditing(null);
        setMessage({ tone: 'success', text });
        await reload();
    }

    async function runAction(id, action) {
        setBusyId(id);
        setMessage({ tone: 'success', text: '' });
        try {
            const response = await action();
            setMessage({ tone: 'success', text: response.message });
            await reload();
        } catch (actionError) {
            setMessage({ tone: 'error', text: actionError.message });
        } finally {
            setBusyId(null);
            setPendingDelete(null);
        }
    }

    if (isLoading && !addresses) return <PanelSkeleton rows={2} />;

    if (error && !addresses) {
        return (
            <div className="space-y-4">
                <Alert>{error.message}</Alert>
                <SecondaryButton onClick={reload}>Try again</SecondaryButton>
            </div>
        );
    }

    const list = addresses || [];
    const canAddMore = list.length < MAX_ADDRESSES;
    const newAddressDefaults = {
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        company_name: user?.account_type === 'corporate' ? user.company_name || '' : '',
        phone: user?.phone || '',
    };

    return (
        <div className="space-y-6">
            <PanelHeading
                title="Addresses"
                description="Saved addresses can be picked at checkout. Your default address is filled in automatically."
                action={
                    editing || !canAddMore ? null : (
                        <SecondaryButton onClick={startNew}>
                            <Plus className="size-4" /> Add address
                        </SecondaryButton>
                    )
                }
            />

            {message.text ? <Alert tone={message.tone}>{message.text}</Alert> : null}

            {editing ? (
                <AddressForm
                    key={editing === 'new' ? 'new' : editing.id}
                    initial={editing === 'new' ? newAddressDefaults : editing}
                    isFirst={list.length === 0}
                    onCancel={() => setEditing(null)}
                    onSaved={handleSaved}
                />
            ) : null}

            {!list.length && !editing ? (
                <div className="border border-dashed border-zinc-300 px-6 py-12 text-center">
                    <MapPin className="mx-auto size-7 text-zinc-400" strokeWidth={1.5} />
                    <p className="mt-3 text-slate-600">You haven&apos;t saved any addresses yet.</p>
                    <PrimaryButton type="button" onClick={startNew} className="mt-5">
                        <Plus className="size-4" /> Add your first address
                    </PrimaryButton>
                </div>
            ) : null}

            {list.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {list.map((address) => {
                        const isBusy = busyId === address.id;
                        return (
                            <div
                                key={address.id}
                                className={`flex flex-col border p-5 ${address.is_default ? 'border-zinc-900' : 'border-zinc-200'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-zinc-900">
                                        {address.label || 'Address'}
                                    </p>
                                    {address.is_default ? (
                                        <span className="inline-flex items-center gap-1 bg-zinc-900 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-white">
                                            <Star className="size-3" fill="currentColor" /> Default
                                        </span>
                                    ) : null}
                                </div>

                                <address className="mt-3 flex-1 space-y-0.5 text-[0.95rem] not-italic text-zinc-700">
                                    {formatAddressLines(address).map((line) => (
                                        <p key={line}>{line}</p>
                                    ))}
                                </address>

                                {pendingDelete === address.id ? (
                                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4">
                                        <span className="mr-auto text-[0.88rem] font-semibold text-zinc-900">Remove this address?</span>
                                        <button
                                            type="button"
                                            onClick={() => runAction(address.id, () => accountApi.deleteAddress(address.id))}
                                            disabled={isBusy}
                                            className="inline-flex h-9 items-center bg-red-600 px-3 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-white hover:bg-red-700 disabled:opacity-60"
                                        >
                                            {isBusy ? 'Removing…' : 'Remove'}
                                        </button>
                                        <SecondaryButton onClick={() => setPendingDelete(null)} disabled={isBusy} className="h-9 px-3">
                                            Keep
                                        </SecondaryButton>
                                    </div>
                                ) : (
                                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-zinc-200 pt-4 text-[0.8rem] font-semibold uppercase tracking-[0.08em]">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMessage({ tone: 'success', text: '' });
                                                setEditing(address);
                                            }}
                                            disabled={isBusy}
                                            className="inline-flex items-center gap-1.5 text-zinc-800 hover:text-zinc-950"
                                        >
                                            <Pencil className="size-3.5" /> Edit
                                        </button>
                                        {!address.is_default ? (
                                            <button
                                                type="button"
                                                onClick={() => runAction(address.id, () => accountApi.setDefaultAddress(address.id))}
                                                disabled={isBusy}
                                                className="inline-flex items-center gap-1.5 text-zinc-800 hover:text-zinc-950 disabled:opacity-60"
                                            >
                                                <Star className="size-3.5" /> {isBusy ? 'Saving…' : 'Make default'}
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => setPendingDelete(address.id)}
                                            disabled={isBusy}
                                            className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="size-3.5" /> Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : null}

            {!canAddMore ? (
                <p className="text-[0.88rem] text-slate-500">
                    You&apos;ve reached the limit of {MAX_ADDRESSES} saved addresses. Remove one to add another.
                </p>
            ) : null}
        </div>
    );
}
