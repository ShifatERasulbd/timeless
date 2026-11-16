import { Suspense, lazy, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Toaster } from 'sonner';

// The personalizer (fabric.js canvas) is large. This whole section is only mounted once the
// shopper clicks "Start Personalizing" (or returns via "Edit design" → …#customize).
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

    // Only mounted on demand, so bring it into view as soon as it appears.
    useEffect(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    if (!productSlug) return null;

    return (
        <section
            id={CUSTOMIZER_SECTION_ID}
            ref={sectionRef}
            className="scroll-mt-24 border-t border-zinc-200 bg-[#f7f5ef] pt-10"
        >
            <div className="mx-auto max-w-[1600px] px-4 lg:px-8">
                <h2 className="text-[1.6rem] font-semibold text-zinc-950">Personalize This Product</h2>
                <p className="mt-1 text-[0.95rem] text-zinc-600">
                    Add your logo, text or shapes, preview it on the product, then save or order your design.
                </p>
            </div>

            <Suspense fallback={<CustomizerPlaceholder />}>
                <ProductCustomizer key={productSlug} productSlug={productSlug} embedded />
            </Suspense>

            <Toaster position="top-right" richColors />
        </section>
    );
}
