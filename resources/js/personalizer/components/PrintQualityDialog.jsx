import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { PRINT_DPI_GOOD } from '../printQuality';

const inches = (value) => `${value.toFixed(1)} in`;

/**
 * Asks the customer to replace an image that would print blurry at its current size, with the
 * numbers that explain why and what would fix it.
 *
 * @param {object|null} review  From features.jsx reviewPrintQuality(); null when closed.
 */
export default function PrintQualityDialog({ review, onReplace, onShrink, onDismiss }) {
    // Keep showing the last review while the dialog animates closed.
    const [shown, setShown] = useState(review);
    useEffect(() => {
        if (review) setShown(review);
    }, [review]);

    if (!shown) return null;

    const { name, url, view, analysis, quality, widthIn, heightIn, beforeOrder } = shown;
    const neededWidth = Math.ceil(widthIn * PRINT_DPI_GOOD);
    const neededHeight = Math.ceil(heightIn * PRINT_DPI_GOOD);
    // Lots of pixels but little real detail: it was enlarged from a smaller picture or is out of focus.
    const looksSoft = analysis && analysis.effectiveWidth < analysis.width * 0.6;
    // Offer to shrink only if the sharp size is still a usable print (at least ~1 inch wide).
    const canShrink = quality.maxGoodWidthIn >= 1 && quality.maxGoodHeightIn >= 0.5;

    return (
        <AlertDialog open={Boolean(review)} onOpenChange={(open) => { if (!open) onDismiss(); }}>
            <AlertDialogContent className="bg-white sm:max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogMedia className="bg-red-50 text-red-600">
                        <ImageOff />
                    </AlertDialogMedia>
                    <AlertDialogTitle>
                        {beforeOrder ? 'Replace this image before ordering' : 'This image is too low quality to print'}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-600">
                        At its size on the {view} ({inches(widthIn)} × {inches(heightIn)}) it would print at about
                        {' '}<strong className="text-red-600">{quality.dpi} DPI</strong>. A clear print needs at
                        least {PRINT_DPI_GOOD} DPI, otherwise it comes out blurry or pixelated. Please upload a
                        sharper, higher-resolution image.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
                    {url ? (
                        <img src={url} alt="" className="size-16 shrink-0 rounded-lg border border-zinc-200 bg-white object-contain" />
                    ) : null}
                    <div className="min-w-0 space-y-0.5">
                        <p className="truncate font-medium text-zinc-900">{name}</p>
                        <p className="text-zinc-600">
                            {analysis ? `${analysis.width} × ${analysis.height} px` : ''}
                            {looksSoft ? ' · looks blurry or enlarged from a smaller image' : ''}
                        </p>
                        <p className="text-zinc-600">
                            For this size you need about <strong>{neededWidth} × {neededHeight} px</strong> of sharp detail.
                        </p>
                        <p className="text-zinc-500">
                            This image prints sharp up to {inches(quality.maxGoodWidthIn)} × {inches(quality.maxGoodHeightIn)}.
                        </p>
                    </div>
                </div>

                {!beforeOrder ? (
                    <p className="text-xs text-zinc-500">
                        If you keep it, you'll need to replace or shrink it before you can order.
                    </p>
                ) : null}

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onDismiss}>{beforeOrder ? 'Go back' : 'Keep for now'}</AlertDialogCancel>
                    {canShrink ? (
                        <Button type="button" variant="outline" onClick={onShrink}>
                            Make it {inches(quality.maxGoodWidthIn)} wide
                        </Button>
                    ) : null}
                    <AlertDialogAction onClick={onReplace} className="bg-zinc-950 text-white hover:bg-zinc-800">
                        Upload a better image
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
