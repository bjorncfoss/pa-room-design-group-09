// On loading the page, run the init function
window.onload = () => init();

// Global variables
const angle = 0.02; // rotation in radians
const colorObject = 0x3f51b5; // color
let canvas, currentObject, renderer, scene, camera;
const cameraPositionZ = 4; // camera's Z position
let currentScale = 1; // current scale
let scaleFactor = 0.1; // scale increase/decrease factor
let minScale = 0.3; // minimum size
let maxScale = 2.5; // maximum size
let mouseX, mouseY; // mouse position

// Sets listeners for the object selector
document.getElementById("object_selector").onchange = function () {
    let object = document.getElementById("object_selector").value;
    scene.remove(currentObject);
    switch (object) {
        case 'cube':
            makeCube();
            break;
        case 'cone':
            makeCone();
            break;
        case 'cylinder':
            makeCylinder();
            break;
        case 'sphere':
            makeSphere();
            break;
    }
};

// Sets listeners for the mouse position
document.getElementById("gl-canvas").onmousemove = function (event) {
    mouseX = (event.x / canvas.width) * cameraPositionZ - cameraPositionZ / 2;
    mouseY = -(event.y / canvas.height) * cameraPositionZ + cameraPositionZ / 2;
}

// Sets listeners for the mouse wheel
document.getElementById("gl-canvas").onwheel = function (event) {
    if (event.deltaY > 0) {
        currentScale += scaleFactor;
        if (currentScale > maxScale) {
            currentScale = maxScale;
        }
    } else {
        currentScale -= scaleFactor;
        if (currentScale < minScale) {
            currentScale = minScale;
        }
    }
}

/**
 * Initializes the WebGL application
 */
const init = () => {

    // *** Get canvas
    canvas = document.getElementById('gl-canvas');

    // *** Create a render
    // Render is the main object of three.js used to draw scenes to a canvas
    renderer = new THREE.WebGLRenderer({canvas});
    renderer.setClearColor(0xffffff);

    // *** Create a scene
    // Scene defines properties like the background, and defines the objects to be rendered
    scene = new THREE.Scene();

    // *** Computes the cube
    makeCube();

    // *** Create a camera
    const fov = 75; // field of view
    const near = 0.1;
    const far = 5;
    // Anything before or after this range will be clipped
    const aspect = canvas.width / canvas.height;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far); // mimics the way the human eye sees
    camera.position.z = cameraPositionZ;

    // *** Render
    render();

}

/**
 * Draws a cube with different colors on each face.
 */
const makeCube = () => {
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth); // vertex data
    const materials = [
        new THREE.MeshBasicMaterial({color: 0xff0000}), // red
        new THREE.MeshBasicMaterial({color: 0x00ff00}), // green
        new THREE.MeshBasicMaterial({color: 0x0000ff}), // blue
        new THREE.MeshBasicMaterial({color: 0xffff00}), // yellow
        new THREE.MeshBasicMaterial({color: 0x00ffff}), // cyan
        new THREE.MeshBasicMaterial({color: 0xff00ff})  // magenta
    ];
    const cube = new THREE.Mesh(geometry, materials); // mesh objects represent drawing a specific Geometry with a specific Material
    currentObject = cube;
    scene.add(cube);
}


/**
 * Draws a cone with different characteristics.
 */
const makeCone = () => {
    const coneRadius = 1;
    const coneHeight = 2;
    const coneRadialSegments = 20;
    const geometry = new THREE.ConeGeometry(coneRadius, coneHeight, coneRadialSegments); // vertex data
    const material = new THREE.MeshBasicMaterial({color: colorObject}); // represent the surface properties. Note: the basic material is *not* affected by lights
    const cone = new THREE.Mesh(geometry, material); // mesh objects represent drawing a specific Geometry with a specific Material
    currentObject = cone
    scene.add(cone);
}

/**
 * Draws a cylinder with different characteristics.
 */
const makeCylinder = () => {
    const cylinderRadiusTop = 1;
    const cylinderRadiusBottom = 1;
    const cylinderHeight = 2;
    const cylinderRadialSegments = 20;
    const geometry = new THREE.CylinderGeometry(cylinderRadiusTop, cylinderRadiusBottom, cylinderHeight, cylinderRadialSegments); // vertex data
    const material = new THREE.MeshBasicMaterial({color: colorObject}); // represent the surface properties. Note: the basic material is *not* affected by lights
    const cylinder = new THREE.Mesh(geometry, material); // mesh objects represent drawing a specific Geometry with a specific Material
    currentObject = cylinder
    scene.add(cylinder);
}

/**
 * Draws a sphere with different characteristics.
 */
const makeSphere = () => {
    const sphereRadius = 1;
    const geometry = new THREE.SphereGeometry(sphereRadius); // vertex data
    const material = new THREE.MeshBasicMaterial({color: colorObject}); // represent the surface properties. Note: the basic material is *not* affected by lights
    const sphere = new THREE.Mesh(geometry, material); // mesh objects represent drawing a specific Geometry with a specific Material
    currentObject = sphere
    scene.add(sphere);
}

/**
 * The render loop.
 */
const render = () => {
    // Apply translation
    currentObject.position.set(mouseX, mouseY);
    // Apply rotation
    currentObject.rotation.x += angle;
    currentObject.rotation.y += angle;
    // Apply scaling
    currentObject.scale.set(currentScale, currentScale, currentScale);
    // Draw the scene
    renderer.render(scene, camera);
    // Make the new frame
    requestAnimationFrame(render);
}


