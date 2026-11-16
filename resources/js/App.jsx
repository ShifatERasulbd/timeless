import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import PageSkeleton from './frontend/components/PageSkeleton.jsx';
import FrontendLayout from './frontend/layouts/FrontendLayout.jsx';

const HomePage = lazy(() => import('./frontend/pages/HomePage.jsx'));
const ShopPage = lazy(() => import('./frontend/pages/ShopPage.jsx'));
const SingleProductPage = lazy(() => import('./frontend/pages/singleProduct.jsx'));
const CartPage = lazy(() => import('./frontend/pages/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./frontend/pages/CheckoutPage.jsx'));
const OrderConfirmationPage = lazy(() => import('./frontend/pages/OrderConfirmationPage.jsx'));
const AboutPage = lazy(() => import('./frontend/pages/about.jsx'));
const ContactPage = lazy(() => import('./frontend/pages/contact.jsx'));
const AuthPage = lazy(() => import('./frontend/pages/Auth.jsx'));
const ForgotPasswordPage = lazy(() => import('./frontend/pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./frontend/pages/ResetPasswordPage.jsx'));

// Customer account (dashboard)
const AccountLayout = lazy(() => import('./frontend/pages/account/AccountLayout.jsx'));
const AccountDashboard = lazy(() => import('./frontend/pages/account/AccountDashboard.jsx'));
const AccountOrders = lazy(() => import('./frontend/pages/account/AccountOrders.jsx'));
const AccountOrderDetail = lazy(() => import('./frontend/pages/account/AccountOrderDetail.jsx'));
const AccountAddresses = lazy(() => import('./frontend/pages/account/AccountAddresses.jsx'));
const AccountDetails = lazy(() => import('./frontend/pages/account/AccountDetails.jsx'));
const AccountDesigns = lazy(() => import('./frontend/pages/account/AccountDesigns.jsx'));

function withPageFallback(Component) {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <Component />
        </Suspense>
    );
}

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<FrontendLayout />}>
                    <Route index element={withPageFallback(HomePage)} />
                    <Route path="shop/:categorySlug?/:subCategorySlug?/:grandChildSlug?" element={withPageFallback(ShopPage)} />
                    <Route path="singleProduct" element={withPageFallback(SingleProductPage)} />
                    <Route path="singleProduct/:productSlug" element={withPageFallback(SingleProductPage)} />
                    <Route path="cart" element={withPageFallback(CartPage)} />
                    <Route path="checkout" element={withPageFallback(CheckoutPage)} />
                    <Route path="order-confirmation" element={withPageFallback(OrderConfirmationPage)} />
                    <Route path="about" element={withPageFallback(AboutPage)} />
                    <Route path="contact" element={withPageFallback(ContactPage)} />
                    <Route path="login" element={withPageFallback(AuthPage)} />
                    <Route path="register" element={withPageFallback(AuthPage)} />
                    <Route path="forgot-password" element={withPageFallback(ForgotPasswordPage)} />
                    <Route path="reset-password/:token" element={withPageFallback(ResetPasswordPage)} />
                    <Route path="account" element={withPageFallback(AccountLayout)}>
                        {/* AccountLayout wraps its <Outlet /> in Suspense, so these need no fallback of their own. */}
                        <Route index element={<AccountDashboard />} />
                        <Route path="orders" element={<AccountOrders />} />
                        <Route path="orders/:orderNumber" element={<AccountOrderDetail />} />
                        <Route path="addresses" element={<AccountAddresses />} />
                        <Route path="designs" element={<AccountDesigns />} />
                        <Route path="details" element={<AccountDetails />} />
                        <Route path="*" element={<Navigate to="/account" replace />} />
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

const rootElement = document.getElementById('app');

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        React.createElement(
            React.StrictMode,
            null,
            React.createElement(AppRouter)
        )
    );
}