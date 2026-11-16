import { Suspense, lazy, useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import SectionSkeleton from '../components/SectionSkeleton.jsx';

const SingleProductMainSection = lazy(() => import('../components/SingleProductMainSection.jsx'));
const SingleProductInfoTabs = lazy(() => import('../components/SingleProductInfoTabs.jsx'));
const ProductCustomizerSection = lazy(() => import('../components/ProductCustomizerSection.jsx'));
const RelatedProductsSection = lazy(() => import('../components/RelatedProductsSection.jsx'));

// Matches CUSTOMIZER_SECTION_ID in ProductCustomizerSection (not imported, so the customizer
// chunk stays out of this page's bundle until it's needed).
const CUSTOMIZER_SECTION_ID = 'customize';

function LazySection({ children, heightClass }) {
    return <Suspense fallback={<SectionSkeleton heightClass={heightClass} />}>{children}</Suspense>;
}

export default function SingleProductPage() {
    const { productSlug } = useParams();
    const { hash } = useLocation();

    // The customizer is only loaded after "Start Personalizing" is clicked, or when returning
    // from "Edit design" (…#customize). Tracked per slug so it closes again on another product.
    const [customizerSlug, setCustomizerSlug] = useState(() =>
        hash === `#${CUSTOMIZER_SECTION_ID}` ? productSlug : null,
    );
    const isCustomizerOpen = customizerSlug === productSlug;

    const startPersonalizing = useCallback(() => {
        if (isCustomizerOpen) {
            document
                .getElementById(CUSTOMIZER_SECTION_ID)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        setCustomizerSlug(productSlug);
    }, [isCustomizerOpen, productSlug]);

    return (
        <div className="bg-white">
            <LazySection heightClass="h-[760px]">
                <SingleProductMainSection onStartPersonalizing={startPersonalizing} />
            </LazySection>
            <LazySection heightClass="h-[320px]">
                <SingleProductInfoTabs />
            </LazySection>
            {isCustomizerOpen ? (
                <LazySection heightClass="h-[720px]">
                    <ProductCustomizerSection />
                </LazySection>
            ) : null}
            <LazySection heightClass="h-[640px]">
                <RelatedProductsSection />
            </LazySection>
        </div>
    );
}
