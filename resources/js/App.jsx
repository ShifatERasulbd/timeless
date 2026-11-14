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
                    <Route path="shop" element={withPageFallback(ShopPage)} />
                    <Route path="singleProduct" element={withPageFallback(SingleProductPage)} />
                    <Route path="singleProduct/:productSlug" element={withPageFallback(SingleProductPage)} />
                    <Route path="cart" element={withPageFallback(CartPage)} />
                    <Route path="checkout" element={withPageFallback(CheckoutPage)} />
                    <Route path="order-confirmation" element={withPageFallback(OrderConfirmationPage)} />
                    <Route path="about" element={withPageFallback(AboutPage)} />
                    <Route path="contact" element={withPageFallback(ContactPage)} />
                    <Route path="login" element={withPageFallback(AuthPage)} />
                    <Route path="register" element={withPageFallback(AuthPage)} />
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