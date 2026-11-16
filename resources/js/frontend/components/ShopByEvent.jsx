import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { featuresFontClass } from '../../utils/typography';
import { categoryShopPath } from '../../utils/shopPaths';

// Stagger between each industry card starting its fade-in.
const CARD_STAGGER_MS = 180;

// Cards linked to a category open the shop filtered by it; unlinked cards open the full shop.
function industryShopPath(category) {
    return category?.slug ? categoryShopPath(category) : '/shop';
}

function IndustryCard({ title, image, category, ready, delayMs }) {
    return (
        <Link
            to={industryShopPath(category)}
            className={`industry-card${ready ? ' industry-card--ready' : ''} group relative block aspect-[3/5] w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white`}
            style={{ '--industry-card-delay': `${delayMs}ms` }}
        >
            <div className="industry-card__inner">
                {/* Front */}
                <div className="industry-card__face bg-zinc-200">
                    {image ? (
                        <img
                            src={image}
                            alt={title || 'Industry image'}
                            className="h-full w-full object-cover"
                        />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    <div className="absolute inset-x-0 bottom-1/4 z-10 px-6 text-center">
                        <h3 className="text-[2rem] font-normal uppercase leading-snug tracking-[0.04em] text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)] sm:text-[1.4rem]">
                            {title || ''}
                        </h3>
                    </div>
                </div>

                {/* Back */}
                <div className="industry-card__face industry-card__face--back bg-zinc-900">
                    {image ? (
                        <img
                            src={image}
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-cover"
                        />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-black/55" />

                    <div className="industry-card__back-title absolute inset-x-0 z-10 px-6 text-center">
                        <h3 className="text-[2.6rem] font-normal uppercase leading-tight tracking-[0.06em] text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.5)] sm:text-[2rem]">
                            {title || ''}
                        </h3>
                    </div>
                </div>
            </div>
        </Link>
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
                    perspective: 1000px;
                }
                .industry-card.industry-card--ready {
                    animation: industryCardFadeIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    animation-delay: var(--industry-card-delay, 0ms);
                }
                .industry-card__inner {
                    position: absolute;
                    inset: 0;
                    transform-style: preserve-3d;
                    transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
                }
                .industry-card:hover .industry-card__inner,
                .industry-card:focus-visible .industry-card__inner {
                    transform: rotateY(180deg);
                }
                .industry-card__face {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }
                .industry-card__face--back {
                    transform: rotateY(180deg);
                }

                /* Back title: starts at the front title position, then moves to the center and zooms. */
                .industry-card__back-title {
                    top: 72%;
                    transform: translateY(-50%) scale(1);
                    transition:
                        top 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.25s,
                        transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.25s;
                }
                .industry-card:hover .industry-card__back-title,
                .industry-card:focus-visible .industry-card__back-title {
                    top: 50%;
                    transform: translateY(-50%) scale(1.15);
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
                        to="/shop"
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
                            category={item.category}
                            ready={itemsReady}
                            delayMs={index * CARD_STAGGER_MS}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}