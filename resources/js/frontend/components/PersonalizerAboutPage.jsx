import { useAboutPageSection } from '../hooks/useAboutPageSection.js';

export default function ProductPersonalizer() {
  const section = useAboutPageSection('personalizer', {
    title: 'Our Solution',
    description: '<p>Upload your logo, imprint, and graphics, and try our Product Personalizer.</p>',
    image_url: null,
  });

  return (
    <section id="about-personalizer-section" className="bg-slate-50 px-6 py-16 font-sans text-slate-800 md:px-12 md:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {section.image_url ? (
            <img
              src={section.image_url}
              alt={section.title || 'Product personalizer'}
              className="max-h-[720px] w-full object-contain"
            />
          ) : (
            <div className="aspect-[4/3] w-full bg-slate-100" aria-hidden="true" />
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Product Personalizer</span>
            <h2 className="text-3xl md:text-4xl font-serif text-slate-900 mt-1 mb-4">{section.title}</h2>
            <div
              className="text-slate-600 leading-relaxed text-sm"
              dangerouslySetInnerHTML={{ __html: section.description }}
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 flex-shrink-0"></span>
              <span className="text-sm font-semibold text-slate-800">Custom Colors & Designs</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 flex-shrink-0"></span>
              <span className="text-sm font-semibold text-slate-800">Personalized Printing</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 flex-shrink-0"></span>
              <span className="text-sm font-semibold text-slate-800">Choose wide range of available styles</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 flex-shrink-0"></span>
              <span className="text-sm font-semibold text-slate-800">No MOQ</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}