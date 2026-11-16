import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { accountApi } from '../api/accountApi';
import { setAuthUser } from '../hooks/useAuth';
import { safeRedirectPath } from '../../utils/redirect';
import { Alert, FormField, PrimaryButton } from './account/ui.jsx';

const emptyForm = {
    first_name: '',
    last_name: '',
    company_name: '',
    tax_id: '',
    company_address: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: '',
};

const normalFields = ['first_name', 'last_name', 'email', 'password', 'password_confirmation'];
const corporateFields = ['company_name', 'email', 'tax_id', 'company_address', 'phone', 'password', 'password_confirmation'];

export default function AuthRegisterForm({ userType }) {
    const isCorporate = userType === 'corporate';
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState(emptyForm);
    const [fieldErrors, setFieldErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    function field(name) {
        return {
            name,
            value: form[name],
            error: fieldErrors[name],
            onChange: (event) => {
                setForm((previous) => ({ ...previous, [name]: event.target.value }));
                setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
            },
        };
    }

    function validateLocally() {
        const errors = {};
        if (form.password && form.password.length < 8) {
            errors.password = 'The password must be at least 8 characters.';
        }
        if (form.password_confirmation && form.password !== form.password_confirmation) {
            errors.password_confirmation = 'The passwords do not match.';
        }
        return errors;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSubmitting) return;

        const localErrors = validateLocally();
        if (Object.keys(localErrors).length) {
            setFieldErrors(localErrors);
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');
        setFieldErrors({});

        const payload = Object.fromEntries(
            (isCorporate ? corporateFields : normalFields).map((name) => [name, form[name]])
        );

        try {
            const response = await accountApi.register({ ...payload, account_type: userType });
            setAuthUser(response.user);
            navigate(safeRedirectPath(searchParams.get('redirect')), { replace: true });
        } catch (error) {
            const errors = { ...(error.fieldErrors || {}) };
            // Laravel reports a confirmation mismatch on `password`; show it under the confirm box.
            if (errors.password && /confirmation/i.test(errors.password)) {
                errors.password_confirmation = 'The passwords do not match.';
                delete errors.password;
            }
            setFieldErrors(errors);
            setErrorMessage(
                error.status === 422 ? 'Please check the highlighted fields and try again.' : error.message
            );
            setIsSubmitting(false);
        }
    }

    return (
        <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
            <Alert>{errorMessage}</Alert>

            {isCorporate ? (
                <>
                    <FormField label="Company name" required autoComplete="organization" placeholder="Company name" {...field('company_name')} />
                    <FormField label="Company email" required type="email" autoComplete="email" placeholder="Example@email.com" {...field('email')} />
                    <FormField label="Tax ID / Registration number" required {...field('tax_id')} />
                    <FormField label="Company address" required as="textarea" rows={3} autoComplete="street-address" {...field('company_address')} />
                    <FormField label="Company phone" required type="tel" autoComplete="tel" {...field('phone')} />
                </>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="First name" required autoComplete="given-name" placeholder="First Name" {...field('first_name')} />
                        <FormField label="Last name" required autoComplete="family-name" placeholder="Last name" {...field('last_name')} />
                    </div>
                    <FormField label="Email address" required type="email" autoComplete="email" placeholder="Example@email.com" {...field('email')} />
                </>
            )}

            <FormField
                label="Password"
                required
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                {...field('password')}
            />

            <FormField
                label="Confirm password"
                required
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                {...field('password_confirmation')}
            />

            <PrimaryButton isLoading={isSubmitting} loadingText="Creating account…" className="w-full">
                Register
            </PrimaryButton>

            <div className="border-t border-zinc-200 pt-5 text-center">
                <p className="text-[0.95rem] text-slate-500">Already have an account?</p>
                <Link
                    to={`/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect'))}` : ''}`}
                    className="mt-4 inline-flex h-12 items-center justify-center border border-zinc-500 px-12 text-[0.95rem] font-semibold uppercase tracking-[0.06em] text-zinc-800 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                >
                    Login
                </Link>
            </div>
        </form>
    );
}
