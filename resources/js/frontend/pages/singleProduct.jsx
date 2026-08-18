import { Suspense, lazy } from 'react';

import SectionSkeleton from '../components/SectionSkeleton.jsx';

const SingleProductMainSection = lazy(() => import('../components/SingleProductMainSection.jsx'));
const SingleProductInfoTabs = lazy(() => import('../components/SingleProductInfoTabs.jsx'));
const RelatedProductsSection = lazy(() => import('../components/RelatedProductsSection.jsx'));


function LazySection({ children, heightClass }) {
    return <Suspense fallback={<SectionSkeleton heightClass={heightClass} />}>{children}</Suspense>;
}

export default function SingleProductPage() {
    return (
        <div className="bg-white">
            <LazySection heightClass="h-[760px]">
                <SingleProductMainSection />
            </LazySection>
            <LazySection heightClass="h-[320px]">
                <SingleProductInfoTabs />
            </LazySection>
            <LazySection heightClass="h-[640px]">
                <RelatedProductsSection />
            </LazySection>
          
        </div>
    );
}
