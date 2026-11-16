import { useCallback, useEffect, useRef, useState } from 'react';
import { LoaderCircle, Pause, Play, Rotate3d } from 'lucide-react';

import { cn } from '@/lib/utils';

import { loadMockupLayers } from '../mockupLayerStore';

const DRAG_DEGREES_PER_PX = 0.45;
const AUTO_SPIN_DEGREES_PER_MS = 0.03; // 30° per second
const MAX_FLING_DEGREES_PER_MS = 1.2;
const KEY_STEP_DEGREES = 30;
const VIEWS = ['front', 'back'];

const normalize = (angle) => ((angle % 360) + 360) % 360;
const facingOf = (angle) => {
    const normalized = normalize(angle);
    return normalized > 90 && normalized < 270 ? 'back' : 'front';
};
// The angle closest to `current` that shows `base` (0 = front, 180 = back), so snapping never spins
// the long way round.
const nearestAngle = (current, base) => base + Math.round((current - base) / 360) * 360;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Builds both sides: first a quick flat preview (design printed on the fabric, cropped to the
 * photo), then the background-free cut-outs the 3D model is made from.
 */
function useMockupSides({ frontImageUrl, backImageUrl, layersKey }) {
    const [sides, setSides] = useState({ previews: {}, cutouts: null, status: 'loading' });

    useEffect(() => {
        let cancelled = false;
        const objectUrls = [];
        const track = (url) => {
            objectUrls.push(url);
            return url;
        };
        setSides({ previews: {}, cutouts: null, status: 'loading' });

        (async () => {
            try {
                const [lib, layers] = await Promise.all([
                    import('../mockupCutout'),
                    loadMockupLayers(layersKey).catch(() => null),
                ]);

                // Prefer the separate garment/design layers (design printed into the fabric); older
                // saves only have the flat images.
                const sources = {};
                VIEWS.forEach((view) => {
                    const layer = layers?.[view];
                    const flatSrc = view === 'front' ? frontImageUrl : backImageUrl;
                    if (layer) {
                        sources[view] = {
                            view,
                            baseSrc: track(URL.createObjectURL(layer.base)),
                            designSrc: track(URL.createObjectURL(layer.design)),
                        };
                    } else if (flatSrc) {
                        sources[view] = { view, flatSrc };
                    }
                });
                // No separate back image: show the front on both sides rather than nothing.
                sources.back ||= sources.front;
                if (!sources.front) throw new Error('No mockup image to show.');

                const composed = {};
                const previews = {};
                for (const view of VIEWS) {
                    composed[view] = sources[view] === sources.front && view === 'back'
                        ? composed.front
                        : await lib.composeView(sources[view]);
                    previews[view] = view === 'back' && composed.back === composed.front
                        ? previews.front
                        : track(await lib.canvasToObjectUrl(composed[view].photo));
                }
                if (cancelled) return;
                setSides({ previews, cutouts: null, status: 'loading' });

                const backFromFront = composed.back === composed.front;
                const front = await lib.cutOutBackground(composed.front);

                // A back photo is only used when it shows the same pose from behind. Anything else
                // (a side shot, another product) would break the body apart while turning, so the
                // back is then made from the front garment instead, with the back design on it.
                let back = null;
                if (!backFromFront) {
                    const backCut = await lib.cutOutBackground(composed.back);
                    const { placed, overlap } = lib.placeBackPhoto({
                        front: composed.front,
                        frontCut: front,
                        back: composed.back,
                        backCut,
                    });
                    if (lib.backPhotoFits({ overlap, frontCut: front, backCut })) back = placed;
                }
                back ||= await lib.buildStandInBack({
                    composed: composed.front,
                    cut: front,
                    designSrc: backFromFront ? undefined : sources.back.designSrc,
                });

                if (!cancelled) setSides({ previews, cutouts: { front: front.cutout, back }, status: 'ready' });
            } catch (error) {
                // Keep whatever previews exist; the viewer falls back to flipping flat photos.
                console.warn('Unable to prepare the 3D mockup:', error);
                if (!cancelled) setSides((current) => ({ ...current, status: 'failed' }));
            }
        })();

        return () => {
            cancelled = true;
            objectUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [frontImageUrl, backImageUrl, layersKey]);

    return sides;
}

/** Drag-to-spin 360° preview: the model as a rounded 3D body with the design printed on. */
export default function Mockup360Viewer({ frontImageUrl, backImageUrl, layersKey }) {
    const sides = useMockupSides({ frontImageUrl, backImageUrl, layersKey });

    const [autoSpin, setAutoSpin] = useState(
        () => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    );
    const [facing, setFacing] = useState('front');
    const [sceneState, setSceneState] = useState('pending'); // pending | ready | failed

    const sceneContainerRef = useRef(null);
    const sceneRef = useRef(null);
    const shadowRef = useRef(null);

    const angleRef = useRef(0);
    const velocityRef = useRef(0);
    const targetRef = useRef(null);
    const dragRef = useRef(null);
    const autoSpinRef = useRef(autoSpin);
    const facingRef = useRef('front');

    useEffect(() => {
        autoSpinRef.current = autoSpin;
    }, [autoSpin]);

    // Pushes the current angle to the 3D scene (no React render per frame).
    const paint = useCallback(() => {
        const angle = angleRef.current;
        sceneRef.current?.setAngle((angle * Math.PI) / 180);

        if (shadowRef.current) {
            const towardCamera = Math.abs(Math.cos((angle * Math.PI) / 180));
            shadowRef.current.style.transform = `translateX(-50%) scaleX(${(0.8 + 0.2 * towardCamera).toFixed(3)})`;
        }

        const nextFacing = facingOf(angle);
        if (nextFacing !== facingRef.current) {
            facingRef.current = nextFacing;
            setFacing(nextFacing);
        }
    }, []);

    // Build the 3D scene once both cut-outs are ready.
    useEffect(() => {
        if (!sides.cutouts || !sceneContainerRef.current) return undefined;

        let disposed = false;
        let scene = null;
        let observer = null;

        import('../mockupScene')
            .then(({ createMockupScene }) => {
                if (disposed) return;
                scene = createMockupScene(sceneContainerRef.current, sides.cutouts);
                sceneRef.current = scene;
                observer = new ResizeObserver(() => scene.resize());
                observer.observe(sceneContainerRef.current);
                paint();
                setSceneState('ready');
            })
            .catch((error) => {
                console.warn('3D preview unavailable, showing flat photos:', error);
                if (!disposed) setSceneState('failed');
            });

        return () => {
            disposed = true;
            observer?.disconnect();
            scene?.dispose();
            sceneRef.current = null;
        };
    }, [sides.cutouts, paint]);

    useEffect(() => {
        let frame;
        let last = performance.now();

        const tick = (now) => {
            const elapsed = Math.min(now - last, 64);
            last = now;
            let moved = false;

            if (!dragRef.current) {
                if (targetRef.current !== null) {
                    // Ease towards a snapped side / keyboard step.
                    const remaining = targetRef.current - angleRef.current;
                    if (Math.abs(remaining) < 0.2) {
                        angleRef.current = targetRef.current;
                        targetRef.current = null;
                    } else {
                        angleRef.current += remaining * Math.min(1, elapsed * 0.01);
                    }
                    moved = true;
                } else if (Math.abs(velocityRef.current) > 0.005) {
                    // Momentum after a fling.
                    angleRef.current += velocityRef.current * elapsed;
                    velocityRef.current *= 0.996 ** elapsed;
                    moved = true;
                } else if (autoSpinRef.current) {
                    angleRef.current += AUTO_SPIN_DEGREES_PER_MS * elapsed;
                    moved = true;
                }
            }

            if (moved) paint();
            frame = requestAnimationFrame(tick);
        };

        paint();
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [paint]);

    const takeControl = () => {
        setAutoSpin(false);
        velocityRef.current = 0;
    };

    const showSide = (side) => {
        takeControl();
        targetRef.current = nearestAngle(angleRef.current, side === 'back' ? 180 : 0);
    };

    const rotateBy = (degrees) => {
        takeControl();
        targetRef.current = (targetRef.current ?? angleRef.current) + degrees;
    };

    const handlePointerDown = (event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        takeControl();
        targetRef.current = null;
        dragRef.current = { x: event.clientX, time: event.timeStamp };
    };

    const handlePointerMove = (event) => {
        const drag = dragRef.current;
        if (!drag) return;

        const delta = (event.clientX - drag.x) * DRAG_DEGREES_PER_PX;
        const elapsed = Math.max(1, event.timeStamp - drag.time);
        angleRef.current += delta;
        velocityRef.current = clamp(delta / elapsed, -MAX_FLING_DEGREES_PER_MS, MAX_FLING_DEGREES_PER_MS);
        dragRef.current = { x: event.clientX, time: event.timeStamp };
        paint();
    };

    const endDrag = (event) => {
        if (!dragRef.current) return;
        // Holding still before letting go means "stop here", not a fling.
        if (event.timeStamp - dragRef.current.time > 80) velocityRef.current = 0;
        dragRef.current = null;
    };

    const handleKeyDown = (event) => {
        const actions = {
            ArrowLeft: () => rotateBy(-KEY_STEP_DEGREES),
            ArrowRight: () => rotateBy(KEY_STEP_DEGREES),
            Home: () => showSide('front'),
            End: () => showSide('back'),
        };
        const action = actions[event.key];
        if (!action) return;
        event.preventDefault();
        action();
    };

    const show3d = sceneState === 'ready';
    const isPreparing = !show3d && sides.status === 'loading';
    const flatPreview = sides.previews[facing] || sides.previews.front;

    return (
        <section className="overflow-hidden rounded-2xl border border-zinc-200">
            <div
                tabIndex={0}
                aria-roledescription="360 degree viewer"
                aria-label={`360° preview of your design, showing the ${facing}. Drag, or use the left and right arrow keys, to rotate.`}
                className="relative h-[min(70vh,600px)] min-h-[380px] cursor-grab touch-pan-y select-none bg-[radial-gradient(circle_at_50%_38%,#ffffff_0%,#f4f4f5_55%,#e4e4e7_100%)] outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onLostPointerCapture={endDrag}
                onKeyDown={handleKeyDown}
            >
                {/* Floor shadow. */}
                <div
                    ref={shadowRef}
                    className="pointer-events-none absolute bottom-[5%] left-1/2 h-6 w-[30%] max-w-[220px] rounded-[50%] bg-black/25 blur-lg"
                    style={{ transform: 'translateX(-50%)' }}
                />

                {/* WebGL canvas goes here once the cut-outs are ready. */}
                <div ref={sceneContainerRef} className={cn('absolute inset-0', !show3d && 'invisible')} />

                {/* Flat photo while the 3D model is prepared, or if WebGL/segmentation is unavailable. */}
                {!show3d && flatPreview ? (
                    <img
                        src={flatPreview}
                        alt={`${facing === 'back' ? 'Back' : 'Front'} of your design`}
                        draggable={false}
                        className={cn(
                            'absolute inset-x-0 bottom-[7%] top-[5%] mx-auto h-[88%] w-auto max-w-full object-contain transition-opacity duration-500',
                            isPreparing && 'opacity-70',
                        )}
                    />
                ) : null}

                {isPreparing ? (
                    <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm">
                        <LoaderCircle className="size-3.5 animate-spin" />
                        Preparing 3D preview…
                    </span>
                ) : !show3d && (sides.status === 'failed' || sceneState === 'failed') ? (
                    <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-500 shadow-sm">
                        3D preview unavailable, showing the photo
                    </span>
                ) : null}

                <span className="pointer-events-none absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-zinc-600 backdrop-blur">
                    <Rotate3d className="size-3.5" />
                    Drag to rotate 360°
                </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-white px-4 py-3">
                <div role="group" aria-label="Show side" className="inline-flex rounded-full border border-zinc-200 p-1">
                    {VIEWS.map((side) => (
                        <button
                            key={side}
                            type="button"
                            onClick={() => showSide(side)}
                            aria-pressed={facing === side}
                            className={cn(
                                'rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                                facing === side ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-950',
                            )}
                        >
                            {side}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setAutoSpin((current) => !current)}
                    aria-pressed={autoSpin}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-950"
                >
                    {autoSpin ? <Pause className="size-4" /> : <Play className="size-4" />}
                    {autoSpin ? 'Pause' : 'Auto-rotate'}
                </button>
            </div>
        </section>
    );
}
