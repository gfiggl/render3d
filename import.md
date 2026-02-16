# How to Import Render3D as a MakeCode Arcade Extension

There are three ways to use this library in MakeCode Arcade:

## Method 1: Import from GitHub (Recommended)

1. **Upload to GitHub:**
   - Create a new GitHub repository (e.g., `makecode-render3d`)
   - Upload these files:
     - `pxt.json`
     - `render3d.ts`
     - `test.ts`
     - `README.md`

2. **Import in MakeCode Arcade:**
   - Open [MakeCode Arcade](https://arcade.makecode.com)
   - Create a new project or open an existing one
   - Click the **Extensions** button (gear icon or "+")
   - Paste your GitHub URL: `https://github.com/yourusername/makecode-render3d`
   - Click "Import"

The library will be available as `Render3D` namespace!

## Method 2: Manual File Import

1. **Open MakeCode Arcade:**
   - Go to [arcade.makecode.com](https://arcade.makecode.com)
   - Create a new project

2. **Add the code:**
   - Click **Explorer** (folder icon) in the left sidebar
   - Click **+** to add a new file
   - Name it `render3d.ts`
   - Copy the entire contents of `render3d.ts` into this file
   - Switch to JavaScript/TypeScript mode if needed

3. **Use in your game:**
   ```typescript
   const renderer = new Render3D.Renderer(160, 120);
   const cube = Render3D.Geometry.createCube();
   // ... rest of your code
   ```

## Method 3: Copy-Paste into Main

For quick testing, copy the entire `render3d.ts` content directly into your main game file before your game code.

## Quick Start Example

```typescript
// After importing, use like this:

const renderer = new Render3D.Renderer(160, 120);
const cube = Render3D.Geometry.createCube();

const uniforms = {
    modelMatrix: Render3D.Mat4.identity(),
    viewMatrix: Render3D.Mat4.lookAt(
        new Render3D.Vec3(2, 2, 2),
        new Render3D.Vec3(0, 0, 0),
        new Render3D.Vec3(0, 1, 0)
    ),
    projectionMatrix: Render3D.Mat4.perspective(Math.PI / 3, 160/120, 0.1, 100)
};

const vertShader: Render3D.VertexShader = (attrs, uniforms) => {
    const pos = new Render3D.Vec4(attrs.position.x, attrs.position.y, attrs.position.z, 1.0);
    let transformed = Render3D.Mat4.multiplyVec4(uniforms.modelMatrix, pos);
    transformed = Render3D.Mat4.multiplyVec4(uniforms.viewMatrix, transformed);
    transformed = Render3D.Mat4.multiplyVec4(uniforms.projectionMatrix, transformed);
    return { position: transformed, normal: attrs.normal };
};

const fragShader: Render3D.FragmentShader = (varying, uniforms) => {
    const normal = varying.normal as Render3D.Vec3;
    const lightDir = Render3D.Vec3.normalize(new Render3D.Vec3(1, 1, 1));
    const intensity = Math.max(0, Render3D.Vec3.dot(normal, lightDir));
    return 15 - Math.floor(intensity * 15);
};

game.onUpdate(() => {
    renderer.clear();
    renderer.render(cube, vertShader, fragShader, uniforms);
    renderer.display();
});
```

## Files Included

- **pxt.json** - Extension metadata (required for GitHub import)
- **render3d.ts** - Main library code
- **test.ts** - Example usage/demo
- **README.md** - API documentation

## Troubleshooting

**"Extension not found"**
- Make sure your GitHub repo is public
- Verify all required files are in the root directory
- Wait a minute and try again (MakeCode caches)

**Performance issues**
- Reduce renderer resolution: `new Render3D.Renderer(120, 90)`
- Simplify geometry (fewer triangles)
- Keep fragment shaders simple
- Use `--turbo` flag in arcade config

**"Cannot find name 'Render3D'"**
- Make sure the extension imported successfully
- Try refreshing the page
- Check that `render3d.ts` is in your project files

## Example Project Structure

```
my-arcade-game/
├── main.ts          (your game code)
└── (import render3d extension)

or manually:

my-arcade-game/
├── main.ts          (your game code)
└── render3d.ts      (library code)
```

## Support

Check out `test.ts` for a complete working example!