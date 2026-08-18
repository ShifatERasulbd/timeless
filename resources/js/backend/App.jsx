import React, { Suspense, lazy } from 'react'
import { LoginForm } from '@/components/login-form';
import { Toaster } from '@/components/ui/sonner';
import { AppProvider } from '@/context/AppContext';
import AppLayout from '@/layouts/AppLayout';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';

function lazyWithRetry(importer, key) {
    return lazy(async () => {
        const storageKey = `lazy-retry:${key}`;

        try {
            const module = await importer();
            sessionStorage.removeItem(storageKey);
            return module;
        } catch (error) {
            const hasRetried = sessionStorage.getItem(storageKey) === '1';

            if (!hasRetried && error instanceof TypeError) {
                sessionStorage.setItem(storageKey, '1');
                window.location.reload();
                return new Promise(() => {});
            }

            sessionStorage.removeItem(storageKey);
            throw error;
        }
    });
}

const Dashboard = lazyWithRetry(() => import('@/pages/dashboard'), 'dashboard');
// Hero Management
const Heroes    = lazyWithRetry(() => import('@/pages/Hero/hero'), 'hero');
const AddHero   = lazyWithRetry(() => import('@/pages/Hero/addHero'), 'add-hero');
const EditHero  = lazyWithRetry(() => import('@/pages/Hero/editHero'), 'edit-hero');

// Stage Management
const Stages = lazyWithRetry(() => import('@/pages/Stage/stage'), 'stages');
const AddStage = lazyWithRetry(() => import('@/pages/Stage/addStage'), 'add-stage');
const EditStage = lazyWithRetry(() => import('@/pages/Stage/editStage'), 'edit-stage');

// Personalization Management
const PersonalizerFeatures = lazyWithRetry(() => import('../personalizer/features'), 'personalizer-features');
const PersonalizerConfirmOrder = lazyWithRetry(() => import('../personalizer/confirm-order'), 'personalizer-confirm-order');
const PersonalizerMockupPreview = lazyWithRetry(() => import('../personalizer/mockup-preview'), 'personalizer-mockup-preview');
const PersonalizationOrders = lazyWithRetry(() => import('@/pages/Personalization/orders'), 'personalization-orders');
const ViewPersonalizationOrder = lazyWithRetry(() => import('@/pages/Personalization/viewOrder'), 'personalization-order-view');
const EditPersonalizationOrder = lazyWithRetry(() => import('@/pages/Personalization/editOrder'), 'personalization-order-edit');

// Color Management
const Colors = lazyWithRetry(() => import('@/pages/Color/color'), 'colors');
const AddColor = lazyWithRetry(() => import('@/pages/Color/addColor'), 'add-color');
const EditColor = lazyWithRetry(() => import('@/pages/Color/editColor'), 'edit-color');

// Size Management
const Sizes = lazyWithRetry(() => import('@/pages/Size/size'), 'sizes');
const AddSize = lazyWithRetry(() => import('@/pages/Size/addSize'), 'add-size');
const EditSize = lazyWithRetry(() => import('@/pages/Size/editSize'), 'edit-size');

// Features Management
const Features = lazyWithRetry(()=> import ('@/pages/Features/features'), 'features');
const AddFeature = lazyWithRetry(() => import('@/pages/Features/addFeature'), 'add-feature');
const EditFeature = lazyWithRetry(() => import('@/pages/Features/editFeature'), 'edit-feature');

// Category Management
const Categories = lazyWithRetry(() => import('@/pages/Category/category'), 'categories');
const AddCategory = lazyWithRetry(() => import('@/pages/Category/addCategory'), 'add-category');
const EditCategory = lazyWithRetry(() => import('@/pages/Category/editCategory'), 'edit-category');

// SubCategory Management
const SubCategories = lazyWithRetry(() => import('@/pages/SubCategory/subcategory'), 'sub-categories');
const AddSubCategory = lazyWithRetry(() => import('@/pages/SubCategory/addSubCategory'), 'add-sub-category');
const EditSubCategory = lazyWithRetry(() => import('@/pages/SubCategory/editSubCategory'), 'edit-sub-category');

// Website Builder
const HomePageBuilder = lazyWithRetry(() => import('@/pages/Website/homePageBuilder'), 'website-home-page-builder');
const AboutPageBuilder = lazyWithRetry(() => import('@/pages/Website/aboutPageBuilder'), 'website-about-page-builder');



// Product Management
const Products = lazyWithRetry(() => import('@/pages/Product/products'), 'products');
const AddProduct = lazyWithRetry(() => import('@/pages/Product/addProduct'), 'add-product');
const EditProduct = lazyWithRetry(() => import('@/pages/Product/editProduct'), 'edit-product');

function LegacyStageEditRedirect() {
    const { id } = useParams();
    return <Navigate to={`/admin/stages/${id}/edit`} replace />;
}


export default function App() {
    return (
        <AppProvider>
            <BrowserRouter>
                <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
                    <Routes>
                        <Route
                            path="/admin"
                            element={
                                <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
                                    <LoginForm />
                                </main>
                            }
                        />
                        {/* user Managemnent */}
                        <Route path="/admin" element={<AppLayout />}>
                            <Route path="dashboard" element={<Dashboard />} />
                            {/* Hero  */}
                            <Route path="hero" element={<Heroes />} />
                            <Route path="hero/add" element={<AddHero />} />
                            <Route path="hero/:id/edit" element={<EditHero />} />

                            {/* Personalization Orders */}
                            <Route path="personalization/orders" element={<PersonalizationOrders />} />
                            <Route path="personalization/orders/:id" element={<ViewPersonalizationOrder />} />
                            <Route path="personalization/orders/:id/edit" element={<EditPersonalizationOrder />} />

                            {/* Features Management */}
                            <Route path="features" element={<Features />} />
                            <Route path="features/add" element={<AddFeature />} />
                            <Route path="features/:id/edit" element={<EditFeature />} />

                            {/* Category Management */}
                            <Route path="category" element={<Categories />} />
                            <Route path="category/add" element={<AddCategory />} />
                            <Route path="category/:id/edit" element={<EditCategory />} />

                            {/* Color Management */}
                            <Route path="colors" element={<Colors />} />
                            <Route path="colors/add" element={<AddColor />} />
                            <Route path="colors/:id/edit" element={<EditColor />} />

                            {/* Size Management */}
                            <Route path="sizes" element={<Sizes />} />
                            <Route path="sizes/add" element={<AddSize />} />
                            <Route path="sizes/:id/edit" element={<EditSize />} />

                            {/* Stage Management */}
                            <Route path="stages" element={<Stages />} />
                            <Route path="stages/add" element={<AddStage />} />
                            <Route path="stages/:id/edit" element={<EditStage />} />
                            <Route path="stage" element={<Navigate to="/admin/stages" replace />} />
                            <Route path="stage/add" element={<Navigate to="/admin/stages/add" replace />} />
                            <Route path="stage/:id/edit" element={<LegacyStageEditRedirect />} />

                            {/* SubCategory Management */}
                            <Route path="sub-category" element={<SubCategories />} />
                            <Route path="sub-category/add" element={<AddSubCategory />} />
                            <Route path="sub-category/:id/edit" element={<EditSubCategory />} />

                            {/* Website Builder */}
                            <Route path="website/home-page" element={<HomePageBuilder />} />
                            <Route path="website/about-page" element={<AboutPageBuilder />} />


                            {/* Product Management */}
                            <Route path="products" element={<Products />} />
                            <Route path="products/add" element={<AddProduct />} />
                            <Route path="products/:id/edit" element={<EditProduct />} />

                           

                        </Route>

                        <Route path="/personalizer/features" element={<PersonalizerFeatures />} />
                        <Route path="/personalizer/confirm-order" element={<PersonalizerConfirmOrder />} />
                        <Route path="/personalizer/mockup-preview" element={<PersonalizerMockupPreview />} />
                        <Route path="/" element={<main />} />

                        {/* Hero Management */}
                       
                    </Routes>
                </Suspense>
            </BrowserRouter>
            <Toaster position="top-right" richColors />
        </AppProvider>
    );
}