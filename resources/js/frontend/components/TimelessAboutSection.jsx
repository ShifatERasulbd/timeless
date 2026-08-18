import { useAboutPageSection } from '../hooks/useAboutPageSection.js';

export default function TimelessAboutSection() {
    const section = useAboutPageSection('timeless', {
        title: '',
        description: '',
        image_url: null,
    });

    return (
        <section id="about-timeless-section" className="bg-white py-10 sm:py-14 lg:py-16">
            <div className="mx-auto w-full max-w-[1100px] px-5 sm:px-8 lg:px-10">
                <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[380px_1fr] lg:gap-14 xl:grid-cols-[390px_1fr] xl:gap-16">

                    {/* Image */}
                    <div className="w-full border border-zinc-200 bg-white p-2 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                        {section.image_url ? (
                            <img
                                src={section.image_url}
                                alt={section.title || 'Timeless apparel collection'}
                                className="
                                block
                                h-[260px]
                                w-full
                                object-cover
                                object-center
                                sm:h-[290px]
                            "
                            />
                        ) : null}
                    </div>

                    {/* Content */}
                    <div className="max-w-[600px]">
                        <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500 sm:text-[10px]">
                            ABOUT TIMELESS FASHION
                        </p>

                        <h2
                            className="
                                mt-3
                                max-w-[560px]
                                font-serif
                                text-[26px]
                                font-normal
                                leading-[1.02]
                                tracking-[-0.015em]
                                text-zinc-900
                                sm:text-[30px]
                                lg:text-[31px]
                            "
                        >
                            {section.title}
                        </h2>

                        <div
                            className="
                                mt-3
                                max-w-[560px]
                                text-[12px]
                                leading-[1.45]
                                text-zinc-600
                                sm:text-[13px]
                                lg:text-[13px]
                            "
                            dangerouslySetInnerHTML={{ __html: section.description }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}