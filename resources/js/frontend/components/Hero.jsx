import { useEffect, useState } from 'react';

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

export default function Hero() {
    const [heroData, setHeroData] = useState(defaultHeroData);

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

    const titleFamily = resolveHeroFontFamily(heroData.title_font_family, 'instrument-sans');
    const descriptionFamily = resolveHeroFontFamily(
        heroData.description_font_family,
        'instrument-sans'
    );
    const descriptionValue = heroData.description || '';
    const hasRichDescription = /<[^>]+>/.test(descriptionValue);
    const repeaterSlides = Array.isArray(heroData.slides) ? heroData.slides : [];

    return (
        <section id="home-hero-section" className={`${timelessFontClass} relative isolate min-h-[520px] overflow-hidden bg-[#d9e5e0] text-zinc-950 lg:min-h-[600px]`}>
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
                    <div className="relative flex h-[360px] w-full items-center justify-center lg:col-span-7 lg:h-[440px]">
                        {repeaterSlides.length > 0 ? (
                            repeaterSlides.slice(0, 4).map((slide, index) => {
                                const positions = [
                                    'right-[46%] top-[18%] rotate-[-5deg]',
                                    'right-[12%] top-[36%] rotate-[6deg]',
                                    'right-[42%] bottom-[14%] rotate-[-2deg]',
                                    'right-[20%] top-[10%] rotate-[2deg]',
                                ];

                                return (
                                    <div
                                        key={slide.id || `slide-${index}`}
                                        className={`absolute overflow-hidden rounded-sm bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-transform hover:rotate-0 ${positions[index] || positions[0]}`}
                                    >
                                            <img
                                                src={slide.image_url || slide.image}
                                            alt={`Hero brand ${index + 1}`}
                                            className="h-20 w-32 object-cover"
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            heroData.image_url ? (
                                <div className="rounded-sm bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                                    <img
                                        src={heroData.image_url}
                                        alt="Hero visual"
                                        className="h-52 w-72 object-cover"
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