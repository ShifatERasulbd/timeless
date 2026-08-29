import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ArrowUpDown,
    Check,
    Circle as CircleIcon,
    BringToFront,
    Italic,
    Palette,
    RotateCcw,
    RotateCw,
    SendToBack,
    Shapes,
    Square,
    Star as StarIcon,
    Trash2,
    Triangle as TriangleIcon,
    Type,
    Upload,
    X,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const TOOL_ITEMS = [
    { id: 'upload', label: 'Upload', icon: Upload, hasDrawer: true },
    { id: 'color', label: 'Color', icon: Palette, hasDrawer: true },
    { id: 'text', label: 'Text', icon: Type, hasDrawer: true },
    { id: 'arrange', label: 'Arrange', icon: ArrowUpDown, hasDrawer: true },
    { id: 'shapes', label: 'Shapes', icon: Shapes, hasDrawer: true },
    { id: 'undo', label: 'Undo', icon: RotateCcw, action: true },
    { id: 'redo', label: 'Redo', icon: RotateCw, action: true },
];

function ToolbarButton({ active, icon: Icon, label, onClick, disabled = false, onMouseEnter, onMouseLeave, buttonRef }) {
    return (
        <button
            ref={buttonRef}
            type="button"
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={cn(
                'group flex min-w-[58px] flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-[11px] font-medium transition-colors',
                active
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900',
                disabled && 'cursor-not-allowed opacity-50'
            )}
            aria-label={label}
        >
            <Icon className="size-4" />
            <span>{label}</span>
        </button>
    );
}

function ToolDrawer({ coords, onClose, children }) {
    if (!coords) return null;

    return createPortal(
        <div
            className="fixed z-[999] w-64 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl"
            style={{ top: coords.top, left: coords.left }}
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
                <X className="size-4" />
            </button>
            <div
                className="overflow-y-auto pr-1"
                style={{ maxHeight: `calc(100vh - ${coords.top + 32}px)` }}
            >
                {children}
            </div>
        </div>,
        document.body
    );
}

export default function LeftToolbar({
    activeTool,
    canUndo,
    canRedo,
    onSelectTool,
    uploadedDesigns = [],
    onUseUploadedDesign,
    onRemoveUploadedDesign,
    onOpenUpload,
    productColors = [],
    productColor,
    onSelectProductColor,
    draftText,
    onDraftTextChange,
    draftFontFamily,
    onDraftFontFamilyChange,
    draftFontSize,
    onDraftFontSizeChange,
    draftTextColor,
    onDraftTextColorChange,
    onAddText,
    fontOptions = [],
    activeTextLayers = [],
    onSelectObject,
    onUpdateTextLayer,
    onDeleteSelected,
    selectedObjectId,
    draftShapeColor,
    onDraftShapeColorChange,
    activeShapeLayers = [],
    onUpdateShapeLayer,
    onAddShape,
    onBringForward,
    onSendBackward,
}) {
    const buttonRefs = useRef({});
    const [openDrawer, setOpenDrawer] = useState(null);
    const [drawerCoords, setDrawerCoords] = useState(null);
    const selectedTextLayer = activeTextLayers.find((layer) => layer.id === selectedObjectId) || null;

    const showDrawer = (toolId) => {
        const buttonEl = buttonRefs.current[toolId];
        if (!buttonEl) return;

        const rect = buttonEl.getBoundingClientRect();
        setDrawerCoords({ top: rect.top, left: rect.right + 12 });
        setOpenDrawer(toolId);
    };

    const hideDrawer = () => {
        setOpenDrawer(null);
        setDrawerCoords(null);
    };

    return (
        <aside className="rounded-[28px] border border-zinc-200 bg-white p-3 shadow-sm lg:sticky lg:top-6 lg:h-fit">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-1">
                {TOOL_ITEMS.map((tool) => (
                    <div key={tool.id} className="relative">
                        <ToolbarButton
                            buttonRef={(el) => {
                                buttonRefs.current[tool.id] = el;
                            }}
                            icon={tool.icon}
                            label={tool.label}
                            active={activeTool === tool.id && !tool.action}
                            disabled={(tool.id === 'undo' && !canUndo) || (tool.id === 'redo' && !canRedo)}
                            onClick={() => {
                                onSelectTool(tool.id);
                                if (tool.hasDrawer) showDrawer(tool.id);
                            }}
                        />
                    </div>
                ))}
            </div>

            {openDrawer === 'upload' && (
                <ToolDrawer coords={drawerCoords} onClose={hideDrawer}>
                    <p className="pr-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Current uploads</p>

                    <button
                        type="button"
                        onClick={() => onOpenUpload?.()}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800"
                    >
                        <Upload className="size-3.5" />
                        Upload image
                    </button>

                    {uploadedDesigns.length === 0 ? (
                        <p className="mt-3 text-sm text-zinc-500">No active uploads yet.</p>
                    ) : (
                        <div className="mt-3 space-y-2">
                            {uploadedDesigns.map((design) => (
                                <div
                                    key={design.id}
                                    draggable
                                    onDragStart={(event) => {
                                        event.dataTransfer.effectAllowed = 'copy';
                                        event.dataTransfer.setData('application/x-personalizer-design', JSON.stringify({
                                            id: design.id,
                                            name: design.name,
                                            url: design.url,
                                        }));
                                    }}
                                    className="flex cursor-grab items-center gap-2 rounded-xl border border-zinc-200 p-2 transition-colors hover:border-zinc-400 active:cursor-grabbing"
                                >
                                    <button
                                        type="button"
                                        onClick={() => onUseUploadedDesign?.(design)}
                                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                    >
                                        <img src={design.url} alt={design.name} className="size-10 rounded-lg object-cover" draggable={false} />
                                        <span className="truncate text-xs font-medium text-zinc-700">{design.name}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveUploadedDesign?.(design.id)}
                                        aria-label="Delete upload"
                                        className="shrink-0 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </ToolDrawer>
            )}

            {openDrawer === 'color' && (
                <ToolDrawer coords={drawerCoords} onClose={hideDrawer}>
                    <p className="pr-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Product colors</p>
                    {productColors.length === 0 ? (
                        <p className="mt-3 text-sm text-zinc-500">No colors available.</p>
                    ) : (
                        <div className="mt-3 flex flex-wrap gap-3">
                            {productColors.map((color) => {
                                const isActive = productColor === color.id;
                                const isLightSwatch = ['#ffffff', '#f9fafb'].includes(String(color.value).toLowerCase());

                                return (
                                    <button
                                        key={color.id}
                                        type="button"
                                        onClick={() => onSelectProductColor?.(color.id)}
                                        className={cn(
                                            'flex size-10 items-center justify-center rounded-full border shadow-sm transition-transform hover:scale-105',
                                            isActive ? 'ring-2 ring-zinc-950 ring-offset-2' : 'ring-0'
                                        )}
                                        style={{ backgroundColor: color.value }}
                                        aria-label={color.label}
                                        aria-pressed={isActive}
                                        title={color.label}
                                    >
                                        {isActive && (
                                            <Check className={cn('size-4', isLightSwatch ? 'text-zinc-900' : 'text-white')} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ToolDrawer>
            )}

            {openDrawer === 'text' && (
                <ToolDrawer coords={drawerCoords} onClose={hideDrawer}>
                    <p className="pr-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Add text</p>

                    <div className="mt-3 space-y-3">
                        <input
                            type="text"
                            value={draftText}
                            onChange={(event) => onDraftTextChange?.(event.target.value)}
                            placeholder="Write something bold"
                            className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
                        />

                        <div className="grid grid-cols-[minmax(0,1fr)_60px_40px] gap-2">
                            <select
                                value={draftFontFamily}
                                onChange={(event) => onDraftFontFamilyChange?.(event.target.value)}
                                className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-2 text-sm text-zinc-800"
                            >
                                {fontOptions.map((font) => (
                                    <option key={font} value={font}>{font}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min={6}
                                max={320}
                                value={draftFontSize}
                                onChange={(event) => onDraftFontSizeChange?.(Number(event.target.value || 24))}
                                className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-2 text-center text-sm text-zinc-800"
                            />
                            <input
                                type="color"
                                key={`toolbar-text-color-${selectedObjectId || 'new'}`}
                                defaultValue={draftTextColor}
                                onChange={(event) => onDraftTextColorChange?.(event.target.value)}
                                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-1"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => onAddText?.()}
                            disabled={!draftText?.trim()}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Type className="size-3.5" />
                            Add text layer
                        </button>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-zinc-100 pt-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Text style</p>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    disabled={!selectedTextLayer}
                                    onClick={() => onUpdateTextLayer?.(selectedTextLayer.id, { fontStyle: selectedTextLayer.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                    className={cn(
                                        'flex size-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                                        selectedTextLayer?.fontStyle === 'italic'
                                            ? 'border-zinc-900 bg-zinc-900 text-white'
                                            : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                                    )}
                                    aria-label="Toggle italic"
                                >
                                    <Italic className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    disabled={!selectedTextLayer}
                                    onClick={() => onUpdateTextLayer?.(selectedTextLayer.id, {
                                        curveEnabled: !selectedTextLayer.curveEnabled,
                                        curveAmount: selectedTextLayer.curveEnabled ? 0 : (selectedTextLayer.curveAmount || 26),
                                    })}
                                    className={cn(
                                        'rounded-lg border px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                                        selectedTextLayer?.curveEnabled
                                            ? 'border-zinc-900 bg-zinc-900 text-white'
                                            : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                                    )}
                                >
                                    Curve
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-500">
                            {selectedTextLayer ? 'Adjust size and curve for the selected text.' : 'Select a text layer below to edit its style.'}
                        </p>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-zinc-500">
                                <span>Text size</span>
                                <span>{selectedTextLayer?.fontSize || draftFontSize}</span>
                            </div>
                            <input
                                type="range"
                                min={6}
                                max={320}
                                step={1}
                                value={selectedTextLayer?.fontSize || draftFontSize}
                                disabled={!selectedTextLayer}
                                onChange={(event) => onUpdateTextLayer?.(selectedTextLayer.id, { fontSize: Number(event.target.value || 24) })}
                                className="h-8 w-full disabled:cursor-not-allowed disabled:opacity-40"
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-zinc-500">
                                <span>Curve intensity</span>
                                <span>{selectedTextLayer?.curveAmount || 0}</span>
                            </div>
                            <input
                                type="range"
                                min={-160}
                                max={160}
                                step={1}
                                value={selectedTextLayer?.curveAmount || 0}
                                disabled={!selectedTextLayer || !selectedTextLayer.curveEnabled}
                                onChange={(event) => onUpdateTextLayer?.(selectedTextLayer.id, { curveAmount: Number(event.target.value || 0), curveEnabled: true })}
                                className="h-8 w-full disabled:cursor-not-allowed disabled:opacity-40"
                            />
                        </div>
                    </div>

                    {activeTextLayers.length > 0 && (
                        <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Added text</p>
                            {activeTextLayers.map((layer) => (
                                <div
                                    key={layer.id}
                                    className={cn(
                                        'space-y-2 rounded-xl border p-2 transition-colors',
                                        selectedObjectId === layer.id ? 'border-zinc-900' : 'border-zinc-200 hover:border-zinc-400'
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onSelectObject?.(layer.id)}
                                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                        >
                                            <span className="truncate text-xs font-medium text-zinc-700">{layer.text}</span>
                                        </button>
                                        <input
                                            type="color"
                                            key={`toolbar-layer-color-${layer.id}`}
                                            defaultValue={layer.fill}
                                            onFocus={() => onSelectObject?.(layer.id)}
                                            onChange={(event) => onUpdateTextLayer?.(layer.id, { fill: event.target.value })}
                                            className="size-7 shrink-0 rounded-full border border-zinc-200 p-0.5"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSelectObject?.(layer.id);
                                                onDeleteSelected?.();
                                            }}
                                            aria-label="Delete text layer"
                                            className="shrink-0 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                                        <input
                                            type="range"
                                            min={6}
                                            max={320}
                                            step={1}
                                            value={layer.fontSize}
                                            onFocus={() => onSelectObject?.(layer.id)}
                                            onChange={(event) => onUpdateTextLayer?.(layer.id, { fontSize: Number(event.target.value || 24) })}
                                            className="h-6 w-full"
                                            aria-label="Text size"
                                        />
                                        <span className="w-6 shrink-0 text-right text-[11px] text-zinc-500">{layer.fontSize}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSelectObject?.(layer.id);
                                                onUpdateTextLayer?.(layer.id, {
                                                    curveEnabled: !layer.curveEnabled,
                                                    curveAmount: layer.curveEnabled ? 0 : (layer.curveAmount || 26),
                                                });
                                            }}
                                            className={cn(
                                                'rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors',
                                                layer.curveEnabled
                                                    ? 'border-zinc-900 bg-zinc-900 text-white'
                                                    : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                                            )}
                                        >
                                            Curve
                                        </button>
                                        <input
                                            type="range"
                                            min={-160}
                                            max={160}
                                            step={1}
                                            value={layer.curveAmount || 0}
                                            disabled={!layer.curveEnabled}
                                            onFocus={() => onSelectObject?.(layer.id)}
                                            onChange={(event) => onUpdateTextLayer?.(layer.id, { curveAmount: Number(event.target.value || 0), curveEnabled: true })}
                                            className="h-6 w-full disabled:cursor-not-allowed disabled:opacity-40"
                                            aria-label="Curve intensity"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ToolDrawer>
            )}

            {openDrawer === 'shapes' && (
                <ToolDrawer coords={drawerCoords} onClose={hideDrawer}>
                    <p className="pr-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Add shape</p>

                    <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-2">
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => onAddShape?.('rect')}
                                    aria-label="Add rectangle"
                                    className="flex h-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
                                >
                                    <Square className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onAddShape?.('circle')}
                                    aria-label="Add circle"
                                    className="flex h-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
                                >
                                    <CircleIcon className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onAddShape?.('triangle')}
                                    aria-label="Add triangle"
                                    className="flex h-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
                                >
                                    <TriangleIcon className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onAddShape?.('star')}
                                    aria-label="Add star"
                                    className="flex h-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
                                >
                                    <StarIcon className="size-4" />
                                </button>
                            </div>
                            <input
                                type="color"
                                key={`toolbar-shape-color-${selectedObjectId || 'new'}`}
                                defaultValue={draftShapeColor}
                                onChange={(event) => onDraftShapeColorChange?.(event.target.value)}
                                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-1"
                            />
                        </div>
                    </div>

                    {activeShapeLayers.length > 0 && (
                        <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Added shapes</p>
                            {activeShapeLayers.map((layer) => (
                                <div
                                    key={layer.id}
                                    className={cn(
                                        'flex items-center gap-2 rounded-xl border p-2 transition-colors',
                                        selectedObjectId === layer.id ? 'border-zinc-900' : 'border-zinc-200 hover:border-zinc-400'
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onSelectObject?.(layer.id)}
                                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                    >
                                        <span className="truncate text-xs font-medium text-zinc-700">{layer.label}</span>
                                    </button>
                                    <span className="shrink-0 text-xs font-semibold text-zinc-900">
                                        ${Number(layer.price || 0).toFixed(2)}
                                    </span>
                                    <input
                                        type="color"
                                        key={`toolbar-shape-layer-color-${layer.id}`}
                                        defaultValue={layer.fill}
                                        onFocus={() => onSelectObject?.(layer.id)}
                                        onChange={(event) => onUpdateShapeLayer?.(layer.id, { fill: event.target.value })}
                                        className="size-7 shrink-0 rounded-full border border-zinc-200 p-0.5"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelectObject?.(layer.id);
                                            onDeleteSelected?.();
                                        }}
                                        aria-label="Delete shape"
                                        className="shrink-0 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </ToolDrawer>
            )}

            {openDrawer === 'arrange' && (
                <ToolDrawer coords={drawerCoords} onClose={hideDrawer}>
                    <p className="pr-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Arrange</p>
                    <p className="mt-1 text-xs text-zinc-500">Select an object on the canvas, then refine the stack here.</p>

                    <div className="mt-3 grid grid-cols-1 gap-2">
                        <button
                            type="button"
                            onClick={() => onBringForward?.()}
                            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900"
                        >
                            <BringToFront className="size-4" />
                            Bring forward
                        </button>
                        <button
                            type="button"
                            onClick={() => onSendBackward?.()}
                            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900"
                        >
                            <SendToBack className="size-4" />
                            Send backward
                        </button>
                        <button
                            type="button"
                            onClick={() => onDeleteSelected?.()}
                            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
                        >
                            <Trash2 className="size-4" />
                            Delete
                        </button>
                    </div>
                </ToolDrawer>
            )}
        </aside>
    );
}
