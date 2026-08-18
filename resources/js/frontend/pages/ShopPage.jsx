import { Suspense, lazy } from 'react';

import SectionSkeleton from '../components/SectionSkeleton.jsx';


const ShopCatalogSection = lazy(() => import('../components/ShopCatalogSection.jsx'));


function LazySection({ children, heightClass }) {
    return <Suspense fallback={<SectionSkeleton heightClass={heightClass} />}>{children}</Suspense>;
}

export default function ShopPage() {
    return (
        <div className="bg-white">
            <section className="flex min-h-[360px] items-center justify-center bg-[#f7f7f6] px-6 py-20 text-center sm:min-h-[430px]">
                <div>
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-zinc-400">
                        The Full Collection
                    </p>
                    <h1 className="mt-4 font-serif text-[clamp(2.6rem,5.2vw,4.5rem)] font-normal uppercase leading-none tracking-[0.03em] text-zinc-950">
                        Shop Left Sidebar
                    </h1>
                    <p className="mt-6 text-xs text-zinc-500">Everything Timeless, in one place.</p>
                </div>
            </section>

            <LazySection heightClass="h-[760px]">
                <ShopCatalogSection />
            </LazySection>
        </div>
    );
}
