import { useAboutPageSection } from '../hooks/useAboutPageSection.js';

export default function AboutHeroSection() {
    const section = useAboutPageSection('hero', {
        title: '',
        description: '',
        image_url: null,
    });

    return (
        <section id="about-hero-section" className="relative overflow-hidden bg-[#F9F9F8] py-20 sm:py-28">
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-6 text-center">
                <h1 className="text-[2.8rem] font-normal uppercase tracking-[0.06em] text-zinc-900 sm:text-[3.5rem]">
                    {section.title}
                </h1>
                <div
                    className="relative mt-5 max-w-2xl text-[0.95rem] leading-relaxed text-zinc-600 sm:text-[1.05rem]"
                    dangerouslySetInnerHTML={{ __html: section.description }}
                />
            </div>
        </section>
    );
}