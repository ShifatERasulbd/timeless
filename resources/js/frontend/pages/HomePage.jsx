import { Suspense, lazy } from 'react';

import SectionSkeleton from '../components/SectionSkeleton.jsx';

const Hero = lazy(() => import('../components/Hero.jsx'));
const Features = lazy(() => import('../components/Features.jsx'));
const ShopByEvent = lazy(() => import('../components/ShopByEvent.jsx'));
const Customizer = lazy(() => import('../components/Customizer.jsx'));
const HowWeHelp = lazy(() => import('../components/HowWeHelp.jsx'));
const ShopByProduct = lazy(() => import('../components/ShopByProduct.jsx'));

export const homePageSections = [
    { id: 'hero', name: 'Hero', heightClass: 'h-[520px]', Component: Hero },
    { id: 'features', name: 'Features', heightClass: 'h-[300px]', Component: Features },
    { id: 'shop-by-event', name: 'Shop By Event', heightClass: 'h-[420px]', Component: ShopByEvent },
    { id: 'how-we-help', name: 'How We Help', heightClass: 'h-[420px]', Component: HowWeHelp },
    { id: 'shop-by-product', name: 'Shop By Product', heightClass: 'h-[420px]', Component: ShopByProduct },
    { id: 'customizer', name: 'Customizer', heightClass: 'h-[520px]', Component: Customizer },
];

function LazySection({ children, heightClass }) {
    return <Suspense fallback={<SectionSkeleton heightClass={heightClass} />}>{children}</Suspense>;
}

export default function HomePage() {
    return (
        <>
            {homePageSections.map(({ id, heightClass, Component }) => (
                <LazySection key={id} heightClass={heightClass}>
                    <Component />
                </LazySection>
            ))}
            
        </>
    );
}