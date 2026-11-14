import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { timelessFontClass } from '../../utils/typography';
import {
    resolveHeroFontFamily,
} from '../../utils/heroTypography';

const defaultHeroData = {
    title: '',
    ticker_text: '',
    sub_title: '',
    description: '',
    image_url: null,
    video_url: null,
    button_enabled: false,
    button_text: '',
    slides: [],
    title_font_size: 124,
    title_font_family: 'instrument-sans',
    description_font_size: 24,
    description_font_family: 'instrument-sans',
};

// Right/top are % offsets within the logo container, used only to place the card itself.
// The thread's start point and length are measured live from the rendered card (see cardMetrics).
const LOGO_POSITIONS = [
    { pos: 'right-[46%] top-[15%]', rot: -5 }, // 1971Co
    { pos: 'right-[8%] top-[6%]', rot: 6 },      // Chef Wo
    { pos: 'right-[68%] top-[58%]', rot: -2 }, // viveren — moved left
    { pos: 'right-[15%] top-[52%]', rot: 2 },  // TIMEless — moved down
];

export default function Hero() {
    const [heroData, setHeroData] = useState(defaultHeroData);
    const [logosReady, setLogosReady] = useState(false);
    const sectionRef = useRef(null);
    const cardContainerRef = useRef(null);
    const cardRefs = useRef([]);
    // Each card's real rendered top offset + horizontal center (px), so the thread always
    // starts exactly at the card's true top-center instead of an approximated percentage.
    const [cardMetrics, setCardMetrics] = useState([]);

    useEffect(() => {
        let ignore = false;

        async function loadHero() {
            try {
                const response = await fetch('/api/public/hero', {
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) {
                    return;
                }

                const payload = await response.json();
                if (!ignore && payload) {
                    setHeroData((previous) => ({ ...previous, ...payload }));
                }
            } catch {
                // Keep default hero when public endpoint is unavailable.
            }
        }

        loadHero();

        return () => {
            ignore = true;
        };
    }, []);

    // Replay the drop-in animation every time the hero section enters the viewport.
    useEffect(() => {
        const node = sectionRef.current;
        if (!node || !Array.isArray(heroData.slides) || heroData.slides.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Reset first so the CSS animation restarts from its initial state,
                    // then flip back on next frame to retrigger it.
                    setLogosReady(false);
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => setLogosReady(true));
                    });
                } else {
                    setLogosReady(false);
                }
            },
            { threshold: 0.3 }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [heroData.slides]);

    const titleFamily = resolveHeroFontFamily(heroData.title_font_family, 'instrument-sans');
    const descriptionFamily = resolveHeroFontFamily(
        heroData.description_font_family,
        'instrument-sans'
    );
    const descriptionValue = heroData.description || '';
    const hasRichDescription = /<[^>]+>/.test(descriptionValue);
    const repeaterSlides = Array.isArray(heroData.slides) ? heroData.slides : [];

    // Re-measure each card's position/size whenever it changes (image load, container resize, etc).
    useLayoutEffect(() => {
        const measure = () => {
            setCardMetrics(
                cardRefs.current.map((el) =>
                    el ? { top: el.offsetTop, centerX: el.offsetLeft + el.offsetWidth / 2 } : null
                )
            );
        };

        const observer = new ResizeObserver(measure);
        if (cardContainerRef.current) {
            observer.observe(cardContainerRef.current);
        }
        cardRefs.current.forEach((el) => {
            if (el) observer.observe(el);
        });
        measure();

        return () => observer.disconnect();
    }, [repeaterSlides]);

    return (
        <section
            id="home-hero-section"
            ref={sectionRef}
            className={`${timelessFontClass} relative isolate min-h-[520px] overflow-hidden bg-[#d9e5e0] text-zinc-950 lg:min-h-[600px]`}
        >
            <style>{`
                @keyframes heroLogoDrop {
                    0% {
                        opacity: 0;
                        transform: translateY(-220px) rotate(0deg);
                    }
                    55% {
                        opacity: 1;
                        transform: translateY(8px) rotate(var(--hero-logo-rot, 0deg));
                    }
                    75% {
                        transform: translateY(-10px) rotate(var(--hero-logo-rot, 0deg));
                    }
                    90% {
                        transform: translateY(4px) rotate(var(--hero-logo-rot, 0deg));
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) rotate(var(--hero-logo-rot, 0deg));
                    }
                }
                @keyframes heroThreadGrow {
                    0% {
                        opacity: 0;
                        transform: scaleY(0);
                    }
                    30% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 1;
                        transform: scaleY(1);
                    }
                }
                .hero-logo-card {
                    opacity: 0;
                    transform: translateY(-220px);
                }
                .hero-logo-card.hero-logo-card--ready {
                    animation: heroLogoDrop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    animation-delay: var(--hero-logo-delay, 0ms);
                }
                .hero-thread {
                    opacity: 0;
                    transform-origin: top;
                    transform: scaleY(0);
                }
                .hero-thread.hero-thread--ready {
                    animation: heroThreadGrow 0.5s ease-out forwards;
                    animation-delay: var(--hero-logo-delay, 0ms);
                }
            `}</style>
            <div className="mx-auto flex min-h-[520px] w-full max-w-[1920px] items-center px-6 py-16 sm:px-10 lg:min-h-[600px] lg:px-16">
                <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">

                    {/* Left Column: Content */}
                    <div className="flex flex-col items-start space-y-6 lg:col-span-5">
                        {/* Tag Pill */}
                        {heroData.sub_title ? (
                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 shadow-sm">
                                <span className="size-1.5 rounded-full bg-zinc-900" />
                                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-zinc-900">
                                    {heroData.sub_title}
                                </span>
                            </div>
                        ) : null}

                        {/* Title */}
                        <h1
                            className="text-4xl font-normal tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl"
                            style={{ fontFamily: titleFamily }}
                        >
                            {heroData.title || ''}
                        </h1>

                        {/* Description */}
                        {hasRichDescription ? (
                            <div
                                className="max-w-[540px] text-[0.95rem] leading-relaxed text-zinc-600 sm:text-base [&_p]:mb-3"
                                style={{ fontFamily: descriptionFamily }}
                                dangerouslySetInnerHTML={{ __html: descriptionValue }}
                            />
                        ) : (
                            <p
                                className="max-w-[540px] text-[0.95rem] leading-relaxed text-zinc-600 sm:text-base"
                                style={{ fontFamily: descriptionFamily }}
                            >
                                {descriptionValue}
                            </p>
                        )}

                        {/* CTA Button */}
                        {heroData.button_enabled && heroData.button_text ? (
                            <a
                                href="#shop"
                                className="inline-flex items-center justify-center rounded-sm bg-[#e65c00] px-7 py-3.5 text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-[#d55400]"
                            >
                                {heroData.button_text}
                            </a>
                        ) : null}
                    </div>

                    {/* Right Column: Repeater image cards */}
                    <div
                        ref={cardContainerRef}
                        className="relative flex h-[360px] w-full items-center justify-center lg:col-span-7 lg:h-[440px]"
                    >
                        {repeaterSlides.length > 0 ? (
                            repeaterSlides.slice(0, 4).map((slide, index) => {
                                const { pos, rot } = LOGO_POSITIONS[index] || LOGO_POSITIONS[0];
                                const delay = `${index * 500}ms`;
                                const metrics = cardMetrics[index];

                                return (
                                    <div key={slide.id || `slide-${index}`}>
                                        {/* Thread: solid thin line, sits behind the card (z-0), stops exactly at its top-center */}
                                        <div
                                            className={`hero-thread${logosReady ? ' hero-thread--ready' : ''} pointer-events-none absolute top-0 z-0 w-px -translate-x-1/2 bg-zinc-400/70`}
                                            style={{
                                                left: metrics ? `${metrics.centerX}px` : undefined,
                                                height: metrics ? `${metrics.top}px` : 0,
                                                visibility: metrics ? 'visible' : 'hidden',
                                                '--hero-logo-delay': delay,
                                            }}
                                        />
                                        {/* Pin dot at the exact top point the thread comes from */}
                                        <span
                                            className={`hero-thread${logosReady ? ' hero-thread--ready' : ''} pointer-events-none absolute top-0 z-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-500/70`}
                                            style={{
                                                left: metrics ? `${metrics.centerX}px` : undefined,
                                                visibility: metrics ? 'visible' : 'hidden',
                                                '--hero-logo-delay': delay,
                                            }}
                                        />
                                        {/* Logo card — sized to the uploaded image, not cropped */}
                                        <div
                                            ref={(el) => {
                                                cardRefs.current[index] = el;
                                            }}
                                            className={`hero-logo-card${logosReady ? ' hero-logo-card--ready' : ''} absolute z-10 inline-flex max-h-40 max-w-[220px] items-center justify-center overflow-hidden rounded-sm bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-transform hover:rotate-0 ${pos}`}
                                            style={{
                                                '--hero-logo-rot': `${rot}deg`,
                                                '--hero-logo-delay': delay,
                                            }}
                                        >
                                            <img
                                                src={slide.image_url || slide.image}
                                                alt={`Hero brand ${index + 1}`}
                                                className="h-auto max-h-36 w-auto max-w-[200px] object-contain"
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            heroData.image_url ? (
                                <div className="inline-flex max-h-52 max-w-[320px] items-center justify-center rounded-sm bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                                    <img
                                        src={heroData.image_url}
                                        alt="Hero visual"
                                        className="h-auto max-h-48 w-auto max-w-[300px] object-contain"
                                    />
                                </div>
                            ) : null
                        )}
                    </div>

                </div>
            </div>
        </section>
    );
}