# Render3D - CPU-based 3D Rendering for MakeCode Arcade

A lightweight 3D rendering library for MakeCode Arcade that brings shader-style programming to the platform. Implements CPU-based vertex and fragment shaders with matrix transformations.

## Features

- **Shader Interface**: Write custom vertex and fragment shaders like THREE.js ShaderMaterial
- **Matrix Math**: Full 4x4 matrix operations (perspective, lookAt, rotation, translation, scale)
- **Custom Geometry**: Define meshes with arbitrary vertex attributes
- **Depth Testing**: Proper Z-buffering for correct rendering
- **Grayscale Output**: White-to-black gradient (0-15 palette)
- **Efficient**: Optimized for MakeCode Arcade constraints

## Quick Start

```typescript
// Create renderer
const renderer = new Render3D.Renderer(160, 120);

// Create geometry
const cube = Render3D.Geometry.createCube();

// Define vertex shader
const vertexShader: Render3D.VertexShader = (attrs, uniforms) => {
    const pos = new Render3D.Vec4(attrs.position.x, attrs.position.y, attrs.position.z, 1.0);
    
    // Transform to clip space
    let transformed = Render3D.Mat4.multiplyVec4(uniforms.modelMatrix, pos);
    transformed = Render3D.Mat4.multiplyVec4(uniforms.viewMatrix, transformed);
    transformed = Render3D.Mat4.multiplyVec4(uniforms.projectionMatrix, transformed);
    
    return {
        position: transformed,
        normal: attrs.normal
    };
};

// Define fragment shader
const fragmentShader: Render3D.FragmentShader = (varying, uniforms) => {
    const normal = varying.normal as Render3D.Vec3;
    const lightDir = Render3D.Vec3.normalize(new Render3D.Vec3(1, 1, 1));
    const intensity = Math.max(0, Render3D.Vec3.dot(normal, lightDir));
    
    return 15 - Math.floor(intensity * 15); // 15=white, 0=black
};

// Setup uniforms
const uniforms = {
    modelMatrix: Render3D.Mat4.identity(),
    viewMatrix: Render3D.Mat4.lookAt(
        new Render3D.Vec3(2, 2, 2),
        new Render3D.Vec3(0, 0, 0),
        new Render3D.Vec3(0, 1, 0)
    ),
    projectionMatrix: Render3D.Mat4.perspective(Math.PI / 3, 160 / 120, 0.1, 100)
};

// Render loop
game.onUpdate(() => {
    renderer.clear();
    renderer.render(cube, vertexShader, fragmentShader, uniforms);
    renderer.display();
});
```

## API Reference

### Renderer

```typescript
class Renderer {
    constructor(width: number, height: number)
    clear(): void
    render(geometry: Geometry, vertShader: VertexShader, fragShader: FragmentShader, uniforms: Uniforms): void
    display(): void
    getImage(): Image
}
```

### Geometry

```typescript
class Geometry {
    vertices: VertexAttributes[]
    indices: number[]
    
    addVertex(attrs: VertexAttributes): number
    addTriangle(i0: number, i1: number, i2: number): void
    static createCube(): Geometry
}
```

### Shaders

```typescript
interface VertexShader {
    (attributes: VertexAttributes, uniforms: Uniforms): VertexOutput
}

interface FragmentShader {
    (varying: VertexOutput, uniforms: Uniforms): number // Returns 0-15
}
```

### Math Classes

**Vec3**: 3D vector with `add`, `sub`, `scale`, `dot`, `normalize`, `cross`

**Vec4**: 4D vector for homogeneous coordinates

**Mat4**: 4x4 matrix with operations:
- `identity()`, `multiply(a, b)`, `multiplyVec4(m, v)`
- `perspective(fov, aspect, near, far)`
- `lookAt(eye, target, up)`
- `translate(x, y, z)`, `scale(x, y, z)`
- `rotateX(angle)`, `rotateY(angle)`, `rotateZ(angle)`

## Shader Examples

### Diffuse Lighting

```typescript
const fragmentShader: Render3D.FragmentShader = (varying, uniforms) => {
    const normal = varying.normal as Render3D.Vec3;
    const lightDir = Render3D.Vec3.normalize(new Render3D.Vec3(1, 1, 1));
    const intensity = Math.max(0, Render3D.Vec3.dot(normal, lightDir));
    return 15 - Math.floor(intensity * 15);
};
```

### Depth-based

```typescript
const fragmentShader: Render3D.FragmentShader = (varying, uniforms) => {
    const worldPos = varying.worldPos as Render3D.Vec3;
    const dist = Math.sqrt(worldPos.x ** 2 + worldPos.y ** 2 + worldPos.z ** 2);
    const depth = Math.max(0, Math.min(1, dist / 5));
    return 15 - Math.floor(depth * 15);
};
```

### Normal Visualization

```typescript
const fragmentShader: Render3D.FragmentShader = (varying, uniforms) => {
    const normal = varying.normal as Render3D.Vec3;
    const shade = (normal.y + 1) * 0.5;
    return 15 - Math.floor(shade * 15);
};
```

## Custom Geometry

```typescript
const geo = new Render3D.Geometry();

// Add vertices with custom attributes
const v0 = geo.addVertex({ 
    position: new Render3D.Vec3(0, 1, 0),
    normal: new Render3D.Vec3(0, 1, 0),
    uv: { x: 0.5, y: 0.0 }  // Custom attribute
});

const v1 = geo.addVertex({ 
    position: new Render3D.Vec3(-1, 0, 0),
    normal: new Render3D.Vec3(-1, 0, 0)
});

const v2 = geo.addVertex({ 
    position: new Render3D.Vec3(1, 0, 0),
    normal: new Render3D.Vec3(1, 0, 0)
});

// Add triangle
geo.addTriangle(v0, v1, v2);
```

## Performance Tips

1. **Minimize vertices**: Use indexed triangles, avoid duplicate vertices
2. **Cull back faces**: Check triangle winding in vertex shader
3. **LOD**: Use simpler geometry for distant objects
4. **Reduce resolution**: Lower renderer size (120x90) for more FPS
5. **Simple shaders**: Keep fragment shader calculations minimal

## Architecture

The rendering pipeline:

1. **Vertex Shader**: Transform vertices to clip space, output varyings
2. **Perspective Division**: Convert clip space to NDC
3. **Viewport Transform**: Map NDC to screen coordinates
4. **Rasterization**: Scan triangles, interpolate varyings
5. **Depth Test**: Compare Z values, update depth buffer
6. **Fragment Shader**: Calculate per-pixel color (0-15)

## Color Scheme

The library uses a white-to-black gradient (MakeCode Arcade palette 0-15):
- `15` = White (brightest)
- `8` = Gray (mid-tone)
- `0` = Black (darkest)

Fragment shaders return values 0-15 to map to this gradient.

## License

MIT
