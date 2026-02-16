/**
 * CPU-based 3D rendering library for MakeCode Arcade
 * Provides shader-like interface with vertex/fragment shaders
 */

namespace Render3D {
    
    // ========== MATH ==========
    
    export class Vec3 {
        constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}
        
        static add(a: Vec3, b: Vec3): Vec3 {
            return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
        }
        
        static sub(a: Vec3, b: Vec3): Vec3 {
            return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
        }
        
        static scale(v: Vec3, s: number): Vec3 {
            return new Vec3(v.x * s, v.y * s, v.z * s);
        }
        
        static dot(a: Vec3, b: Vec3): number {
            return a.x * b.x + a.y * b.y + a.z * b.z;
        }
        
        static normalize(v: Vec3): Vec3 {
            const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
            return len > 0 ? new Vec3(v.x / len, v.y / len, v.z / len) : new Vec3();
        }
    }
    
    export class Vec4 {
        constructor(public x: number = 0, public y: number = 0, public z: number = 0, public w: number = 1) {}
    }
    
    export class Mat4 {
        // Column-major 4x4 matrix
        public m: number[] = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
        
        static identity(): Mat4 {
            return new Mat4();
        }
        
        static multiply(a: Mat4, b: Mat4): Mat4 {
            const result = new Mat4();
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    let sum = 0;
                    for (let k = 0; k < 4; k++) {
                        sum += a.m[i * 4 + k] * b.m[k * 4 + j];
                    }
                    result.m[i * 4 + j] = sum;
                }
            }
            return result;
        }
        
        static multiplyVec4(m: Mat4, v: Vec4): Vec4 {
            return new Vec4(
                m.m[0] * v.x + m.m[1] * v.y + m.m[2] * v.z + m.m[3] * v.w,
                m.m[4] * v.x + m.m[5] * v.y + m.m[6] * v.z + m.m[7] * v.w,
                m.m[8] * v.x + m.m[9] * v.y + m.m[10] * v.z + m.m[11] * v.w,
                m.m[12] * v.x + m.m[13] * v.y + m.m[14] * v.z + m.m[15] * v.w
            );
        }
        
        static perspective(fov: number, aspect: number, near: number, far: number): Mat4 {
            const mat = new Mat4();
            const f = 1.0 / Math.tan(fov / 2);
            const nf = 1 / (near - far);
            
            mat.m[0] = f / aspect;
            mat.m[5] = f;
            mat.m[10] = (far + near) * nf;
            mat.m[11] = 2 * far * near * nf;
            mat.m[14] = -1;
            mat.m[15] = 0;
            
            return mat;
        }
        
        static lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
            const z = Vec3.normalize(Vec3.sub(eye, target));
            const x = Vec3.normalize(Vec3.cross(up, z));
            const y = Vec3.cross(z, x);
            
            const mat = new Mat4();
            mat.m[0] = x.x; mat.m[1] = x.y; mat.m[2] = x.z; mat.m[3] = -Vec3.dot(x, eye);
            mat.m[4] = y.x; mat.m[5] = y.y; mat.m[6] = y.z; mat.m[7] = -Vec3.dot(y, eye);
            mat.m[8] = z.x; mat.m[9] = z.y; mat.m[10] = z.z; mat.m[11] = -Vec3.dot(z, eye);
            mat.m[15] = 1;
            
            return mat;
        }
        
        static translate(x: number, y: number, z: number): Mat4 {
            const mat = new Mat4();
            mat.m[3] = x;
            mat.m[7] = y;
            mat.m[11] = z;
            return mat;
        }
        
        static rotateX(angle: number): Mat4 {
            const mat = new Mat4();
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            mat.m[5] = c;
            mat.m[6] = -s;
            mat.m[9] = s;
            mat.m[10] = c;
            return mat;
        }
        
        static rotateY(angle: number): Mat4 {
            const mat = new Mat4();
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            mat.m[0] = c;
            mat.m[2] = s;
            mat.m[8] = -s;
            mat.m[10] = c;
            return mat;
        }
        
        static rotateZ(angle: number): Mat4 {
            const mat = new Mat4();
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            mat.m[0] = c;
            mat.m[1] = -s;
            mat.m[4] = s;
            mat.m[5] = c;
            return mat;
        }
        
        static scale(x: number, y: number, z: number): Mat4 {
            const mat = new Mat4();
            mat.m[0] = x;
            mat.m[5] = y;
            mat.m[10] = z;
            return mat;
        }
    }
    
    // Add cross product helper
    namespace Vec3 {
        export function cross(a: Vec3, b: Vec3): Vec3 {
            return new Vec3(
                a.y * b.z - a.z * b.y,
                a.z * b.x - a.x * b.z,
                a.x * b.y - a.y * b.x
            );
        }
    }
    
    // ========== SHADERS ==========
    
    export interface VertexAttributes {
        position: Vec3;
        [key: string]: any; // Custom attributes (normal, uv, color, etc.)
    }
    
    export interface VertexOutput {
        position: Vec4; // Clip space position
        [key: string]: any; // Varying outputs for fragment shader
    }
    
    export interface Uniforms {
        modelMatrix?: Mat4;
        viewMatrix?: Mat4;
        projectionMatrix?: Mat4;
        [key: string]: any; // Custom uniforms
    }
    
    export interface VertexShader {
        (attributes: VertexAttributes, uniforms: Uniforms): VertexOutput;
    }
    
    export interface FragmentShader {
        (varying: VertexOutput, uniforms: Uniforms): number; // Returns grayscale 0-15
    }
    
    // ========== GEOMETRY ==========
    
    export class Geometry {
        public vertices: VertexAttributes[] = [];
        public indices: number[] = [];
        
        constructor() {}
        
        addVertex(attrs: VertexAttributes): number {
            this.vertices.push(attrs);
            return this.vertices.length - 1;
        }
        
        addTriangle(i0: number, i1: number, i2: number): void {
            this.indices.push(i0, i1, i2);
        }
        
        static createCube(): Geometry {
            const geo = new Geometry();
            const s = 0.5;
            
            // Vertices with positions and normals
            const positions = [
                [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s], // Front
                [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s],     // Back
            ];
            
            for (let pos of positions) {
                geo.addVertex({
                    position: new Vec3(pos[0], pos[1], pos[2]),
                    normal: Vec3.normalize(new Vec3(pos[0], pos[1], pos[2]))
                });
            }
            
            // Indices
            const faces = [
                [0, 1, 2], [0, 2, 3], // Front
                [5, 4, 7], [5, 7, 6], // Back
                [4, 0, 3], [4, 3, 7], // Left
                [1, 5, 6], [1, 6, 2], // Right
                [3, 2, 6], [3, 6, 7], // Top
                [4, 5, 1], [4, 1, 0]  // Bottom
            ];
            
            for (let face of faces) {
                geo.addTriangle(face[0], face[1], face[2]);
            }
            
            return geo;
        }
    }
    
    // ========== RENDERER ==========
    
    export class Renderer {
        private buffer: Image;
        private depthBuffer: number[];
        
        constructor(public width: number = 160, public height: number = 120) {
            this.buffer = image.create(width, height);
            this.depthBuffer = [];
            for (let i = 0; i < width * height; i++) {
                this.depthBuffer.push(Infinity);
            }
        }
        
        clear(): void {
            this.buffer.fill(0); // Black background
            for (let i = 0; i < this.depthBuffer.length; i++) {
                this.depthBuffer[i] = Infinity;
            }
        }
        
        render(
            geometry: Geometry,
            vertShader: VertexShader,
            fragShader: FragmentShader,
            uniforms: Uniforms
        ): void {
            // Process triangles
            for (let i = 0; i < geometry.indices.length; i += 3) {
                const i0 = geometry.indices[i];
                const i1 = geometry.indices[i + 1];
                const i2 = geometry.indices[i + 2];
                
                // Vertex shader
                const v0 = vertShader(geometry.vertices[i0], uniforms);
                const v1 = vertShader(geometry.vertices[i1], uniforms);
                const v2 = vertShader(geometry.vertices[i2], uniforms);
                
                // Perspective division
                const ndc0 = this.perspectiveDivide(v0.position);
                const ndc1 = this.perspectiveDivide(v1.position);
                const ndc2 = this.perspectiveDivide(v2.position);
                
                // Viewport transform
                const p0 = this.toScreen(ndc0);
                const p1 = this.toScreen(ndc1);
                const p2 = this.toScreen(ndc2);
                
                // Rasterize triangle
                this.rasterizeTriangle(p0, p1, p2, v0, v1, v2, fragShader, uniforms);
            }
        }
        
        private perspectiveDivide(v: Vec4): Vec3 {
            if (Math.abs(v.w) < 0.0001) return new Vec3(v.x, v.y, v.z);
            return new Vec3(v.x / v.w, v.y / v.w, v.z / v.w);
        }
        
        private toScreen(ndc: Vec3): { x: number, y: number, z: number } {
            return {
                x: Math.floor((ndc.x + 1) * 0.5 * this.width),
                y: Math.floor((1 - ndc.y) * 0.5 * this.height),
                z: ndc.z
            };
        }
        
        private rasterizeTriangle(
            p0: { x: number, y: number, z: number },
            p1: { x: number, y: number, z: number },
            p2: { x: number, y: number, z: number },
            v0: VertexOutput,
            v1: VertexOutput,
            v2: VertexOutput,
            fragShader: FragmentShader,
            uniforms: Uniforms
        ): void {
            // Bounding box
            const minX = Math.max(0, Math.floor(Math.min(p0.x, p1.x, p2.x)));
            const maxX = Math.min(this.width - 1, Math.ceil(Math.max(p0.x, p1.x, p2.x)));
            const minY = Math.max(0, Math.floor(Math.min(p0.y, p1.y, p2.y)));
            const maxY = Math.min(this.height - 1, Math.ceil(Math.max(p0.y, p1.y, p2.y)));
            
            // Rasterize
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const bary = this.barycentric(x, y, p0, p1, p2);
                    
                    if (bary.u >= 0 && bary.v >= 0 && bary.w >= 0) {
                        const z = p0.z * bary.u + p1.z * bary.v + p2.z * bary.w;
                        const idx = y * this.width + x;
                        
                        if (z < this.depthBuffer[idx]) {
                            this.depthBuffer[idx] = z;
                            
                            // Interpolate varyings
                            const varying = this.interpolateVarying(v0, v1, v2, bary);
                            
                            // Fragment shader
                            const color = fragShader(varying, uniforms);
                            this.buffer.setPixel(x, y, Math.max(0, Math.min(15, Math.floor(color))));
                        }
                    }
                }
            }
        }
        
        private barycentric(
            x: number, y: number,
            p0: { x: number, y: number },
            p1: { x: number, y: number },
            p2: { x: number, y: number }
        ): { u: number, v: number, w: number } {
            const v0x = p1.x - p0.x, v0y = p1.y - p0.y;
            const v1x = p2.x - p0.x, v1y = p2.y - p0.y;
            const v2x = x - p0.x, v2y = y - p0.y;
            
            const denom = v0x * v1y - v1x * v0y;
            if (Math.abs(denom) < 0.001) return { u: -1, v: -1, w: -1 };
            
            const v = (v2x * v1y - v1x * v2y) / denom;
            const w = (v0x * v2y - v2x * v0y) / denom;
            const u = 1 - v - w;
            
            return { u, v, w };
        }
        
        private interpolateVarying(
            v0: VertexOutput,
            v1: VertexOutput,
            v2: VertexOutput,
            bary: { u: number, v: number, w: number }
        ): VertexOutput {
            const result: VertexOutput = { position: new Vec4() };
            
            for (let key in v0) {
                if (key === 'position') continue;
                
                const val0 = v0[key];
                const val1 = v1[key];
                const val2 = v2[key];
                
                if (typeof val0 === 'number') {
                    result[key] = val0 * bary.u + val1 * bary.v + val2 * bary.w;
                } else if (val0 instanceof Vec3) {
                    result[key] = new Vec3(
                        val0.x * bary.u + val1.x * bary.v + val2.x * bary.w,
                        val0.y * bary.u + val1.y * bary.v + val2.y * bary.w,
                        val0.z * bary.u + val1.z * bary.v + val2.z * bary.w
                    );
                }
            }
            
            return result;
        }
        
        getImage(): Image {
            return this.buffer;
        }
        
        display(): void {
            scene.backgroundImage().drawTransparentImage(this.buffer, 0, 0);
        }
    }
}