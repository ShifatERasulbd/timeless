import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Images } from 'lucide-react';

import { Button } from '@/components/ui/button';

import Mockup360Viewer from './components/Mockup360Viewer';

export default function MockupPreviewPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [orderDetails, setOrderDetails] = useState(() => location.state?.orderDetails || null);

    useEffect(() => {
        if (orderDetails) return;

        const stored = sessionStorage.getItem('personalizer:pendingOrder');
        if (!stored) return;

        try {
            setOrderDetails(JSON.parse(stored));
        } catch {
            setOrderDetails(null);
        }
    }, [orderDetails]);

    if (!orderDetails) {
        return (
            <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-5 p-6 text-center">
                <Images className="size-10 text-zinc-500" />
                <h1 className="text-2xl font-semibold">No design found for preview</h1>
                <p className="text-sm text-zinc-500">Save your design first, then open mockup preview.</p>
                <Button type="button" onClick={() => navigate('/personalizer/features')}>
                    Back to Personalizer
                </Button>
            </main>
        );
    }

    // Prefer the in-browser (data URL) snapshots: their pixels can always be read for background removal.
    const frontImageUrl = orderDetails?.cachedFrontImageUrl || orderDetails?.frontImageUrl
        || orderDetails?.cachedImageUrl || orderDetails?.imageUrl || '';
    const backImageUrl = orderDetails?.cachedBackImageUrl || orderDetails?.backImageUrl || '';

    return (
        <main className="min-h-screen bg-[#f7f5ef] p-4 sm:p-6">
            <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
                <button
                    type="button"
                    className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950"
                    onClick={() => navigate('/personalizer/confirm-order', { state: { orderDetails } })}
                >
                    <ArrowLeft className="size-4" />
                    Back to confirm order
                </button>

                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Mockup previews</h1>
                    <p className="mt-1 text-sm text-zinc-500">Spin your design all the way around to see the front and back.</p>
                </div>

                <Mockup360Viewer
                    frontImageUrl={frontImageUrl}
                    backImageUrl={backImageUrl}
                    layersKey={orderDetails?.mockupLayersKey}
                />
            </div>
        </main>
    );
}
