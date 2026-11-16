/**
 * WebGL scene for the 360° mockup: turns the front and back photos into one rounded body.
 *
 * Each half is a relief mesh built from the subject's outline. Its depth rounds off near the edge
 * and is flat in the middle of each part (torso, head, arm), so faces and prints keep their
 * proportions while the sides wrap round like a body. Both halves share the front outline (the
 * back one mirrored), so they meet exactly along the edge and the body never comes apart.
 *
 * Facing front or back the photo is shown exactly as shot; lighting only fades in as it turns.
 */
import {
    CanvasTexture,
    FrontSide,
    Group,
    Mesh,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    ShaderMaterial,
    Vector3,
    WebGLRenderer,
} from 'three';

// Vertices along the image height; enough for smooth curvature, cheap to build and draw.
const GRID_ROWS = 220;
// Half-depth of each part as a fraction of its half-width (a torso is about half as deep as wide).
const DEPTH_RATIO = 0.55;
// Fraction of each part's half-width over which the edge rounds off; the middle stays flat.
const ROUNDING = 0.5;
// Cells along the outline kept at zero depth so the two halves close with no seam.
const RIM_CELLS = 2;
// Narrow lens: little perspective distortion of faces and prints.
const CAMERA_FOV = 15;

const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Colours are passed through untouched (no colour-space conversion). `shading` is 0 facing front
// or back (the photo exactly as shot) and 1 side-on.
const fragmentShader = /* glsl */ `
    uniform sampler2D map;
    uniform vec3 lightDirection;
    uniform float shading;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
        vec4 texel = texture2D(map, vUv);
        float alpha = smoothstep(0.35, 0.65, texel.a);
        if (alpha < 0.02) discard;

        vec3 color = texel.a > 0.0 ? texel.rgb / texel.a : texel.rgb; // texture is premultiplied
        float diffuse = max(dot(normalize(vNormal), lightDirection), 0.0);
        float light = mix(1.0, 0.6 + 0.45 * diffuse, shading);

        gl_FragColor = vec4(color * light, alpha);
    }
`;

function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

/**
 * Replaces the colour of every pixel that isn't (nearly) opaque with nearby opaque colours
 * ("pull-push" fill through a halving pyramid). Removes the studio-backdrop tint from soft edges
 * and gives every pixel inside the outline a colour, even where the back photo doesn't reach.
 */
function bleedOpaqueColors(canvas) {
    const { width, height } = canvas;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const pixels = context.getImageData(0, 0, width, height);
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] >= 230 ? 255 : 0;
    context.putImageData(pixels, 0, 0);

    const levels = [canvas];
    while (levels.at(-1).width > 2 || levels.at(-1).height > 2) {
        const previous = levels.at(-1);
        const next = createCanvas(Math.ceil(previous.width / 2), Math.ceil(previous.height / 2));
        const nextContext = next.getContext('2d');
        nextContext.imageSmoothingQuality = 'high';
        nextContext.drawImage(previous, 0, 0, next.width, next.height);
        levels.push(next);
    }

    for (let i = levels.length - 2; i >= 0; i -= 1) {
        const levelContext = levels[i].getContext('2d', { willReadFrequently: true });
        levelContext.globalCompositeOperation = 'destination-over';
        levelContext.drawImage(levels[i + 1], 0, 0, levels[i].width, levels[i].height);
        levelContext.globalCompositeOperation = 'source-over';
    }

    return canvas;
}

/** Texture for one half: colours from `colorSource` (stretched to fit), outline from `outline`. */
function buildHalfTexture(colorSource, outline, { mirrorOutline = false } = {}) {
    const { width, height } = outline;
    const draw = (source, mirror) => {
        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (mirror) {
            context.translate(width, 0);
            context.scale(-1, 1);
        }
        context.drawImage(source, 0, 0, width, height);
        return canvas;
    };

    const colors = bleedOpaqueColors(draw(colorSource, false));
    const alpha = draw(outline, mirrorOutline).getContext('2d', { willReadFrequently: true })
        .getImageData(0, 0, width, height).data;

    const context = colors.getContext('2d', { willReadFrequently: true });
    const pixels = context.getImageData(0, 0, width, height);
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = alpha[i];
    context.putImageData(pixels, 0, 0);

    return colors;
}

/** Chamfer distance (in grid cells) from each inside cell to the nearest outside cell. */
function distanceToOutline(inside, columns, rows) {
    const far = columns + rows;
    const distance = new Float32Array(columns * rows);
    for (let i = 0; i < distance.length; i += 1) distance[i] = inside[i] ? far : 0;

    // Cells beyond the image border are not treated as outline: a photo cropped at the knees
    // should keep its full depth down to the crop line instead of tapering to nothing.
    const relax = (index, neighbour, cost) => {
        const candidate = distance[neighbour] + cost;
        if (candidate < distance[index]) distance[index] = candidate;
    };

    for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
            const i = y * columns + x;
            if (!inside[i]) continue;
            if (x > 0) relax(i, i - 1, 1);
            if (y > 0) {
                relax(i, i - columns, 1);
                if (x > 0) relax(i, i - columns - 1, Math.SQRT2);
                if (x < columns - 1) relax(i, i - columns + 1, Math.SQRT2);
            }
        }
    }

    for (let y = rows - 1; y >= 0; y -= 1) {
        for (let x = columns - 1; x >= 0; x -= 1) {
            const i = y * columns + x;
            if (!inside[i]) continue;
            if (x < columns - 1) relax(i, i + 1, 1);
            if (y < rows - 1) {
                relax(i, i + columns, 1);
                if (x < columns - 1) relax(i, i + columns + 1, Math.SQRT2);
                if (x > 0) relax(i, i + columns - 1, Math.SQRT2);
            }
        }
    }

    // A shape with no outline at all (fully opaque image) would otherwise be "infinitely" deep.
    const cap = rows / 4;
    for (let i = 0; i < distance.length; i += 1) {
        if (distance[i] > cap) distance[i] = cap;
    }

    return distance;
}

/**
 * Half-width of the part each cell belongs to: the largest inscribed circle covering it.
 * Lets the torso, head and arms each get a depth that suits their own size.
 */
function partRadius(distance, inside, columns, rows) {
    const radius = new Float32Array(distance.length);

    for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
            const i = y * columns + x;
            if (!inside[i]) continue;
            const r = distance[i];

            // Only ridge cells (no neighbour further from the outline) stamp their circle.
            let ridge = true;
            for (let dy = -1; dy <= 1 && ridge; dy += 1) {
                for (let dx = -1; dx <= 1; dx += 1) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < columns && ny >= 0 && ny < rows && distance[ny * columns + nx] > r) {
                        ridge = false;
                        break;
                    }
                }
            }
            if (!ridge) continue;

            const reach = Math.floor(r);
            const reachSquared = r * r;
            for (let dy = -reach; dy <= reach; dy += 1) {
                const ny = y + dy;
                if (ny < 0 || ny >= rows) continue;
                for (let dx = -reach; dx <= reach; dx += 1) {
                    const nx = x + dx;
                    if (nx < 0 || nx >= columns || dx * dx + dy * dy > reachSquared) continue;
                    const n = ny * columns + nx;
                    if (inside[n] && radius[n] < r) radius[n] = r;
                }
            }
        }
    }

    for (let i = 0; i < radius.length; i += 1) {
        if (inside[i] && radius[i] < distance[i]) radius[i] = distance[i];
    }

    return radius;
}

/** Averages each inside cell with its inside neighbours, `passes` times. */
function smoothInside(values, inside, columns, rows, passes, keep = () => false) {
    let current = values;
    for (let pass = 0; pass < passes; pass += 1) {
        const next = new Float32Array(current.length);
        for (let y = 0; y < rows; y += 1) {
            for (let x = 0; x < columns; x += 1) {
                const i = y * columns + x;
                if (!inside[i]) continue;
                if (keep(i)) {
                    next[i] = current[i];
                    continue;
                }
                let sum = 0;
                let count = 0;
                for (let dy = -1; dy <= 1; dy += 1) {
                    const ny = y + dy;
                    if (ny < 0 || ny >= rows) continue;
                    for (let dx = -1; dx <= 1; dx += 1) {
                        const nx = x + dx;
                        if (nx < 0 || nx >= columns) continue;
                        const n = ny * columns + nx;
                        if (!inside[n]) continue;
                        sum += current[n];
                        count += 1;
                    }
                }
                next[i] = sum / count;
            }
        }
        current = next;
    }
    return current;
}

/** Relief mesh for one half: width = aspect ratio, height = 1, bulging towards +z. */
function buildReliefGeometry(textureCanvas) {
    const aspect = textureCanvas.width / textureCanvas.height;
    const rows = GRID_ROWS;
    const columns = Math.max(2, Math.round(GRID_ROWS * aspect));

    const small = createCanvas(columns, rows);
    const context = small.getContext('2d', { willReadFrequently: true });
    context.drawImage(textureCanvas, 0, 0, columns, rows);
    const pixels = context.getImageData(0, 0, columns, rows).data;

    const inside = new Uint8Array(columns * rows);
    for (let i = 0; i < inside.length; i += 1) inside[i] = pixels[i * 4 + 3] > 100 ? 1 : 0;

    const distance = distanceToOutline(inside, columns, rows);
    // Smooth the part sizes so the depth changes gradually where parts meet (neck, shoulders).
    const radius = smoothInside(partRadius(distance, inside, columns, rows), inside, columns, rows, 6);

    let depth = new Float32Array(columns * rows);
    for (let i = 0; i < depth.length; i += 1) {
        if (!inside[i]) continue;
        const r = Math.max(1, radius[i] - RIM_CELLS);
        const d = Math.max(0, distance[i] - RIM_CELLS);
        // Quarter-ellipse from the edge up to a flat top.
        const t = Math.min(1, d / (ROUNDING * r));
        depth[i] = DEPTH_RATIO * (r / rows) * Math.sqrt(1 - (1 - t) * (1 - t));
    }

    // Soften creases, keeping the rim at zero so the halves meet exactly.
    depth = smoothInside(depth, inside, columns, rows, 3, (i) => distance[i] <= RIM_CELLS);
    for (let i = 0; i < depth.length; i += 1) {
        if (distance[i] <= RIM_CELLS) depth[i] = 0;
    }

    const geometry = new PlaneGeometry(aspect, 1, columns - 1, rows - 1);
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) position.setZ(i, depth[i]);
    geometry.computeVertexNormals();

    return geometry;
}

function buildHalf(textureCanvas, maxAnisotropy) {
    const texture = new CanvasTexture(textureCanvas);
    texture.premultiplyAlpha = true; // correct colours at the soft edge when filtering
    texture.anisotropy = maxAnisotropy;

    const material = new ShaderMaterial({
        uniforms: {
            map: { value: texture },
            lightDirection: { value: new Vector3(-0.35, 0.45, 1).normalize() },
            shading: { value: 0 },
        },
        vertexShader,
        fragmentShader,
        side: FrontSide,
        alphaToCoverage: true,
    });

    return new Mesh(buildReliefGeometry(textureCanvas), material);
}

/**
 * @param {HTMLElement} container  Element the WebGL canvas fills.
 * @param {object} cutouts
 * @param {HTMLCanvasElement} cutouts.front  Front photo (design printed on), transparent background.
 * @param {HTMLCanvasElement} cutouts.back  Back photo as seen from behind; it's fitted to the front
 *     outline (mirrored), so the two halves always form one continuous body.
 * @returns {{ setAngle(radians: number): void, resize(): void, dispose(): void }}
 */
export function createMockupScene(container, { front, back }) {
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 50);
    const model = new Group();
    scene.add(model);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const frontHalf = buildHalf(buildHalfTexture(front, front), maxAnisotropy);
    // Built "seen from behind" on the mirrored front outline, then turned around: its edge lands
    // exactly on the front's.
    const backHalf = buildHalf(buildHalfTexture(back, front, { mirrorOutline: true }), maxAnisotropy);
    backHalf.geometry.rotateY(Math.PI);
    model.add(frontHalf, backHalf);

    const materials = [frontHalf.material, backHalf.material];
    const aspect = front.width / front.height;
    const render = () => renderer.render(scene, camera);

    const resize = () => {
        const width = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;

        // Back off until the full height (and width, on narrow screens) fits with a little margin.
        const halfFov = Math.tan((CAMERA_FOV * Math.PI) / 360);
        const fitHeight = 0.56 / halfFov;
        const fitWidth = (aspect * 0.6) / (halfFov * camera.aspect);
        camera.position.set(0, 0, Math.max(fitHeight, fitWidth));
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        render();
    };

    resize();

    return {
        setAngle(radians) {
            model.rotation.y = radians;
            const shading = 1 - Math.abs(Math.cos(radians));
            materials.forEach((material) => {
                material.uniforms.shading.value = shading;
            });
            render();
        },
        resize,
        dispose() {
            [frontHalf, backHalf].forEach((mesh) => {
                mesh.geometry.dispose();
                mesh.material.uniforms.map.value.dispose();
                mesh.material.dispose();
            });
            renderer.dispose();
            renderer.domElement.remove();
        },
    };
}
