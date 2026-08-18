import { ArrowLeft, ChevronDown, ChevronUp, Download, Eye, Layers, Share2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

import { timelessFontClass } from '../../utils/typography';

export default function Customizer() {
    const [section, setSection] = useState({ title: '', description: '', image: null });

    useEffect(() => {
        let ignore = false;

        async function loadSection() {
            try {
                const response = await fetch('/api/public/customize-home-page', {
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) return;

                const payload = await response.json();
                if (!ignore && payload) {
                    const imagePath = payload.image
                        ? payload.image.startsWith('uploads/')
                            ? `/${payload.image}`
                            : `/storage/${payload.image}`
                        : null;

                    setSection({
                        title: payload.title || '',
                        description: payload.description || '',
                        image:
                            imagePath && payload.updated_at
                                ? `${imagePath}?v=${encodeURIComponent(payload.updated_at)}`
                                : imagePath,
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

    if (!section.title && !section.description && !section.image) {
        return <section id="home-customize-section" className="py-1" />;
    }

    return (
        <section id="home-customize-section" className={`${timelessFontClass} bg-white py-14 text-zinc-900 sm:py-20`}>
            <div className="mx-auto grid w-full max-w-[1700px] grid-cols-1 gap-10 px-6 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-14 lg:px-12">
                
                {/* Left Column - Text Content */}
                <div className="max-w-2xl space-y-6 lg:space-y-7">
                    <h2 className="text-[clamp(2.2rem,3.2vw,3rem)] font-normal uppercase leading-[1.05] tracking-[0.02em] text-zinc-900">
                        {section.title}
                    </h2>

                    <div
                        className="max-w-[49ch] text-[1.05rem] leading-relaxed text-zinc-600 sm:text-[1.125rem]"
                        dangerouslySetInnerHTML={{ __html: section.description }}
                    />

                  

                    <div>
                        <a
                            href="/personalizer/features"
                            className="inline-flex items-center justify-center bg-[#E56338] px-7 py-3 text-[0.9rem] font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#d0552e]"
                        >
                            Start Customizing
                        </a>
                    </div>
                </div>

                <div className="relative aspect-[4/3] w-full overflow-hidden border border-zinc-200 bg-zinc-50">
                    {section.image ? (
                        <img
                            src={section.image}
                            alt={section.title || 'Customizer preview'}
                            className="h-full w-full object-contain"
                        />
                    ) : null}
                </div>

            </div>
        </section>
    );
}