import { Suspense, lazy } from 'react';

import SectionSkeleton from '../components/SectionSkeleton.jsx';

const ContactHeroSection = lazy(() => import('../components/ContactHeroSection.jsx'));
const Features = lazy(() => import('../components/Features.jsx'));
const ContactSection = lazy(() => import('../components/ContactSection.jsx'));
const ContactLocationMapSection = lazy(() => import('../components/ContactLocationMapSection.jsx'));


function LazySection({ children, heightClass, className }) {
    return <Suspense fallback={<SectionSkeleton heightClass={heightClass} className={className} />}>{children}</Suspense>;
}

export default function ContactPage() {
    return (
        <>
            <LazySection heightClass="h-[520px]">
                <ContactHeroSection />
            </LazySection>
            <LazySection heightClass="h-[300px]">
                <Features />
            </LazySection>
            <LazySection heightClass="h-[760px]">
                <ContactSection />
            </LazySection>
            <LazySection heightClass="h-[520px]" className="px-0">
                <ContactLocationMapSection />
            </LazySection>
          
        </>
    );
}