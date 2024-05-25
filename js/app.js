// On loading the page, run the init function
window.onload = () => init();

// Global variables
const angle = 0.02; // rotation in radians
const colorObject = 0x3f51b5; // color
let canvas, currentObject, renderer, scene, camera;
const cameraPositionZ = 5; // camera's Z position
let currentScale = 1; // current scale
let scaleFactor = 0.1; // scale increase/decrease factor
let minScale = 0.3; // minimum size
let maxScale = 2.5; // maximum size
let mouseX, mouseY; // mouse position
let light;
let animations=[];
let objectArray=[];
let objectId=0;
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

    // *** Create a camera
    const fov = 75; // field of view
    const near = 0.1;
    const far = 200;
    // Anything before or after this range will be clipped
    const aspect = canvas.width / canvas.height;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far); // mimics the way the human eye sees
    camera.position.z = cameraPositionZ;

    //Begin ambient light
    addLight(0,0,0,0,0,0,200,200,50);
    animate();
    makeBorders();
    // *** Render
    render();
}

function makeBorders (){
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xC0C0C0});  //Silver color
    const backMaterial = new THREE.MeshBasicMaterial({ color: 0x787878});
    const leftMaterial = new THREE.MeshBasicMaterial({ color: 0x646464});
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // Black border

    let planeLeft = createPlane(edgeMaterial, leftMaterial, 20, 20);
    planeLeft.rotateY(1.57);
    planeLeft.position.set(-10, 0, -10);
    scene.add(planeLeft);

    let planeBack = createPlane(edgeMaterial, backMaterial, 20, 20);
    planeBack.position.set(0, 0, -20);
    scene.add(planeBack);

    let planeDown = createPlane(edgeMaterial, floorMaterial, 20, 20);
    planeDown.rotateX(-1.57);
    planeDown.rotateZ(-1.57);
    planeDown.position.set(0, -10, -10);
    scene.add(planeDown);

    function createPlane(edgeMaterial, material, height, width) {
        let planeGeometry = new THREE.PlaneGeometry(width, height);
        let planeMesh = new THREE.Mesh(planeGeometry, material);

        let edgesGeometry = new THREE.EdgesGeometry(planeGeometry);
        let border = new THREE.LineSegments(edgesGeometry, edgeMaterial);

        planeMesh.add(border);

        return planeMesh;
    }
}

/**
 * Draws a cube with different colors on each face.
 */
const makeCube = (h,w,d,colorType) => {
    const geometry = new THREE.BoxGeometry(w, h, d); // vertex data
    const material = new THREE.MeshBasicMaterial({color: colorType});
    const cube = new THREE.Mesh(geometry, material); // mesh objects represent drawing a specific Geometry with a specific Material

    currentObject = cube;
    /*cube.rotation.x = 1;
    cube.rotation.y = 1;
    cube.rotation.z = 1;*/
    objectArray.push(cube);
    scene.add(cube);
    /*animations.push(() => {
        cube.rotation.x += angle;
        cube.rotation.y += angle;
        cube.rotation.z += angle;
    });*/
}

const makePyramid = (h,w,colorType) => {
    //const pyramidBaseRadius = 1;
    //const pyramidHeight = 2;
    console.log(h);
    console.log(w);
    const pyramidSegments = 4; // A pyramid with a square base

    // CylinderGeometry with top radius 0 to create a pyramid shape
    const geometry = new THREE.CylinderGeometry(0, w, h, pyramidSegments);
    const material = new THREE.MeshBasicMaterial({color: colorType}); // represent the surface properties. Note: the basic material is *not* affected by lights
    const pyramid = new THREE.Mesh(geometry, material); // mesh objects represent drawing a specific Geometry with a specific Material
    currentObject = pyramid;
    objectArray.push(pyramid);
    scene.add(pyramid);
}

document.getElementById("add_light").onclick = function (){
    scene.remove(light);

    let px= document.getElementById("light_x_position");
    let py= document.getElementById("light_y_position");
    let pz= document.getElementById("light_z_position");

    let dx= document.getElementById("light_x_dir");
    let dy= document.getElementById("light_y_dir");
    let dz= document.getElementById("light_z_dir");

    let r= document.getElementById("light_r");
    let g= document.getElementById("light_g");
    let b= document.getElementById("light_b");

    if (px !== null && py !== null && pz !== null &&
        dx !== null && dy !== null && dz !== null &&
        r !== null && g !== null && b !== null) {
        console.log("luz")
        addLight(px, py, pz, dx, dy, dz, r, b, g);
    } else {
        console.error("One or more elements are null.");
        //TODO:adicionar erro a dizer que um valor é null
    }
}

function addLight(px,py,pz,dx,dy,dz,r,b,g){
    var color = new THREE.Color(r / 255, g / 255, b / 255).getHex();

    light=new THREE.AmbientLight(color,2);
}

document.getElementById("add_primitive").onclick = function (){
    let type = document.getElementById("object_selector");
    let h = document.getElementById("primitive_height");
    let w = document.getElementById("primitive_width");
    let d = document.getElementById("primitive_depth");

    let colorType = document.getElementById("primitive-color");

    let id = document.getElementById("primitive-id");
    id.textContent= objectId;
    objectId+=1;

    console.log(document.getElementById("primitive-color"));
    if (type != null && h != null && w != null && d != null) {
        createObject(type.value, h.value, w.value, d.value, colorType.value);
    } else {
        console.error("One or more elements are null.");
        //TODO:erro em html de valor nulo
    }
}


function createObject(type,h,w,d,colorType){
    switch (type) {
        case 'cube':
            makeCube(h,w,d,colorType);
            break;
        case 'pyramid':
            makePyramid(h,w,colorType);
            break;
    }
}

/**
 * The render loop.
 */
const render = () => {
    // Apply translation

    // Apply rotation

    // Apply scaling
    // Draw the scene
    animate();
    renderer.render(scene, camera);
    // Make the new frame
    requestAnimationFrame(render);
}

const animate = () => {
    for (const animation of animations) {
        animation();
    }
}
