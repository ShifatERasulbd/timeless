import { useState } from 'react';

import { accountApi } from '../../api/accountApi';
import { Alert, FormField, PanelHeading, PrimaryButton } from '../../components/account/ui.jsx';
import useAuth, { setAuthUser } from '../../hooks/useAuth';

function useFormState(initial) {
    const [form, setForm] = useState(initial);
    const [fieldErrors, setFieldErrors] = useState({});

    function field(name, extra = {}) {
        return {
            name,
            value: form[name] ?? '',
            error: fieldErrors[name],
            size: 'md',
            onChange: (event) => {
                setForm((previous) => ({ ...previous, [name]: event.target.value }));
                setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
            },
            ...extra,
        };
    }

    return { form, setForm, fieldErrors, setFieldErrors, field };
}

function ProfileForm({ user }) {
    const isCorporate = user.account_type === 'corporate';
    const { form, setForm, fieldErrors, setFieldErrors, field } = useFormState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        company_name: user.company_name || '',
        tax_id: user.tax_id || '',
        company_address: user.company_address || '',
        phone: user.phone || '',
        email: user.email || '',
        current_password: '',
    });
    const [message, setMessage] = useState({ tone: 'success', text: '' });
    const [isSaving, setIsSaving] = useState(false);
    const emailChanged = form.email.trim().toLowerCase() !== (user.email || '').toLowerCase();

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSaving) return;

        setIsSaving(true);
        setMessage({ tone: 'success', text: '' });
        setFieldErrors({});

        const fields = isCorporate
            ? ['company_name', 'tax_id', 'company_address', 'phone', 'first_name', 'last_name', 'email']
            : ['first_name', 'last_name', 'phone', 'email'];
        const payload = Object.fromEntries(fields.map((name) => [name, form[name]]));
        if (emailChanged) payload.current_password = form.current_password;

        try {
            const response = await accountApi.updateProfile(payload);
            setAuthUser(response.user);
            setForm((previous) => ({ ...previous, current_password: '' }));
            setMessage({ tone: 'success', text: response.message });
        } catch (error) {
            setFieldErrors(error.fieldErrors || {});
            setMessage({
                tone: 'error',
                text: error.status === 422 ? 'Please check the highlighted fields.' : error.message,
            });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <h3 className="font-serif text-[1.3rem] uppercase tracking-[0.02em] text-zinc-900">
                {isCorporate ? 'Company details' : 'Personal details'}
            </h3>

            {message.text ? <Alert tone={message.tone}>{message.text}</Alert> : null}

            {isCorporate ? (
                <>
                    <FormField label="Company name" required autoComplete="organization" {...field('company_name')} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Tax ID / Registration number" required {...field('tax_id')} />
                        <FormField label="Company phone" required type="tel" autoComplete="tel" {...field('phone')} />
                    </div>
                    <FormField label="Company address" required as="textarea" rows={3} {...field('company_address')} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Contact first name" autoComplete="given-name" {...field('first_name')} />
                        <FormField label="Contact last name" autoComplete="family-name" {...field('last_name')} />
                    </div>
                </>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="First name" required autoComplete="given-name" {...field('first_name')} />
                        <FormField label="Last name" required autoComplete="family-name" {...field('last_name')} />
                    </div>
                    <FormField label="Phone (optional)" type="tel" autoComplete="tel" {...field('phone')} />
                </>
            )}

            <FormField
                label={isCorporate ? 'Company email' : 'Email address'}
                required
                type="email"
                autoComplete="email"
                hint="This is the email you log in with."
                {...field('email')}
            />

            {emailChanged ? (
                <FormField
                    label="Current password"
                    required
                    type="password"
                    autoComplete="current-password"
                    hint="Confirm your password to change your email address."
                    {...field('current_password')}
                />
            ) : null}

            <PrimaryButton isLoading={isSaving} loadingText="Saving…">
                Save changes
            </PrimaryButton>
        </form>
    );
}

function PasswordForm() {
    const emptyPasswords = { current_password: '', password: '', password_confirmation: '' };
    const { form, setForm, setFieldErrors, field } = useFormState(emptyPasswords);
    const [message, setMessage] = useState({ tone: 'success', text: '' });
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSaving) return;

        if (form.password !== form.password_confirmation) {
            setFieldErrors({ password_confirmation: 'The passwords do not match.' });
            return;
        }

        setIsSaving(true);
        setMessage({ tone: 'success', text: '' });
        setFieldErrors({});

        try {
            const response = await accountApi.updatePassword(form);
            setForm(emptyPasswords);
            setMessage({ tone: 'success', text: response.message });
        } catch (error) {
            setFieldErrors(error.fieldErrors || {});
            setMessage({ tone: 'error', text: error.status === 422 ? '' : error.message });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <h3 className="font-serif text-[1.3rem] uppercase tracking-[0.02em] text-zinc-900">Change password</h3>

            {message.text ? <Alert tone={message.tone}>{message.text}</Alert> : null}

            <FormField label="Current password" required type="password" autoComplete="current-password" {...field('current_password')} />
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label="New password"
                    required
                    type="password"
                    autoComplete="new-password"
                    hint="At least 8 characters."
                    {...field('password')}
                />
                <FormField
                    label="Confirm new password"
                    required
                    type="password"
                    autoComplete="new-password"
                    {...field('password_confirmation')}
                />
            </div>

            <PrimaryButton isLoading={isSaving} loadingText="Updating…">
                Update password
            </PrimaryButton>
        </form>
    );
}

export default function AccountDetails() {
    const { user } = useAuth();

    return (
        <div className="space-y-8">
            <PanelHeading title="Account details" description="Update your contact information and password." />
            <ProfileForm user={user} />
            <div className="border-t border-zinc-200 pt-8">
                <PasswordForm />
            </div>
        </div>
    );
}
