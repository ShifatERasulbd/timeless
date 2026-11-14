import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Toaster } from 'sonner';

// The personalizer (fabric.js canvas) is large, so it's only downloaded when this section is
// about to scroll into view or the "Start Customizing" button jumps here.
const ProductCustomizer = lazy(() => import('../../personalizer/features.jsx'));

export const CUSTOMIZER_SECTION_ID = 'customize';

function CustomizerPlaceholder() {
    return (
        <div className="mx-auto flex h-[640px] max-w-[1600px] items-center justify-center px-4 lg:px-8">
            <p className="text-sm text-zinc-500">Loading customizer...</p>
        </div>
    );
}

/** The product's customizer, shown under the description on the product page. */
export default function ProductCustomizerSection() {
    const { productSlug } = useParams();
    const sectionRef = useRef(null);
    const [shouldLoad, setShouldLoad] = useState(() => window.location.hash === `#${CUSTOMIZER_SECTION_ID}`);

    useEffect(() => {
        if (shouldLoad || !sectionRef.current) return undefined;

        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                setShouldLoad(true);
                observer.disconnect();
            }
        }, { rootMargin: '600px 0px' });

        observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, [shouldLoad]);

    // Opened from "Edit design" (…#customize): bring the customizer into view once it's rendered.
    useEffect(() => {
        if (window.location.hash === `#${CUSTOMIZER_SECTION_ID}`) {
            sectionRef.current?.scrollIntoView({ block: 'start' });
        }
    }, []);

    if (!productSlug) return null;

    return (
        <section
            id={CUSTOMIZER_SECTION_ID}
            ref={sectionRef}
            className="scroll-mt-24 border-t border-zinc-200 bg-[#f7f5ef] pt-10"
        >
            <div className="mx-auto max-w-[1600px] px-4 lg:px-8">
                <h2 className="text-[1.6rem] font-semibold text-zinc-950">Customize This Product</h2>
                <p className="mt-1 text-[0.95rem] text-zinc-600">
                    Add your logo, text or shapes, preview it on the product, then save or order your design.
                </p>
            </div>

            {shouldLoad ? (
                <Suspense fallback={<CustomizerPlaceholder />}>
                    <ProductCustomizer key={productSlug} productSlug={productSlug} embedded />
                </Suspense>
            ) : (
                <CustomizerPlaceholder />
            )}

            <Toaster position="top-right" richColors />
        </section>
    );
}
