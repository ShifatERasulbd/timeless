import { useState } from 'react';

import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    BringToFront,
    ChevronDown,
    ChevronRight,
    Check,
    Circle as CircleIcon,
    Download,
    Images,
    Italic,
    SendToBack,
    ShoppingCart,
    Star as StarIcon,
    Square,
    Triangle as TriangleIcon,
    Trash2,
    Type,
    Underline,
    Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const PIXELS_PER_INCH = 96;
const CM_PER_INCH = 2.54;

function toUnitFromPx(valuePx, unit) {
    const numeric = Number(valuePx || 0);
    if (unit === 'in') return numeric / PIXELS_PER_INCH;
    if (unit === 'cm') return (numeric / PIXELS_PER_INCH) * CM_PER_INCH;
    return numeric;
}

function fromUnitToPx(value, unit) {
    const numeric = Number(value || 0);
    if (unit === 'in') return numeric * PIXELS_PER_INCH;
    if (unit === 'cm') return (numeric / CM_PER_INCH) * PIXELS_PER_INCH;
    return numeric;
}

export default function CustomizePanel({
    activeTool,
    productName,
    productPrice,
    designPrice,
    designBreakdown = [],
    selectedColor,
    productColors,
    productColor,
    onSelectProductColor,
    onOpenUpload,
    uploadedDesigns,
    selectedDesignId,
    usedDesignIds = new Set(),
    onClearUploadedDesigns,
    onUseUploadedDesign,
    onRemoveUploadedDesign,
    draftText,
    onDraftTextChange,
    draftFontFamily,
    onDraftFontFamilyChange,
    draftFontSize,
    onDraftFontSizeChange,
    draftTextColor,
    onDraftTextColorChange,
    draftShapeColor,
    onDraftShapeColorChange,
    onAddText,
    fontOptions,
    activeImageLayers,
    activeTextLayers,
    activeShapeLayers,
    selectedObjectId,
    onSelectObject,
    onUpdateImageLayer,
    onUpdateTextLayer,
    onUpdateShapeLayer,
    onAddShape,
    onBringForward,
    onSendBackward,
    onDeleteSelected,
    orderQuantity,
    onDecreaseQuantity,
    onIncreaseQuantity,
    onDownload,
    onPreviewMockups,
    onOrderNow,
    isSaving,
    savedUrl,
}) {
    const [imageSizeUnit, setImageSizeUnit] = useState('px');
    const [collapsedSections, setCollapsedSections] = useState({
        productColor: false,
        images: false,
        text: false,
        shapes: false,
        arrange: false,
        checkout: false,
    });

    const imageSizeUnitLabel = imageSizeUnit === 'in' ? 'in' : imageSizeUnit === 'cm' ? 'cm' : 'px';
    const isCollapsed = (section) => collapsedSections[section] === true;
    const selectedShapeLayer = activeShapeLayers.find((layer) => layer.id === selectedObjectId) || null;
    const selectedTextLayer = activeTextLayers.find((layer) => layer.id === selectedObjectId) || null;

    const toggleSection = (section) => {
        setCollapsedSections((previous) => ({
            ...previous,
            [section]: !previous[section],
        }));
    };

    return (
        <section className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex h-full flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Personalize your {productName}
                    </h1>
                </div>

                <div className="mt-auto space-y-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <Label className="text-sm font-semibold text-zinc-800">Checkout</Label>
                        </div>
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => toggleSection('checkout')}>
                            {isCollapsed('checkout') ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                    </div>
                    {!isCollapsed('checkout') && (
                        <>
                    <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-3">
                        <Label htmlFor="order-quantity" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Quantity</Label>
                        <div className="inline-flex h-11 items-center overflow-hidden rounded-xl border border-zinc-300 bg-white">
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-full rounded-none px-3"
                                onClick={onDecreaseQuantity}
                                aria-label="Decrease quantity"
                            >
                                -
                            </Button>
                            <Input
                                id="order-quantity"
                                type="text"
                                readOnly
                                value={orderQuantity}
                                className="h-full w-14 rounded-none border-0 bg-transparent p-0 text-center text-base font-semibold focus-visible:ring-0"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-full rounded-none px-3"
                                onClick={onIncreaseQuantity}
                                aria-label="Increase quantity"
                            >
                                +
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2.5 rounded-2xl border border-zinc-200 bg-white p-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">Product Price</span>
                            <span className="font-semibold text-zinc-900">{productPrice || '$0.00'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">Design Price</span>
                            <span className="font-semibold text-zinc-900">{designPrice || '$0.00'}</span>
                        </div>
                        {designBreakdown.length > 0 && (
                            <ul className="space-y-1 border-t border-dashed border-zinc-200 pt-2">
                                {designBreakdown.map((row) => (
                                    <li key={row.size} className="flex items-center justify-between text-xs text-zinc-500">
                                        <span>{row.size} inch square{row.count > 1 ? ` x${row.count}` : ''}</span>
                                        <span className="font-medium text-zinc-700">${row.lineTotal.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="flex items-center justify-between border-t border-zinc-200 pt-2.5">
                            <span className="text-sm font-semibold text-zinc-800">Order total</span>
                            <span className="text-lg font-bold text-zinc-950">
                                ${(
                                    ((Number((productPrice || '0').replace(/[^0-9.]/g, '')) || 0)
                                        + (Number((designPrice || '0').replace(/[^0-9.]/g, '')) || 0))
                                    * orderQuantity
                                ).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <Button type="button" variant="outline" className="h-12 w-full rounded-2xl" onClick={onPreviewMockups} disabled={isSaving}>
                        <Images className="size-4" />
                        Preview mockups
                    </Button>

                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        <Button type="button" variant="outline" className="h-12 rounded-2xl" onClick={onDownload}>
                            <Download className="size-4" />
                            Download design
                        </Button>
                        <Button type="button" className="h-12 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800" onClick={onOrderNow} disabled={isSaving}>
                            <ShoppingCart className="size-4" />
                            <span className="truncate">Order now</span>
                        </Button>
                    </div>
                    <p className="text-center text-xs text-zinc-500">Secure checkout. Free returns.</p>
                    {savedUrl && (
                        <a href={savedUrl} target="_blank" rel="noreferrer" className="block text-center text-sm font-medium text-zinc-700 underline-offset-4 hover:underline">
                            View last saved design image
                        </a>
                    )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
