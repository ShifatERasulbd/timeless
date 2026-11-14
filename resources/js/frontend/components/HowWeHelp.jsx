import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { featuresFontClass } from '../../utils/typography';

export default function HowWeHelp() {
    const [section, setSection] = useState({ title: '', description: '', items: [] });

    useEffect(() => {
        let ignore = false;

        async function loadSection() {
            try {
                const response = await fetch('/api/public/how-we-help', {
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) {
                    return;
                }

                const payload = await response.json();
                if (!ignore && payload) {
                    setSection({
                        title: payload.title || '',
                        description: payload.description || '',
                        items: Array.isArray(payload.items) ? payload.items : [],
                    });
                }
            } catch {
                // Keep the section stable if the API is unavailable.
            }
        }

        loadSection();

        return () => {
            ignore = true;
        };
    }, []);

    if (!section.title && !section.description && !section.items.length) {
        return <section id="home-how-we-help-section" className="py-1" />;
    }

    return (
        <section id="home-how-we-help-section" className={`${featuresFontClass} bg-[#F9F9F8] py-20 sm:py-24`}>
            <div className="mx-auto w-full max-w-[1700px] px-6 sm:px-8 lg:px-12">
                <div className="mx-auto mb-16 max-w-2xl text-center">
                    <h2 className="text-[3rem] font-normal tracking-tight text-zinc-900 sm:text-[3.5rem]">
                        {section.title}
                    </h2>
                    <div className="mx-auto mt-2 h-[1px] w-48 bg-zinc-300" />
                    <p className="mt-4 text-[1.05rem] leading-relaxed text-zinc-600 sm:text-[1.125rem]">
                        {section.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-10">
                    {section.items.map((item) => {
                        const image = item.image_url || item.image;

                        return (
                            // The wrapper stays still and owns the hover/focus, so the card doesn't
                            // flicker while it rotates out from under the cursor.
                            <div
                                key={item.id}
                                tabIndex={0}
                                className="group outline-none [perspective:1600px]"
                            >
                                <div className="relative h-full transition-transform duration-[900ms] ease-[cubic-bezier(0.34,1.3,0.64,1)] [transform-style:preserve-3d] group-hover:[transform:rotateX(-180deg)] group-focus-visible:[transform:rotateX(-180deg)] motion-reduce:transition-none">
                                    {/* Front */}
                                    <div className="flex h-full flex-col [backface-visibility:hidden]">
                                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-zinc-200">
                                            {image ? (
                                                <img
                                                    src={image}
                                                    alt={item.title || 'How we help'}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : null}
                                        </div>

                                        <div className="mt-6 flex flex-col flex-grow border-b border-zinc-200 pb-8">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[1.5rem] font-medium tracking-wide text-zinc-900">
                                                    {item.title}
                                                </h3>
                                                <span className="flex h-8 w-8 items-center justify-center text-amber-700">
                                                    <Plus className="h-5 w-5 font-light" />
                                                </span>
                                            </div>
                                            {/* Shown visually only on the back; kept here for screen readers. */}
                                            <p className="sr-only">{item.description}</p>
                                        </div>
                                    </div>

                                    {/* Back — revealed by the flip; duplicates the front text, so hidden from screen readers. */}
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-0 overflow-hidden rounded-sm bg-zinc-900 [backface-visibility:hidden] [transform:rotateX(180deg)]"
                                    >
                                        {image ? (
                                            <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                                        ) : null}
                                        <div className="absolute inset-0 bg-zinc-950/80" />

                                        <div className="relative flex h-full flex-col items-center justify-center px-8 text-center sm:px-10">
                                            <span className="mb-6 h-[2px] w-12 bg-[#e65c00]" />
                                            <h3 className="text-[1.6rem] font-medium tracking-wide text-white">
                                                {item.title}
                                            </h3>
                                            <p className="mt-4 max-w-[36ch] text-[1.05rem] leading-relaxed text-zinc-200">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}