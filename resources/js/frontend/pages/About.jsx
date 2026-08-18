import { Suspense, lazy } from 'react';

import SectionSkeleton from '../components/SectionSkeleton.jsx';

const AboutHeroSection = lazy(() => import('../components/AboutHeroSection.jsx'));
const Features = lazy(() => import('../components/Features.jsx'));
const TimelessAboutSection = lazy(() => import('../components/TimelessAboutSection.jsx'));
const OurStory = lazy(() => import('../components/OurStory.jsx'));
const OurMission = lazy(() => import('../components/OurMission.jsx'));
const TestimonialSection = lazy(() => import('../components/TestimonialSection.jsx'));
const PersonalizationSection = lazy(() => import('../components/PersonalizerAboutPage.jsx'));


function LazySection({ children, heightClass }) {
    return <Suspense fallback={<SectionSkeleton heightClass={heightClass} />}>{children}</Suspense>;
}
export default function AboutPage() {
    return (
        <div className="bg-white">
            <LazySection heightClass="h-[520px]">
                <AboutHeroSection />
            </LazySection>
           
            <LazySection heightClass="h-[520px]">
                <TimelessAboutSection />
            </LazySection>
            <LazySection heightClass="h-[520px]">
                <OurStory />
            </LazySection>

            
            <LazySection heightClass="h-[520px]">
                <PersonalizationSection />
            </LazySection>
            <LazySection heightClass="h-[540px]">
                <OurMission />
            </LazySection>
           
           
          
        </div>
    );
}