/**
 * Print-quality check for artwork customers upload.
 *
 * What matters for a sharp print is the *detail per printed inch* (DPI). Pixel count alone isn't
 * enough: an image that was blown up from a small one, or is out of focus, has plenty of pixels
 * but soft edges. So we measure how wide the image's sharpest edges are (in pixels):
 *   crisp artwork or an in-focus photo -> edges ~1-3 px wide,
 *   a 4x upscale or a blurry photo     -> edges ~8+ px wide.
 * The image's *effective* resolution is its pixel size reduced by that softness, and
 *   effective DPI = effective pixels / printed inches
 * which changes live as the customer resizes the image on the garment.
 */

// Print-shop guidance for garment printing (DTG / transfers).
export const PRINT_DPI_GOOD = 150; // prints sharp
export const PRINT_DPI_MIN = 100; // below this it visibly prints blurry / pixelated

// A crisp edge in good artwork or an in-focus photo spans about this many pixels (calibrated on
// real product photos and logos: they measure 1-3 px).
const SHARP_EDGE_WIDTH = 3;
// Very large images are analysed downscaled (the result still reflects detail at this size,
// which is far more than any print area needs).
const MAX_ANALYSIS_SIDE = 2400;
// Fewer measured edges than this (e.g. a flat colour block) and softness can't be judged:
// the pixel size alone decides.
const MIN_EDGES = 40;

/**
 * Measures an image's detail.
 *
 * @param {HTMLImageElement|HTMLCanvasElement} image  Fully loaded image (same-origin or data URL).
 * @returns {{ width: number, height: number, edgeWidth: number|null, effectiveWidth: number, effectiveHeight: number }}
 *   `edgeWidth` is the typical width of the sharpest edges in original pixels (null if unknown).
 */
export function analyzeImage(image) {
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) throw new Error('Image has no size.');

    const scale = Math.min(1, MAX_ANALYSIS_SIDE / Math.max(width, height));
    const columns = Math.max(1, Math.round(width * scale));
    const rows = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = columns;
    canvas.height = rows;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, columns, rows);
    const data = context.getImageData(0, 0, columns, rows).data;

    // Brightness over mid-grey, so transparent artwork (e.g. a black or white logo on a
    // transparent background) still has measurable edges against its surroundings.
    const gray = new Float32Array(columns * rows);
    for (let i = 0; i < gray.length; i += 1) {
        const o = i * 4;
        const alpha = data[o + 3] / 255;
        const luminance = (0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]) / 255;
        gray[i] = luminance * alpha + 0.5 * (1 - alpha);
    }

    const widths = measureEdgeWidths(gray, columns, rows);
    let edgeWidth = null;
    let detail = 1;
    if (widths.length >= MIN_EDGES) {
        widths.sort((a, b) => a - b);
        // The sharpest quarter of edges shows the image's real resolution; soft shadows and
        // out-of-focus backgrounds make up the rest and would otherwise read as "blurry".
        const sharpest = widths[Math.floor(widths.length * 0.25)];
        edgeWidth = sharpest / scale;
        detail = Math.min(1, SHARP_EDGE_WIDTH / edgeWidth);
    }

    return {
        width,
        height,
        edgeWidth,
        effectiveWidth: width * detail,
        effectiveHeight: height * detail,
    };
}

/**
 * Edge widths along image rows (and columns): for each strong edge, the distance between the
 * darkest and brightest points either side of it (the classic Marziliano blur measure).
 */
function measureEdgeWidths(gray, columns, rows) {
    const widths = [];
    const step = Math.max(1, Math.floor(Math.max(columns, rows) / 400)); // ~400 scan lines each way
    const MIN_SLOPE = 0.03; // per pixel, on a 0..1 brightness scale
    const MIN_CONTRAST = 0.2;
    const MAX_WIDTH = 60;
    const NOISE = 0.002;

    const scan = (length, at) => {
        for (let x = 2; x < length - 2; x += 1) {
            const slope = at(x + 1) - at(x - 1);
            const magnitude = Math.abs(slope);
            if (magnitude < MIN_SLOPE * 2) continue;
            // Only the steepest point of each edge.
            if (magnitude < Math.abs(at(x) - at(x - 2)) || magnitude <= Math.abs(at(x + 2) - at(x))) continue;

            const direction = Math.sign(slope);
            let start = x;
            while (start > 0 && x - start < MAX_WIDTH && direction * (at(start) - at(start - 1)) > NOISE) start -= 1;
            let end = x;
            while (end < length - 1 && end - x < MAX_WIDTH && direction * (at(end + 1) - at(end)) > NOISE) end += 1;

            if (direction * (at(end) - at(start)) >= MIN_CONTRAST && end - start < MAX_WIDTH) {
                widths.push(end - start);
            }
            x = end; // continue after this edge
        }
    };

    for (let y = 1; y < rows - 1; y += step) {
        const row = y * columns;
        scan(columns, (x) => gray[row + x]);
    }
    for (let x = 1; x < columns - 1; x += step) {
        scan(rows, (y) => gray[y * columns + x]);
    }

    return widths;
}

/**
 * Print quality of an analysed image printed at `widthIn` x `heightIn` inches.
 *
 * @returns {{ dpi: number, level: 'good'|'fair'|'poor', maxGoodWidthIn: number, maxGoodHeightIn: number }}
 *   `maxGood*` is the largest size it can be printed at and still be sharp (PRINT_DPI_GOOD).
 */
export function printQuality(analysis, widthIn, heightIn) {
    const dpi = Math.min(
        widthIn > 0 ? analysis.effectiveWidth / widthIn : Infinity,
        heightIn > 0 ? analysis.effectiveHeight / heightIn : Infinity,
    );
    const level = dpi >= PRINT_DPI_GOOD ? 'good' : dpi >= PRINT_DPI_MIN ? 'fair' : 'poor';

    return {
        dpi: Number.isFinite(dpi) ? Math.round(dpi) : 0,
        level,
        maxGoodWidthIn: analysis.effectiveWidth / PRINT_DPI_GOOD,
        maxGoodHeightIn: analysis.effectiveHeight / PRINT_DPI_GOOD,
    };
}

export const PRINT_QUALITY_LABELS = {
    good: 'Print ready',
    fair: 'May print slightly soft',
    poor: 'Too low quality to print clearly',
};
