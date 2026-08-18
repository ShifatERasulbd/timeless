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
                    {section.items.map((item) => (
                        <div key={item.id} className="flex flex-col">
                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-zinc-200">
                                {item.image_url || item.image ? (
                                    <img
                                        src={item.image_url || item.image}
                                        alt={item.title || 'How we help'}
                                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
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
                                <p className="mt-3 text-[1rem] leading-relaxed text-zinc-600">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}