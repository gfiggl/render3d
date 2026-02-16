# Render3D - 3D for MakeCode Arcade

Optimized CPU-based 3D rendering using efficient array-based operations.

## Features

- **Compact** - ~6KB code size
- **Fast** - Array-based, minimal allocations
- **Simple** - Direct operations, clear API
- **Efficient** - Optimized for MakeCode Arcade

## Quick Start

```typescript
const rend = new Render3D.Renderer(160, 120);
const cube = Render3D.Geo.cube();

let t = 0;
const uni: Render3D.Uniforms = {
    model: Render3D.m4identity(),
    view: Render3D.m4lookAt([2, 2, 2], [0, 0, 0], [0, 1, 0]),
    proj: Render3D.m4perspective(Math.PI / 3, 160 / 120, 0.1, 100)
};

const vert: Render3D.VertShader = (pos, norm, u) => {
    let p = [pos[0], pos[1], pos[2], 1];
    p = Render3D.m4mulv(u.model, p);
    p = Render3D.m4mulv(u.view, p);
    p = Render3D.m4mulv(u.proj, p);
    return [p[0], p[1], p[2], p[3], norm[0], norm[1], norm[2]];
};

const frag: Render3D.FragShader = (norm, u) => {
    const light = Render3D.v3norm([1, 1, 1]);
    const intensity = Math.max(0, Render3D.v3dot(norm, light));
    return 15 - Math.floor(intensity * 15);
};

game.onUpdate(() => {
    t += 0.016;

    uni.view = Render3D.m4lookAt(
        [Math.cos(t) * 3, 2, Math.sin(t) * 3],
        [0, 0, 0],
        [0, 1, 0]
    );

    uni.model = Render3D.m4mul(Render3D.m4rotY(t), Render3D.m4rotX(t * 0.7));

    rend.clear();
    rend.render(cube, vert, frag, uni);
    rend.show();
});
```

## API Reference

### Vectors (as arrays)

```typescript
// Create vectors
const v = [x, y, z];
const v = Render3D.v3(x, y, z);

// Operations
Render3D.v3add(a, b)     // Add
Render3D.v3sub(a, b)     // Subtract
Render3D.v3scale(v, s)   // Scale
Render3D.v3dot(a, b)     // Dot product
Render3D.v3cross(a, b)   // Cross product
Render3D.v3norm(v)       // Normalize
```

### Matrices (as number[16])

```typescript
// Create matrices
Render3D.m4identity()
Render3D.m4perspective(fov, aspect, near, far)
Render3D.m4lookAt(eye, target, up)

// Transforms
Render3D.m4rotX(angle)
Render3D.m4rotY(angle)
Render3D.m4rotZ(angle)

// Operations
Render3D.m4mul(a, b)      // Multiply matrices
Render3D.m4mulv(m, v)     // Transform vector [x,y,z,w]
```

### Geometry

```typescript
const geo = new Render3D.Geo();

// Add vertices
const idx = geo.addVert(
    [x, y, z],     // position
    [nx, ny, nz]   // normal
);

// Add triangles
geo.addTri(i0, i1, i2);

// Built-in shapes
const cube = Render3D.Geo.cube();
```

### Shaders

```typescript
// Vertex shader: transform vertices
// Input: pos[3], norm[3], uniforms
// Output: [x,y,z,w, nx,ny,nz]
const vert: Render3D.VertShader = (pos, norm, u) => {
    let p = [pos[0], pos[1], pos[2], 1];
    p = Render3D.m4mulv(u.model, p);
    p = Render3D.m4mulv(u.view, p);
    p = Render3D.m4mulv(u.proj, p);
    return [p[0], p[1], p[2], p[3], norm[0], norm[1], norm[2]];
};

// Fragment shader: calculate color
// Input: norm[3], uniforms
// Output: 0-15 (grayscale)
const frag: Render3D.FragShader = (norm, u) => {
    const light = Render3D.v3norm([1, 1, 1]);
    const intensity = Math.max(0, Render3D.v3dot(norm, light));
    return 15 - Math.floor(intensity * 15);
};
```

### Renderer

```typescript
const rend = new Render3D.Renderer(w, h);

rend.clear();                           // Clear buffers
rend.render(geo, vert, frag, uniforms); // Render geometry
rend.show();                            // Display to screen
```

## Shader Examples

### Diffuse Lighting
```typescript
const frag: Render3D.FragShader = (norm, u) => {
    const light = Render3D.v3norm([1, 1, 1]);
    const intensity = Math.max(0, Render3D.v3dot(norm, light));
    return 15 - Math.floor(intensity * 15);
};
```

### Depth Fog
```typescript
const frag: Render3D.FragShader = (norm, u) => {
    const len = Math.sqrt(norm[0] ** 2 + norm[1] ** 2 + norm[2] ** 2);
    const depth = Math.min(1, len / 5);
    return Math.floor(depth * 15);
};
```

### Rim Lighting
```typescript
const frag: Render3D.FragShader = (norm, u) => {
    const viewDir = Render3D.v3norm([0, 0, 1]);
    const rim = 1 - Math.abs(Render3D.v3dot(norm, viewDir));
    return Math.floor(rim * 15);
};
```

## Custom Geometry

```typescript
const pyramid = new Render3D.Geo();

// Apex
const apex = pyramid.addVert([0, 1, 0], [0, 1, 0]);

// Base
const base = [
    pyramid.addVert([-0.5, 0, -0.5], [0, -1, 0]),
    pyramid.addVert([0.5, 0, -0.5], [0, -1, 0]),
    pyramid.addVert([0.5, 0, 0.5], [0, -1, 0]),
    pyramid.addVert([-0.5, 0, 0.5], [0, -1, 0])
];

// Sides
for (let i = 0; i < 4; i++) {
    pyramid.addTri(apex, base[i], base[(i + 1) % 4]);
}

// Bottom
pyramid.addTri(base[0], base[2], base[1]);
pyramid.addTri(base[0], base[3], base[2]);
```

## Performance Tips

1. **Lower resolution**: `new Renderer(120, 90)` for more FPS
2. **Simple shaders**: Minimize math in fragment shader
3. **Fewer vertices**: Use LOD for complex models
4. **Reuse arrays**: Don't create new arrays in hot loops
5. **Cull backfaces**: Check triangle winding

## License

MIT