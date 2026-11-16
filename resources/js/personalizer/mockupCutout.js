/**
 * Builds the images for the 3D mockup preview, entirely in the browser:
 *
 *   1. Print the design onto the garment: the design takes on the fabric's folds, shadows and knit
 *      texture, and bends slightly with the folds (needs the garment photo and the design as
 *      separate layers; older saves only have the flat image, which is used as-is).
 *   2. Trim the flat canvas margins down to the product photo.
 *   3. Remove the photo's background with MediaPipe's person/clothes segmentation model.
 *
 * The segmentation engine (~13 MB wasm) and model (~16 MB) are only downloaded when a cut-out is
 * first requested, i.e. on the mockup preview page.
 */
import { ImageSegmenter } from '@mediapipe/tasks-vision';
import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url';
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url';

import { DESIGN_AREAS } from './config';

// Served from public/; Apache-2.0 model from Google MediaPipe (classes: background, hair,
// body-skin, face-skin, clothes, others), so garments without a visible person still work.
const MODEL_PATH = '/vendor/mediapipe/selfie_multiclass_256x256.tflite';

// How far a margin pixel may drift from the corner colour and still count as canvas margin.
const MARGIN_TOLERANCE = 12;

// When a second product photo is used as the back of the body (see backPhotoFits). Measured on
// real photos: a back shot of the same model with different arm positions overlaps the front's
// outline by 0.84 and shows 44% as much face skin (an ear, a bit of cheek); a different product
// overlaps by 0.53; another front-facing shot shows ~95% as much face.
const BACK_PHOTO_MIN_OVERLAP = 0.65;
const BACK_PHOTO_MAX_FACE_RATIO = 0.7;

let segmenterPromise = null;

function getSegmenter() {
    if (!segmenterPromise) {
        segmenterPromise = ImageSegmenter.createFromOptions(
            { wasmLoaderPath, wasmBinaryPath },
            {
                baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'CPU' },
                runningMode: 'IMAGE',
                outputConfidenceMasks: true,
                outputCategoryMask: false,
            },
        ).catch((error) => {
            // Let a later call retry (e.g. after a flaky network) instead of caching the failure.
            segmenterPromise = null;
            throw error;
        });
    }

    return segmenterPromise;
}

export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';

        // Pixels are read back from a canvas, so cross-origin images must be CORS-enabled.
        // Same-origin and data:/blob: URLs never need it.
        try {
            const url = new URL(src, window.location.href);
            if (/^https?:$/.test(url.protocol) && url.origin !== window.location.origin) {
                image.crossOrigin = 'anonymous';
            }
        } catch {
            // Unparseable src: let the browser try it as-is.
        }

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
        image.src = src;
    });
}

function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function imageToCanvas(image, width = image.naturalWidth, height = image.naturalHeight) {
    const canvas = createCanvas(width, height);
    canvas.getContext('2d', { willReadFrequently: true }).drawImage(image, 0, 0, width, height);
    return canvas;
}

const pixelsOf = (canvas) => canvas.getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, canvas.width, canvas.height);

function cropCanvas(canvas, bounds) {
    const cropped = createCanvas(bounds.width, bounds.height);
    cropped.getContext('2d', { willReadFrequently: true })
        .drawImage(canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);
    return cropped;
}

/** Bounds of the product photo inside the snapshot, i.e. without the flat canvas margins. */
function findPhotoBounds(canvas) {
    const { width, height } = canvas;
    const { data } = pixelsOf(canvas);
    const ref = [data[0], data[1], data[2]];
    const isMargin = (offset) => (
        Math.abs(data[offset] - ref[0]) <= MARGIN_TOLERANCE
        && Math.abs(data[offset + 1] - ref[1]) <= MARGIN_TOLERANCE
        && Math.abs(data[offset + 2] - ref[2]) <= MARGIN_TOLERANCE
    );
    const columnIsMargin = (x) => {
        for (let y = 0; y < height; y += 2) {
            if (!isMargin((y * width + x) * 4)) return false;
        }
        return true;
    };
    const rowIsMargin = (y) => {
        for (let x = 0; x < width; x += 2) {
            if (!isMargin((y * width + x) * 4)) return false;
        }
        return true;
    };

    let left = 0;
    while (left < width - 1 && columnIsMargin(left)) left += 1;
    let right = width - 1;
    while (right > left && columnIsMargin(right)) right -= 1;
    let top = 0;
    while (top < height - 1 && rowIsMargin(top)) top += 1;
    let bottom = height - 1;
    while (bottom > top && rowIsMargin(bottom)) bottom -= 1;

    const bounds = { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };

    // Nothing sensible found (blank or unusual image): keep the whole snapshot.
    if (bounds.width < width * 0.1 || bounds.height < height * 0.1) {
        return { x: 0, y: 0, width, height };
    }

    return bounds;
}

/** Separable box blur with clamped edges; two passes approximate a Gaussian. */
function boxBlur(source, width, height, radius) {
    const temp = new Float32Array(source.length);
    const output = new Float32Array(source.length);
    const size = radius * 2 + 1;
    const clampIndex = (value, max) => (value < 0 ? 0 : value > max ? max : value);

    for (let y = 0; y < height; y += 1) {
        const row = y * width;
        let sum = 0;
        for (let k = -radius; k <= radius; k += 1) sum += source[row + clampIndex(k, width - 1)];
        for (let x = 0; x < width; x += 1) {
            temp[row + x] = sum / size;
            sum += source[row + clampIndex(x + radius + 1, width - 1)] - source[row + clampIndex(x - radius, width - 1)];
        }
    }

    for (let x = 0; x < width; x += 1) {
        let sum = 0;
        for (let k = -radius; k <= radius; k += 1) sum += temp[clampIndex(k, height - 1) * width + x];
        for (let y = 0; y < height; y += 1) {
            output[y * width + x] = sum / size;
            sum += temp[clampIndex(y + radius + 1, height - 1) * width + x] - temp[clampIndex(y - radius, height - 1) * width + x];
        }
    }

    return output;
}

const blur = (source, width, height, radius) => boxBlur(boxBlur(source, width, height, radius), width, height, radius);
const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);

/**
 * Composites the design onto the garment photo so it reads as printed rather than pasted:
 * - shading: the fabric's folds and shadows darken/lighten the ink,
 * - grain: the knit texture shows through the ink,
 * - displacement: the design bends slightly with the folds,
 * - ink: a touch of the fabric colour shows through.
 */
function printOnFabric(baseCanvas, designCanvas) {
    const { width, height } = baseCanvas;
    const base = pixelsOf(baseCanvas);
    const design = pixelsOf(designCanvas).data;
    const output = new ImageData(new Uint8ClampedArray(base.data), width, height);
    const out = output.data;

    const luminance = new Float32Array(width * height);
    for (let i = 0; i < luminance.length; i += 1) {
        const o = i * 4;
        luminance[i] = (0.299 * base.data[o] + 0.587 * base.data[o + 1] + 0.114 * base.data[o + 2]) / 255;
    }

    const foldRadius = Math.max(2, Math.round(width * 0.006));
    const folds = blur(luminance, width, height, foldRadius); // folds/shadows without the knit
    const broad = blur(luminance, width, height, foldRadius * 3); // drives the displacement

    // Brightness of the fabric under the design: shading is relative to it, so flat fabric leaves
    // the ink colours unchanged.
    let weighted = 0;
    let weights = 0;
    for (let i = 0; i < folds.length; i += 1) {
        const alpha = design[i * 4 + 3];
        if (alpha) {
            weighted += folds[i] * alpha;
            weights += alpha;
        }
    }
    if (!weights) return output; // nothing designed on this view
    const reference = weighted / weights;

    const displacement = width * 0.012;
    const sample = (x, y, channel) => {
        // Bilinear sample of the design layer.
        const x0 = clamp(Math.floor(x), 0, width - 1);
        const y0 = clamp(Math.floor(y), 0, height - 1);
        const x1 = Math.min(x0 + 1, width - 1);
        const y1 = Math.min(y0 + 1, height - 1);
        const fx = clamp(x - x0, 0, 1);
        const fy = clamp(y - y0, 0, 1);
        const at = (px, py) => design[(py * width + px) * 4 + channel];
        const top = at(x0, y0) + (at(x1, y0) - at(x0, y0)) * fx;
        const bottom = at(x0, y1) + (at(x1, y1) - at(x0, y1)) * fx;
        return top + (bottom - top) * fy;
    };

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const i = y * width + x;
            const shift = (broad[i] - reference) * displacement;
            const sx = x - shift;
            const sy = y - shift;
            const alpha = (sample(sx, sy, 3) / 255) * 0.94;
            if (alpha <= 0.002) continue;

            const shade = clamp(folds[i] / reference, 0.45, 1.25);
            const grain = (luminance[i] - folds[i]) * 255 * 0.9;
            const o = i * 4;
            for (let c = 0; c < 3; c += 1) {
                const ink = clamp(sample(sx, sy, c) * shade + grain, 0, 255);
                out[o + c] = out[o + c] * (1 - alpha) + ink * alpha;
            }
        }
    }

    return output;
}

/**
 * Prepares one view: the product photo (with the design printed on, when layers are available)
 * cropped to the photo, plus the image the background is detected from.
 *
 * @param {{view: string, baseSrc?: string, designSrc?: string, flatSrc?: string}} source
 */
export async function composeView({ view, baseSrc, designSrc, flatSrc }) {
    if (baseSrc && designSrc) {
        const [baseImage, designImage] = await Promise.all([loadImage(baseSrc), loadImage(designSrc)]);
        const base = imageToCanvas(baseImage);
        const printed = createCanvas(base.width, base.height);
        printed.getContext('2d').putImageData(printOnFabric(base, imageToCanvas(designImage, base.width, base.height)), 0, 0);

        const bounds = findPhotoBounds(base);
        // The background is detected on the plain garment photo, so the design can't confuse it.
        return {
            photo: cropCanvas(printed, bounds),
            segmentationSource: cropCanvas(base, bounds),
            designRect: null,
            garment: base, // full-size garment photo without the design
            bounds,
            size: { width: base.width, height: base.height },
        };
    }

    const flat = imageToCanvas(await loadImage(flatSrc));
    const bounds = findPhotoBounds(flat);
    const area = DESIGN_AREAS[view] || DESIGN_AREAS.front;
    const photo = cropCanvas(flat, bounds);

    return {
        photo,
        segmentationSource: photo,
        garment: null, // flat image: no design-free version exists
        bounds,
        size: { width: flat.width, height: flat.height },
        // Print area in crop coordinates: the design is baked into this image, so holes the model
        // punches inside it (e.g. a white logo scored as background) are filled back in.
        designRect: {
            x: Math.round(area.left * flat.width - bounds.x),
            y: Math.round(area.top * flat.height - bounds.y),
            width: Math.round(area.width * flat.width),
            height: Math.round(area.height * flat.height),
        },
    };
}

/**
 * Keeps enclosed "holes" inside the print area opaque: anything there that isn't connected to the
 * image edge through background is part of the garment/design and must not be cut out.
 */
function keepEnclosedDesignPixels(alpha, width, height, rect) {
    const outside = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0;
    let tail = 0;

    const visit = (index) => {
        if (!outside[index] && alpha[index] < 128) {
            outside[index] = 1;
            queue[tail] = index;
            tail += 1;
        }
    };

    for (let x = 0; x < width; x += 1) {
        visit(x);
        visit((height - 1) * width + x);
    }
    for (let y = 0; y < height; y += 1) {
        visit(y * width);
        visit(y * width + width - 1);
    }

    while (head < tail) {
        const index = queue[head];
        head += 1;
        const x = index % width;
        if (x > 0) visit(index - 1);
        if (x < width - 1) visit(index + 1);
        if (index >= width) visit(index - width);
        if (index < width * (height - 1)) visit(index + width);
    }

    const x0 = Math.max(0, rect.x);
    const y0 = Math.max(0, rect.y);
    const x1 = Math.min(width, rect.x + rect.width);
    const y1 = Math.min(height, rect.y + rect.height);

    for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
            const index = y * width + x;
            if (!outside[index]) alpha[index] = 255;
        }
    }
}

const smoothstep = (edge0, edge1, value) => {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
};

/** Scales a low-resolution mask canvas up to `width` x `height` with smoothing. */
function scaleUp(maskCanvas, width, height) {
    const scaled = createCanvas(width, height);
    const context = scaled.getContext('2d', { willReadFrequently: true });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(maskCanvas, 0, 0, width, height);
    return scaled;
}

/**
 * Makes the view's background transparent and trims it to the subject's width.
 *
 * Returns
 * - `cutout`: the photo (design included) with a transparent background,
 * - `parts`: same size; red = face skin, green = hair (used to turn a face into the back of a head),
 * - `trim`: where `cutout` sits inside the cropped photo,
 * - `faceShare`: fraction of the subject that is face skin (a back view shows little or none).
 */
export async function cutOutBackground({ photo, segmentationSource, designRect }) {
    const segmenter = await getSegmenter();
    const result = segmenter.segment(segmentationSource);

    try {
        const labels = segmenter.getLabels();
        const masks = result.confidenceMasks || [];
        const maskFor = (label, fallbackIndex) => masks[labels.indexOf(label)] || masks[fallbackIndex];
        const background = maskFor('background', 0);
        if (!background) throw new Error('Segmentation returned no mask.');

        const { width: maskWidth, height: maskHeight } = background;
        const backgroundScores = background.getAsFloat32Array();
        const faceScores = maskFor('face-skin', 3)?.getAsFloat32Array();
        const hairScores = maskFor('hair', 1)?.getAsFloat32Array();

        // Masks -> images at mask resolution. Alpha edges are tightened a little to avoid a halo.
        const alphaMask = createCanvas(maskWidth, maskHeight);
        const partsMask = createCanvas(maskWidth, maskHeight);
        const alphaPixels = alphaMask.getContext('2d').createImageData(maskWidth, maskHeight);
        const partPixels = partsMask.getContext('2d').createImageData(maskWidth, maskHeight);
        let bodyCount = 0;
        let faceCount = 0;
        for (let i = 0; i < backgroundScores.length; i += 1) {
            alphaPixels.data[i * 4 + 3] = Math.round(smoothstep(0.4, 0.75, 1 - backgroundScores[i]) * 255);
            partPixels.data[i * 4] = Math.round((faceScores?.[i] || 0) * 255);
            partPixels.data[i * 4 + 1] = Math.round((hairScores?.[i] || 0) * 255);
            partPixels.data[i * 4 + 3] = 255;
            if (backgroundScores[i] < 0.5) {
                bodyCount += 1;
                if ((faceScores?.[i] || 0) > 0.5) faceCount += 1;
            }
        }
        alphaMask.getContext('2d').putImageData(alphaPixels, 0, 0);
        partsMask.getContext('2d').putImageData(partPixels, 0, 0);

        const { width, height } = photo;
        const scaledAlpha = pixelsOf(scaleUp(alphaMask, width, height)).data;
        const alpha = new Uint8ClampedArray(width * height);
        for (let i = 0; i < alpha.length; i += 1) alpha[i] = scaledAlpha[i * 4 + 3];
        if (designRect) keepEnclosedDesignPixels(alpha, width, height, designRect);

        const pixels = pixelsOf(photo);
        for (let i = 0; i < alpha.length; i += 1) pixels.data[i * 4 + 3] = alpha[i];
        const full = createCanvas(width, height);
        full.getContext('2d', { willReadFrequently: true }).putImageData(pixels, 0, 0);
        const parts = scaleUp(partsMask, width, height);

        // Trim empty space left/right of the subject (full height is kept so the front and back
        // views stay at the same scale).
        let minX = width;
        let maxX = -1;
        for (let y = 0; y < height; y += 2) {
            const row = y * width;
            for (let x = 0; x < minX; x += 1) {
                if (alpha[row + x] > 24) { minX = x; break; }
            }
            for (let x = width - 1; x > maxX; x -= 1) {
                if (alpha[row + x] > 24) { maxX = x; break; }
            }
        }

        const padding = Math.round(width * 0.02);
        const left = maxX < minX ? 0 : Math.max(0, minX - padding);
        const right = maxX < minX ? width : Math.min(width, maxX + padding + 1);
        const trim = { x: left, y: 0, width: right - left, height };

        return {
            cutout: cropCanvas(full, trim),
            parts: cropCanvas(parts, trim),
            trim,
            faceShare: bodyCount ? faceCount / bodyCount : 0,
        };
    } finally {
        result.close?.();
    }
}

function mirrorCanvas(source) {
    const canvas = createCanvas(source.width, source.height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.translate(source.width, 0);
    context.scale(-1, 1);
    context.drawImage(source, 0, 0);
    return canvas;
}

/** Opacity of `source` sampled onto a grid `scale` times its size (optionally mirrored). */
function alphaGrid(source, scale, mirror = false) {
    const columns = Math.max(1, Math.round(source.width * scale));
    const rows = Math.max(1, Math.round(source.height * scale));
    const canvas = createCanvas(columns, rows);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (mirror) {
        context.translate(columns, 0);
        context.scale(-1, 1);
    }
    context.drawImage(source, 0, 0, columns, rows);
    const data = context.getImageData(0, 0, columns, rows).data;
    const inside = new Uint8Array(columns * rows);
    for (let i = 0; i < inside.length; i += 1) inside[i] = data[i * 4 + 3] > 127 ? 1 : 0;
    return { inside, columns, rows };
}

/**
 * Lines the back photo up behind the front one and says how well it fits.
 *
 * The back photo is kept at its true scale (both photos are placed on the editor canvas the same
 * way) and slid sideways / slightly up and down until its outline overlaps the front's (mirrored,
 * i.e. as seen from behind) as much as possible. Returns it drawn in the front cut-out's frame, in
 * "seen from behind" orientation, plus that best overlap (0..1, intersection over union).
 *
 * @param {object} front  Front composeView() result.   @param {object} frontCut  Its cutOutBackground().
 * @param {object} back   Back composeView() result.    @param {object} backCut   Its cutOutBackground().
 * @returns {{ placed: HTMLCanvasElement, overlap: number }}
 */
export function placeBackPhoto({ front, frontCut, back, backCut }) {
    const { width, height } = frontCut.cutout;
    const canvasWidth = front.size.width;

    // Starting guess: same position on the canvas, mirrored.
    const frontLeft = front.bounds.x + frontCut.trim.x;
    const frameLeft = canvasWidth - frontLeft - width;
    const startX = back.bounds.x + backCut.trim.x - frameLeft;
    const startY = back.bounds.y - front.bounds.y;

    // Search at low resolution: ~96 rows.
    const scale = 96 / height;
    const frontGrid = alphaGrid(frontCut.cutout, scale, true);
    const backGrid = alphaGrid(backCut.cutout, scale);
    const frontArea = frontGrid.inside.reduce((sum, value) => sum + value, 0);
    const backArea = backGrid.inside.reduce((sum, value) => sum + value, 0);

    const overlapAt = (offsetX, offsetY) => {
        let both = 0;
        for (let y = 0; y < backGrid.rows; y += 1) {
            const fy = y + offsetY;
            if (fy < 0 || fy >= frontGrid.rows) continue;
            for (let x = 0; x < backGrid.columns; x += 1) {
                const fx = x + offsetX;
                if (fx < 0 || fx >= frontGrid.columns) continue;
                if (backGrid.inside[y * backGrid.columns + x] && frontGrid.inside[fy * frontGrid.columns + fx]) both += 1;
            }
        }
        const either = frontArea + backArea - both;
        return either > 0 ? both / either : 0;
    };

    const baseX = Math.round(startX * scale);
    const baseY = Math.round(startY * scale);
    const reachX = Math.round(frontGrid.columns * 0.3);
    const reachY = Math.round(frontGrid.rows * 0.06);
    let best = { overlap: -1, x: baseX, y: baseY };
    for (let dy = -reachY; dy <= reachY; dy += 1) {
        for (let dx = -reachX; dx <= reachX; dx += 1) {
            const overlap = overlapAt(baseX + dx, baseY + dy);
            if (overlap > best.overlap) best = { overlap, x: baseX + dx, y: baseY + dy };
        }
    }

    const placed = createCanvas(width, height);
    placed.getContext('2d').drawImage(backCut.cutout, Math.round(best.x / scale), Math.round(best.y / scale));
    return { placed, overlap: Math.max(0, best.overlap) };
}

/**
 * Whether a back photo is good enough for the back of the body:
 * - its outline (placed by placeBackPhoto) must match the front's — the same figure, though the
 *   arms may differ; other products or unrelated shots fall well below this, and
 * - it must actually be taken from behind: a second front-facing shot shows about as much face
 *   as the front photo (a real back shot shows at most an ear and a bit of cheek).
 */
export function backPhotoFits({ overlap, frontCut, backCut }) {
    const showsFace = frontCut.faceShare > 0.01 && backCut.faceShare > frontCut.faceShare * BACK_PHOTO_MAX_FACE_RATIO;
    return overlap >= BACK_PHOTO_MIN_OVERLAP && !showsFace;
}

/**
 * A back view made from the front photo, for when there's no usable back photo: the front garment
 * mirrored (as if seen from behind, so it lines up with the body's outline), with the back design
 * printed on it if there is one, and the face replaced by hair so it reads as the back of the head.
 *
 * @param {object} composed  The front view's composeView() result.
 * @param {object} cut  The front view's cutOutBackground() result.
 * @param {string} [designSrc]  The back view's design layer, if any.
 */
export async function buildStandInBack({ composed, cut, designSrc }) {
    const { width, height } = cut.cutout;
    // Flat (older) images have the front design baked in; mirroring would make it unreadable, so
    // they're used the right way round.
    const mirror = Boolean(composed.garment);

    let colors;
    if (mirror) {
        const garment = composed.garment;
        let source = mirrorCanvas(garment);
        if (designSrc) {
            const design = imageToCanvas(await loadImage(designSrc), garment.width, garment.height);
            const printed = createCanvas(garment.width, garment.height);
            printed.getContext('2d').putImageData(printOnFabric(source, design), 0, 0);
            source = printed;
        }
        // The front cut-out's rectangle within the full photo, mirrored.
        const x = composed.bounds.x + cut.trim.x;
        colors = cropCanvas(source, { x: garment.width - x - width, y: composed.bounds.y, width, height });
    } else {
        colors = cropCanvas(cut.cutout, { x: 0, y: 0, width, height });
    }

    const alpha = pixelsOf(mirror ? mirrorCanvas(cut.cutout) : cut.cutout).data;
    const parts = pixelsOf(mirror ? mirrorCanvas(cut.parts) : cut.parts).data;
    const context = colors.getContext('2d', { willReadFrequently: true });
    const output = context.getImageData(0, 0, width, height);
    const out = output.data;

    // Hair colour from confidently-hair pixels; a dark brown if the model found none.
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;
    let faceTop = height;
    let faceBottom = -1;
    for (let i = 0; i < width * height; i += 1) {
        const o = i * 4;
        if (parts[o + 1] > 160 && alpha[o + 3] > 200) {
            red += out[o];
            green += out[o + 1];
            blue += out[o + 2];
            count += 1;
        }
        if (parts[o] > 128) {
            const y = Math.floor(i / width);
            if (y < faceTop) faceTop = y;
            if (y > faceBottom) faceBottom = y;
        }
    }
    const hair = count > 50 ? [red / count, green / count, blue / count] : [42, 33, 28];
    const faceHeight = Math.max(1, faceBottom - faceTop);

    for (let i = 0; i < width * height; i += 1) {
        const o = i * 4;
        const face = smoothstep(90, 170, parts[o]);
        if (face > 0) {
            const x = i % width;
            const y = Math.floor(i / width);
            // Slightly darker towards the nape, with a fine grain so it doesn't look painted flat.
            const shade = 1 - 0.2 * clamp((y - faceTop) / faceHeight, 0, 1);
            const grain = 0.9 + 0.2 * ((((x * 73856093) ^ (y * 19349663)) & 255) / 255);
            for (let c = 0; c < 3; c += 1) {
                out[o + c] = out[o + c] * (1 - face) + hair[c] * shade * grain * face;
            }
        }
        out[o + 3] = alpha[o + 3];
    }
    context.putImageData(output, 0, 0);

    return colors;
}

export function canvasToObjectUrl(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(URL.createObjectURL(blob));
            else reject(new Error('Unable to export image.'));
        }, 'image/png');
    });
}
