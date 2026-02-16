// Test/Demo for Render3D library in MakeCode Arcade

// Initialize renderer (160x120 matches arcade screen)
const renderer = new Render3D.Renderer(160, 120);

// Create a cube
const cube = Render3D.Geometry.createCube();

// Setup camera and projection matrices
let time = 0;
const uniforms: Render3D.Uniforms = {
    modelMatrix: Render3D.Mat4.identity(),
    viewMatrix: Render3D.Mat4.identity(),
    projectionMatrix: Render3D.Mat4.perspective(
        Math.PI / 3,  // 60 degree FOV
        160 / 120,    // aspect ratio
        0.1,          // near plane
        100           // far plane
    )
};

// Vertex Shader: Transform vertices
const vertexShader: Render3D.VertexShader = (attrs, uniforms) => {
    const pos = new Render3D.Vec4(
        attrs.position.x,
        attrs.position.y,
        attrs.position.z,
        1.0
    );
    
    // Apply model, view, projection transforms
    let transformed = Render3D.Mat4.multiplyVec4(uniforms.modelMatrix, pos);
    transformed = Render3D.Mat4.multiplyVec4(uniforms.viewMatrix, transformed);
    transformed = Render3D.Mat4.multiplyVec4(uniforms.projectionMatrix, transformed);
    
    return {
        position: transformed,
        normal: attrs.normal
    };
};

// Fragment Shader: Simple diffuse lighting (white to black)
const fragmentShader: Render3D.FragmentShader = (varying, uniforms) => {
    const normal = varying.normal as Render3D.Vec3;
    const lightDir = Render3D.Vec3.normalize(new Render3D.Vec3(1, 1, 1));
    
    // Calculate lighting
    const intensity = Math.max(0, Render3D.Vec3.dot(normal, lightDir));
    
    // Return grayscale value (15=white, 0=black)
    return 15 - Math.floor(intensity * 15);
};

// Main game loop
game.onUpdate(function () {
    time += 0.016; // ~60fps
    
    // Animate camera position
    const radius = 3;
    const eye = new Render3D.Vec3(
        Math.cos(time) * radius,
        Math.sin(time * 0.5) * 2,
        Math.sin(time) * radius
    );
    const target = new Render3D.Vec3(0, 0, 0);
    const up = new Render3D.Vec3(0, 1, 0);
    
    uniforms.viewMatrix = Render3D.Mat4.lookAt(eye, target, up);
    
    // Rotate the cube
    const rotX = Render3D.Mat4.rotateX(time * 0.7);
    const rotY = Render3D.Mat4.rotateY(time);
    uniforms.modelMatrix = Render3D.Mat4.multiply(rotY, rotX);
    
    // Render
    renderer.clear();
    renderer.render(cube, vertexShader, fragmentShader, uniforms);
    renderer.display();
})