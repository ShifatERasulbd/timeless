import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { accountApi } from '../api/accountApi';
import { setAuthUser } from '../hooks/useAuth';
import { safeRedirectPath } from '../../utils/redirect';
import { Alert, FormField, PrimaryButton } from './account/ui.jsx';

export default function AuthLoginForm({ userType }) {
    const isCorporate = userType === 'corporate';
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({ email: '', password: '', remember: false });
    const [fieldErrors, setFieldErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    function update(field) {
        return (event) => {
            const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
            setForm((previous) => ({ ...previous, [field]: value }));
            setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
        };
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setErrorMessage('');
        setFieldErrors({});

        try {
            const response = await accountApi.login({ ...form, account_type: userType });
            setAuthUser(response.user);
            navigate(safeRedirectPath(searchParams.get('redirect')), { replace: true });
        } catch (error) {
            if (error.status === 422 && error.fieldErrors) {
                // Show credential errors in the banner; keep field-level hints for format problems.
                const { email, ...rest } = error.fieldErrors;
                setFieldErrors(rest);
                setErrorMessage(email || '');
                if (!email && !Object.keys(rest).length) setErrorMessage(error.message);
            } else {
                setErrorMessage(error.message);
            }
            setIsSubmitting(false);
        }
    }

    return (
        <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
            <Alert>{errorMessage}</Alert>

            <FormField
                label={isCorporate ? 'Company email address' : 'Email'}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Example@email.com"
                value={form.email}
                onChange={update('email')}
                error={fieldErrors.email}
                required
            />

            <FormField
                label={isCorporate ? 'Company password' : 'Password'}
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder={isCorporate ? 'At least 8 characters' : 'Your Password'}
                value={form.password}
                onChange={update('password')}
                error={fieldErrors.password}
                required
            />

            <label className="inline-flex cursor-pointer items-center gap-2 text-[0.95rem] text-zinc-700">
                <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={update('remember')}
                    className="size-4 border-zinc-300 accent-black"
                />
                <span>Remember me</span>
            </label>

            <PrimaryButton isLoading={isSubmitting} loadingText="Logging in…" className="w-full">
                Log In
            </PrimaryButton>

            <p className="pt-3 text-center text-[0.95rem]">
                <Link to="/forgot-password" className="text-slate-500 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline">
                    Lost your password?
                </Link>
            </p>

            <div className="border-t border-zinc-200 pt-5 text-center">
                <p className="text-[0.95rem] text-slate-500">Don&apos;t have an account?</p>
                <Link
                    to={`/register${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect'))}` : ''}`}
                    className="mt-4 inline-flex h-12 items-center justify-center border border-zinc-500 px-8 text-[0.95rem] font-semibold uppercase tracking-[0.06em] text-zinc-800 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                >
                    Create Account
                </Link>
            </div>
        </form>
    );
}
