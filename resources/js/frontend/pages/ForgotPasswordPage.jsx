import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { accountApi } from '../api/accountApi';
import { Alert, FormField, PrimaryButton } from '../components/account/ui.jsx';

export function AuthCard({ title, description, children }) {
    return (
        <section className="bg-[#f5f5f3] px-5 py-14 sm:px-8 lg:py-20">
            <div className="mx-auto w-full max-w-[560px]">
                <h1 className="font-serif text-[2.1rem] uppercase tracking-[0.02em] text-zinc-900 sm:text-[2.5rem]">{title}</h1>
                {description ? <p className="mt-3 text-[1rem] leading-relaxed text-slate-500">{description}</p> : null}
                <div className="mt-8">{children}</div>
            </div>
        </section>
    );
}

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [fieldError, setFieldError] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setFieldError('');
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await accountApi.forgotPassword({ email });
            setSuccessMessage(response.message);
        } catch (error) {
            if (error.fieldErrors?.email) {
                setFieldError(error.fieldErrors.email);
            } else {
                setErrorMessage(error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthCard
            title="Lost your password?"
            description="Enter the email address you use for your account and we'll send you a link to choose a new password."
        >
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <Alert>{errorMessage}</Alert>
                <Alert tone="success">{successMessage}</Alert>

                <FormField
                    label="Email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Example@email.com"
                    value={email}
                    onChange={(event) => {
                        setEmail(event.target.value);
                        setFieldError('');
                    }}
                    error={fieldError}
                    required
                />

                <PrimaryButton isLoading={isSubmitting} loadingText="Sending…" className="w-full">
                    Send reset link
                </PrimaryButton>

                <p className="pt-3 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 text-[0.95rem] text-slate-500 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline"
                    >
                        <ArrowLeft className="size-4" /> Back to login
                    </Link>
                </p>
            </form>
        </AuthCard>
    );
}
