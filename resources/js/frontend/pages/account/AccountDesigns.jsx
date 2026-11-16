import { Palette } from 'lucide-react';
import { useState } from 'react';

import { accountApi } from '../../api/accountApi';
import {
    Alert,
    formatDate,
    money,
    PanelHeading,
    PanelSkeleton,
    SecondaryButton,
    StatusBadge,
} from '../../components/account/ui.jsx';
import useAccountResource from '../../hooks/useAccountResource';

function DesignCard({ design }) {
    const [side, setSide] = useState('front');
    const hasBack = Boolean(design.back_image_url);
    const image = side === 'back' && hasBack ? design.back_image_url : design.front_image_url;

    return (
        <div className="flex flex-col border border-zinc-200">
            <div className="relative aspect-square bg-[#f3f3f1]">
                {image ? (
                    <img src={image} alt={`${design.title} (${side})`} className="h-full w-full object-contain p-4" loading="lazy" />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <Palette className="size-8 text-zinc-300" />
                    </div>
                )}
                {hasBack ? (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 border border-zinc-300 bg-white text-[0.68rem] font-semibold uppercase tracking-[0.1em]">
                        {['front', 'back'].map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setSide(value)}
                                aria-pressed={side === value}
                                className={`px-3 py-1 transition-colors ${side === value ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'}`}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-zinc-900">{design.title || 'Custom design'}</p>
                    <StatusBadge status={design.status} />
                </div>
                <p className="text-[0.85rem] text-slate-500">
                    Qty {design.quantity} · {money(design.total_price)}
                </p>
                <p className="mt-auto text-[0.8rem] text-slate-400">Saved {formatDate(design.created_at)}</p>
            </div>
        </div>
    );
}

export default function AccountDesigns() {
    const { data: designs, error, isLoading, reload } = useAccountResource(() => accountApi.designs());

    if (isLoading && !designs) return <PanelSkeleton rows={2} />;

    if (error && !designs) {
        return (
            <div className="space-y-4">
                <Alert>{error.message}</Alert>
                <SecondaryButton onClick={reload}>Try again</SecondaryButton>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PanelHeading
                title="My designs"
                description="Designs you created with the personalizer while logged in."
                action={
                    <a
                        href="/personalizer/features"
                        className="inline-flex h-11 items-center justify-center bg-black px-5 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-white hover:bg-zinc-800"
                    >
                        Create a design
                    </a>
                }
            />

            {designs.length ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {designs.map((design) => (
                        <DesignCard key={design.id} design={design} />
                    ))}
                </div>
            ) : (
                <div className="border border-dashed border-zinc-300 px-6 py-12 text-center">
                    <Palette className="mx-auto size-7 text-zinc-400" strokeWidth={1.5} />
                    <p className="mt-3 text-slate-600">You haven&apos;t saved any designs yet.</p>
                    <p className="mt-1 text-[0.9rem] text-slate-500">Personalize a product with your logo or artwork and it will appear here.</p>
                </div>
            )}
        </div>
    );
}
