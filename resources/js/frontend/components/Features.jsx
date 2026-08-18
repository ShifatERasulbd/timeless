import { useEffect, useState } from 'react';

import { featuresFontClass } from '../../utils/typography';

export default function Features() {
    const [featureItems, setFeatureItems] = useState([]);

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

    if (!featureItems.length) {
        return <section id="home-features-section" className="py-1" />;
    }

    return (
        <section id="home-features-section" className={`${featuresFontClass} bg-[#F9F9F8] py-5 sm:py-5`}>
            <div className="mx-auto w-full max-w-[1700px] px-6 sm:px-8 lg:px-12">
                <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
                    {featureItems.map((feature) => (
                        <article key={feature.id} className="mx-auto max-w-sm text-center">
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
                            <h3 className="text-[1.35rem] font-normal tracking-wide text-zinc-900">
                                {feature.title || ''}
                            </h3>
                            <p className="mx-auto mt-2.5 max-w-[28ch] text-[0.95rem] leading-relaxed text-zinc-600">
                                {feature.description || ''}
                            </p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
