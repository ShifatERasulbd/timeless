import { useEffect, useRef, useState } from 'react';

import { featuresFontClass } from '../../utils/typography';

// Stagger between each feature card starting its entrance.
const CARD_STAGGER_MS = 220;
// Delay after the card appears before its title starts revealing character by character.
const TITLE_START_OFFSET_MS = 100;
// Delay between each character of the title sliding in.
const TITLE_CHAR_STAGGER_MS = 22;
// Delay after the title finishes before the description starts revealing character by character.
const DESCRIPTION_START_OFFSET_MS = 250;
// Delay between each character of the description sliding in.
const CHAR_STAGGER_MS = 14;

function splitIntoChars(text) {
    // Keep spaces as their own animated span (with a fixed width) so wrapping still behaves normally.
    return Array.from(text || '');
}

export default function Features() {
    const [featureItems, setFeatureItems] = useState([]);
    const [itemsReady, setItemsReady] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        let ignore = false;

        async function loadFeatures() {
            try {
                const response = await fetch('/api/public/features', {
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) {
                    return;
                }

                const payload = await response.json();
                if (!ignore) {
                    setFeatureItems(Array.isArray(payload) ? payload : []);
                }
            } catch {
                // Keep section resilient if API is unavailable.
            }
        }

        loadFeatures();

        return () => {
            ignore = true;
        };
    }, []);

    // Reveal cards one after another whenever the section enters the viewport.
    useEffect(() => {
        const node = sectionRef.current;
        if (!node || featureItems.length === 0) {
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
            { threshold: 0.2 }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [featureItems]);

    if (!featureItems.length) {
        return <section id="home-features-section" className="py-1" />;
    }

    return (
        <section
            id="home-features-section"
            ref={sectionRef}
            className={`${featuresFontClass} bg-[#F9F9F8] py-5 sm:py-5`}
        >
            <style>{`
                @keyframes featureCardRise {
                    0% {
                        opacity: 0;
                        transform: translateY(28px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes featureCharSlideLeft {
                    0% {
                        opacity: 0;
                        transform: translateX(0.6em);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .feature-card {
                    opacity: 0;
                    transform: translateY(28px);
                }
                .feature-card.feature-card--ready {
                    animation: featureCardRise 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    animation-delay: var(--feature-card-delay, 0ms);
                }
                .feature-title {
                    display: inline-block;
                }
                .feature-char {
                    display: inline-block;
                    opacity: 0;
                    white-space: pre;
                }
                .feature-char.feature-char--ready {
                    animation: featureCharSlideLeft 0.35s ease-out forwards;
                }
            `}</style>
            <div className="mx-auto w-full max-w-[1700px] px-6 sm:px-8 lg:px-12">
                <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
                    {featureItems.map((feature, index) => {
                        const cardDelay = `${index * CARD_STAGGER_MS}ms`;
                        const cardDelayMs = index * CARD_STAGGER_MS;
                        const titleChars = splitIntoChars(feature.title || '');
                        const descriptionChars = splitIntoChars(feature.description || '');
                        const titleDurationMs =
                            TITLE_START_OFFSET_MS + titleChars.length * TITLE_CHAR_STAGGER_MS;

                        return (
                            <article
                                key={feature.id}
                                className={`feature-card${itemsReady ? ' feature-card--ready' : ''} mx-auto max-w-sm text-center`}
                                style={{ '--feature-card-delay': cardDelay }}
                            >
                                <div className="mb-4 flex justify-center text-amber-700">
                                    {feature.icon_url ? (
                                        <img
                                            src={feature.icon_url}
                                            alt={feature.title || 'Feature icon'}
                                            className="size-6 object-contain"
                                        />
                                    ) : (
                                        <span className="inline-flex size-2 rounded-full bg-amber-700" />
                                    )}
                                </div>

                                <h3 className="feature-title text-[1.35rem] font-normal tracking-wide text-zinc-900">
                                    {titleChars.map((char, charIndex) => {
                                        const charDelay =
                                            cardDelayMs +
                                            TITLE_START_OFFSET_MS +
                                            charIndex * TITLE_CHAR_STAGGER_MS;

                                        return (
                                            <span
                                                key={charIndex}
                                                className={`feature-char${itemsReady ? ' feature-char--ready' : ''}`}
                                                style={{ animationDelay: `${charDelay}ms` }}
                                            >
                                                {char}
                                            </span>
                                        );
                                    })}
                                </h3>

                                <p className="mx-auto mt-2.5 max-w-[28ch] text-[0.95rem] leading-relaxed text-zinc-600">
                                    {descriptionChars.map((char, charIndex) => {
                                        const charDelay =
                                            cardDelayMs +
                                            titleDurationMs +
                                            DESCRIPTION_START_OFFSET_MS +
                                            charIndex * CHAR_STAGGER_MS;

                                        return (
                                            <span
                                                key={charIndex}
                                                className={`feature-char${itemsReady ? ' feature-char--ready' : ''}`}
                                                style={{ animationDelay: `${charDelay}ms` }}
                                            >
                                                {char}
                                            </span>
                                        );
                                    })}
                                </p>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}