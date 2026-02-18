// Demo for Render3D library in MakeCode Arcade

const rend = new Render3D.Renderer(160, 120);
const cube = Render3D.Geo.cube();

let t = 0;
const uni: Render3D.Uniforms = {
    model: Render3D.m4identity(),
    view: Render3D.m4identity(),
    proj: Render3D.m4perspective(Math.PI / 3, 160 / 120, 0.1, 100)
};

// Simple vertex shader
const vert: Render3D.VertShader = (pos, norm, u) => {
    // Transform position
    let p = [pos[0], pos[1], pos[2], 1];
    p = Render3D.m4mulv(u.model, p);
    p = Render3D.m4mulv(u.view, p);
    p = Render3D.m4mulv(u.proj, p);

    // Return [x,y,z,w, nx,ny,nz]
    return [p[0], p[1], p[2], p[3], norm[0], norm[1], norm[2]];
};

// Simple diffuse lighting
const frag: Render3D.FragShader = (norm, u) => {
    const light = Render3D.v3norm([1, 1, 1]);
    const intensity = Math.max(0, Render3D.v3dot(norm, light));
    return 15 - Math.floor(intensity * 15);
};

game.onUpdate(() => {
    t += 0.016;

    // Orbit camera
    const eye = Render3D.v3(Math.cos(t) * 3, Math.sin(t * 0.5) * 2, Math.sin(t) * 3);
    uni.view = Render3D.m4lookAt(eye, [0, 0, 0], [0, 1, 0]);

    // Spin cube
    uni.model = Render3D.m4mul(Render3D.m4rotY(t), Render3D.m4rotX(t * 0.7));

    rend.clear();
    rend.render(cube, vert, frag, uni);
    rend.show();
})