import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { accountApi } from '../api/accountApi';
import { Alert, FormField, PrimaryButton } from '../components/account/ui.jsx';
import { AuthCard } from './ForgotPasswordPage.jsx';

export default function ResetPasswordPage() {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({
        email: searchParams.get('email') || '',
        password: '',
        password_confirmation: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
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

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSubmitting) return;

        if (form.password !== form.password_confirmation) {
            setFieldErrors({ password_confirmation: 'The passwords do not match.' });
            return;
        }

        setIsSubmitting(true);
        setFieldErrors({});
        setErrorMessage('');

        try {
            const response = await accountApi.resetPassword({ ...form, token });
            setSuccessMessage(response.message);
        } catch (error) {
            const { email, ...rest } = error.fieldErrors || {};
            setFieldErrors(rest);
            // Token problems come back on `email` ("This password reset token is invalid.").
            setErrorMessage(email || (Object.keys(rest).length ? '' : error.message));
        } finally {
            setIsSubmitting(false);
        }
    }

    if (successMessage) {
        return (
            <AuthCard title="Password updated">
                <Alert tone="success">{successMessage}</Alert>
                <Link
                    to="/login"
                    className="mt-6 inline-flex h-12 w-full items-center justify-center bg-black px-6 text-[0.9rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-zinc-800"
                >
                    Log in
                </Link>
            </AuthCard>
        );
    }

    return (
        <AuthCard title="Choose a new password" description="Your new password must be at least 8 characters long.">
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <Alert>
                    {errorMessage ? (
                        <>
                            {errorMessage}{' '}
                            <Link to="/forgot-password" className="font-semibold underline underline-offset-2">
                                Request a new link
                            </Link>
                        </>
                    ) : null}
                </Alert>

                <FormField label="Email" type="email" autoComplete="email" required {...field('email')} />
                <FormField label="New password" type="password" autoComplete="new-password" required {...field('password')} />
                <FormField
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    required
                    {...field('password_confirmation')}
                />

                <PrimaryButton isLoading={isSubmitting} loadingText="Saving…" className="w-full">
                    Reset password
                </PrimaryButton>
            </form>
        </AuthCard>
    );
}
