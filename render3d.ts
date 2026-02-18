/**
 * Optimized CPU 3D renderer for MakeCode Arcade
 * Simplified vector ops, minimal allocations
 */

namespace Render3D {

    // ========== LEAN MATH (using arrays, no class overhead) ==========

    // Vec3 as [x, y, z]
    export function v3(x: number, y: number, z: number): number[] {
        return [x, y, z];
    }

    export function v3add(a: number[], b: number[]): number[] {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    export function v3sub(a: number[], b: number[]): number[] {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    export function v3scale(v: number[], s: number): number[] {
        return [v[0] * s, v[1] * s, v[2] * s];
    }

    export function v3dot(a: number[], b: number[]): number {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    export function v3cross(a: number[], b: number[]): number[] {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    export function v3norm(v: number[]): number[] {
        const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
    }

    // Mat4 as flat array[16]
    export function m4identity(): number[] {
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }

    export function m4mul(a: number[], b: number[]): number[] {
        const r = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 4; k++) {
                    r[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
                }
            }
        }
        return r;
    }

    // Transform [x,y,z,w] by matrix, returns [x,y,z,w]
    export function m4mulv(m: number[], v: number[]): number[] {
        return [
            m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3] * v[3],
            m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7] * v[3],
            m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11] * v[3],
            m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3]
        ];
    }

    export function m4perspective(fov: number, aspect: number, near: number, far: number): number[] {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, 2 * far * near * nf,
            0, 0, -1, 0
        ];
    }

    export function m4lookAt(eye: number[], target: number[], up: number[]): number[] {
        const z = v3norm(v3sub(eye, target));
        const x = v3norm(v3cross(up, z));
        const y = v3cross(z, x);

        return [
            x[0], x[1], x[2], -v3dot(x, eye),
            y[0], y[1], y[2], -v3dot(y, eye),
            z[0], z[1], z[2], -v3dot(z, eye),
            0, 0, 0, 1
        ];
    }

    export function m4rotX(a: number): number[] {
        const c = Math.cos(a), s = Math.sin(a);
        return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1];
    }

    export function m4rotY(a: number): number[] {
        const c = Math.cos(a), s = Math.sin(a);
        return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1];
    }

    export function m4rotZ(a: number): number[] {
        const c = Math.cos(a), s = Math.sin(a);
        return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }

    // ========== GEOMETRY ==========

    export interface Vertex {
        p: number[];  // position [x,y,z]
        n: number[];  // normal [x,y,z]
    }

    export class Geo {
        v: Vertex[];  // vertices
        i: number[];  // indices

        addVert(pos: number[], norm: number[]): number {
            this.v.push({ p: pos, n: norm });
            return this.v.length - 1;
        }

        addTri(i0: number, i1: number, i2: number) {
            this.i.push(i0);
            this.i.push(i1);
            this.i.push(i2);
        }

        static cube(): Geo {
            const g = new Geo();
            const s = 0.5;

            // 8 corners
            const pos = [
                [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
                [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
            ];

            for (let p of pos) {
                g.addVert(p, v3norm(p));
            }

            // 12 triangles
            const faces = [
                [0, 1, 2], [0, 2, 3], [5, 4, 7], [5, 7, 6],
                [4, 0, 3], [4, 3, 7], [1, 5, 6], [1, 6, 2],
                [3, 2, 6], [3, 6, 7], [4, 5, 1], [4, 1, 0]
            ];

            for (let f of faces) {
                g.addTri(f[0], f[1], f[2]);
            }

            return g;
        }
    }

    // ========== SHADERS (simplified) ==========

    export interface Uniforms {
        model: number[];
        view: number[];
        proj: number[];
    }

    // Vertex shader: (pos, norm, uniforms) => [clipPos[4], norm[3]]
    export interface VertShader {
        (pos: number[], norm: number[], u: Uniforms): number[];
    }

    // Fragment shader: (norm[3], uniforms) => color (0-15)
    export interface FragShader {
        (norm: number[], u: Uniforms): number;
    }

    // ========== RENDERER ==========

    export class Renderer {
        private buf: Image;
        private depth: number[];

        constructor(public w: number = 160, public h: number = 120) {
            this.buf = image.create(w, h);
            this.depth = [];
            for (let i = 0; i < w * h; i++) {
                this.depth.push(Infinity);
            }
        }

        clear() {
            this.buf.fill(0);
            for (let i = 0; i < this.depth.length; i++) {
                this.depth[i] = Infinity;
            }
        }

        render(geo: Geo, vs: VertShader, fs: FragShader, u: Uniforms) {
            // Process triangles
            for (let i = 0; i < geo.i.length; i += 3) {
                const i0 = geo.i[i], i1 = geo.i[i + 1], i2 = geo.i[i + 2];

                // Vertex shader (returns [x,y,z,w, nx,ny,nz])
                const v0 = vs(geo.v[i0].p, geo.v[i0].n, u);
                const v1 = vs(geo.v[i1].p, geo.v[i1].n, u);
                const v2 = vs(geo.v[i2].p, geo.v[i2].n, u);

                // Perspective divide + viewport
                const p0 = this.toScreen(v0);
                const p1 = this.toScreen(v1);
                const p2 = this.toScreen(v2);

                // Rasterize
                this.tri(p0, p1, p2, [v0[4], v0[5], v0[6]], [v1[4], v1[5], v1[6]], [v2[4], v2[5], v2[6]], fs, u);
            }
        }

        private toScreen(v: number[]): number[] {
            // Perspective divide
            const w = v[3];
            if (Math.abs(w) < 0.0001) return [0, 0, 0];

            const x = v[0] / w;
            const y = v[1] / w;
            const z = v[2] / w;

            return [
                Math.floor((x + 1) * 0.5 * this.w),
                Math.floor((1 - y) * 0.5 * this.h),
                z
            ];
        }

        private tri(
            p0: number[], p1: number[], p2: number[],
            n0: number[], n1: number[], n2: number[],
            fs: FragShader, u: Uniforms
        ) {
            // Bounding box
            const minX = Math.max(0, Math.floor(Math.min(p0[0], Math.min(p1[0], p2[0]))));
            const maxX = Math.min(this.w - 1, Math.ceil(Math.max(p0[0], Math.max(p1[0], p2[0]))));
            const minY = Math.max(0, Math.floor(Math.min(p0[1], Math.min(p1[1], p2[1]))));
            const maxY = Math.min(this.h - 1, Math.ceil(Math.max(p0[1], Math.max(p1[1], p2[1]))));

            // Scan triangle
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const b = this.bary(x, y, p0, p1, p2);

                    if (b[0] >= 0 && b[1] >= 0 && b[2] >= 0) {
                        const z = p0[2] * b[0] + p1[2] * b[1] + p2[2] * b[2];
                        const idx = y * this.w + x;

                        if (z < this.depth[idx]) {
                            this.depth[idx] = z;

                            // Interpolate normal
                            const n = [
                                n0[0] * b[0] + n1[0] * b[1] + n2[0] * b[2],
                                n0[1] * b[0] + n1[1] * b[1] + n2[1] * b[2],
                                n0[2] * b[0] + n1[2] * b[1] + n2[2] * b[2]
                            ];

                            // Fragment shader
                            const col = fs(n, u);
                            this.buf.setPixel(x, y, Math.max(0, Math.min(15, Math.floor(col))));
                        }
                    }
                }
            }
        }

        private bary(x: number, y: number, p0: number[], p1: number[], p2: number[]): number[] {
            const v0x = p1[0] - p0[0], v0y = p1[1] - p0[1];
            const v1x = p2[0] - p0[0], v1y = p2[1] - p0[1];
            const v2x = x - p0[0], v2y = y - p0[1];

            const denom = v0x * v1y - v1x * v0y;
            if (Math.abs(denom) < 0.001) return [-1, -1, -1];

            const v = (v2x * v1y - v1x * v2y) / denom;
            const w = (v0x * v2y - v2x * v0y) / denom;
            const u = 1 - v - w;

            return [u, v, w];
        }

        show() {
            scene.backgroundImage().drawTransparentImage(this.buf, 0, 0);
        }
    }
}