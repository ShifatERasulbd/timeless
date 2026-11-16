import { Suspense, lazy, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

import SectionSkeleton from '../components/SectionSkeleton.jsx';
import { safeRedirectPath } from '../../utils/redirect';
import useAuth from '../hooks/useAuth';

const AuthUserTypeTabs = lazy(() => import('../components/AuthUserTypeTabs.jsx'));
const AuthLoginForm = lazy(() => import('../components/AuthLoginForm.jsx'));
const AuthRegisterForm = lazy(() => import('../components/AuthRegisterForm.jsx'));

const authShowcaseImage = '/uploads/heroes/images/hero1.webp';

export default function AuthPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const isRegister = location.pathname.toLowerCase() === '/register';
    const [userType, setUserType] = useState(() => (searchParams.get('type') === 'corporate' ? 'corporate' : 'normal'));
    const isCorporate = userType === 'corporate';
    const swapSides = isCorporate;

    // Already signed in (e.g. returning to /login): go straight to the account (or the requested page).
    if (isAuthenticated) {
        return <Navigate to={safeRedirectPath(searchParams.get('redirect'))} replace />;
    }

    return (
        <section className="bg-[#f5f5f3] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="mx-auto grid w-full max-w-[1500px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
                <div
                    className={`mx-auto w-full max-w-[620px] transition-all duration-500 ease-out lg:will-change-transform ${
                        swapSides ? 'lg:order-2 lg:translate-x-8' : 'lg:order-1 lg:translate-x-0'
                    }`}
                >
                    <h1 className="font-serif text-[2.3rem] uppercase tracking-[0.02em] text-zinc-900 sm:text-[2.8rem]">
                        {isRegister ? 'Create Account' : 'Login'}
                    </h1>

                    <Suspense fallback={<SectionSkeleton heightClass="h-[80px]" className="px-0 py-2" />}>
                        <AuthUserTypeTabs userType={userType} onChangeUserType={setUserType} />
                    </Suspense>

                    <Suspense fallback={<SectionSkeleton heightClass="h-[540px]" className="px-0 py-2" />}>
                        {/* Keyed by tab so switching account type starts with a clean form. */}
                        {isRegister ? (
                            <AuthRegisterForm key={userType} userType={userType} />
                        ) : (
                            <AuthLoginForm key={userType} userType={userType} />
                        )}
                    </Suspense>
                </div>

                <div
                    className={`mx-auto w-full max-w-[780px] border-[16px] border-zinc-200 bg-zinc-200 transition-all duration-500 ease-out lg:will-change-transform ${
                        swapSides ? 'lg:order-1 lg:-translate-x-6' : 'lg:order-2 lg:translate-x-0'
                    }`}
                >
                    <img
                        src={authShowcaseImage}
                        alt="Timeless apparel showcase"
                        className="h-[300px] w-full object-cover object-center sm:h-[420px] lg:h-[560px]"
                    />
                </div>
            </div>
        </section>
    );
}
