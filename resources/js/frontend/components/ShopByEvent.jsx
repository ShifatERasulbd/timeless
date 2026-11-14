import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { featuresFontClass } from '../../utils/typography';

// Stagger between each industry card starting its fade-in.
const CARD_STAGGER_MS = 180;

function IndustryCard({ title, image, ready, delayMs }) {
    return (
        <article
            className={`industry-card${ready ? ' industry-card--ready' : ''} group relative aspect-[3/5] w-full overflow-hidden bg-zinc-200`}
            style={{ '--industry-card-delay': `${delayMs}ms` }}
        >
            {image ? (
                <img
                    src={image}
                    alt={title || 'Industry image'}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : null}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            <div className="absolute inset-x-0 bottom-1/4 z-10 px-6 text-center">
                <h3 className="text-[2rem] font-normal uppercase leading-snug tracking-[0.04em] text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)] sm:text-[1.4rem]">
                    {title || ''}
                </h3>
            </div>
        </article>
    );
}

export default function ShopByIndustry() {
    const [section, setSection] = useState({
        title: '',
        subtitle: '',
        items: [],
    });
    const [itemsReady, setItemsReady] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        let ignore = false;

        async function loadSection() {
            try {
                const response = await fetch('/api/public/shop-by-industry', {
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) {
                    return;
                }

                const payload = await response.json();
                if (!ignore && payload) {
                    setSection({
                        title: payload.title || '',
                        subtitle: payload.subtitle || '',
                        items: Array.isArray(payload.items) ? payload.items : [],
                    });
                }
            } catch {
                // Keep section stable if API is unavailable.
            }
        }

        loadSection();

        return () => {
            ignore = true;
        };
    }, []);

    // Reveal cards one after another whenever the section enters the viewport.
    useEffect(() => {
        const node = sectionRef.current;
        if (!node || section.items.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setItemsReady(false);
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => setItemsReady(true));
                    });
                } else {
                    setItemsReady(false);
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [section.items]);

    if (!section.title && !section.subtitle && !section.items.length) {
        return <section id="home-shop-by-industry-section" className="py-1" />;
    }

    return (
        <section
            id="home-shop-by-industry-section"
            ref={sectionRef}
            className={`${featuresFontClass} bg-[#F9F9F8] py-5 sm:py-5 w-full`}
        >
            <style>{`
                @keyframes industryCardFadeIn {
                    0% {
                        opacity: 0;
                        transform: translateY(24px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .industry-card {
                    opacity: 0;
                    transform: translateY(24px);
                }
                .industry-card.industry-card--ready {
                    animation: industryCardFadeIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    animation-delay: var(--industry-card-delay, 0ms);
                }
            `}</style>
            <div className="w-full px-6 sm:px-8 lg:px-12 mb-10 sm:mb-12">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="text-[2.7rem] font-light uppercase leading-none tracking-[0.04em] text-zinc-900 sm:text-[2rem]">
                            {section.title || ''}
                        </h2>
                        <p className="mt-3 text-[1rem] leading-7 text-zinc-700 sm:text-[1.1rem]">
                            {section.subtitle || ''}
                        </p>
                    </div>

                    <Link
                        to="/"
                        className="inline-flex items-center self-start whitespace-nowrap border-b border-zinc-400 pb-1 text-[0.85rem] font-medium uppercase tracking-[0.15em] text-zinc-700 transition-colors hover:text-zinc-950"
                    >
                        View all products
                    </Link>
                </div>
            </div>

            <div className="w-full px-0">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0.5">
                    {section.items.map((item, index) => (
                        <IndustryCard
                            key={item.id}
                            title={item.title}
                            image={item.image_url || item.image}
                            ready={itemsReady}
                            delayMs={index * CARD_STAGGER_MS}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}