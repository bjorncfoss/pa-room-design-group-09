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
let manipulate= false;
const keys={};

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);


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
    camera.lookAt(0, 0, 0);
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

const addTexture = (cube) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("texture.png", (texture) => {
        cube.material.map = texture;
        cube.material.color.set(0xffffff);
        cube.material.needsUpdate = true; // Atualiza o material
    });
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


    let selectElement = document.getElementById("manipulate-objects");
    let newOption = document.createElement("option");
    newOption.value= objectId;
    newOption.text= objectId;
    selectElement.add(newOption);

    objectId+=1;
    console.log(document.getElementById("primitive-color"));
    if (type != null && h != null && w != null && d != null) {
        createObject(type.value, h.value, w.value, d.value, colorType.value);
    } else {
        console.error("One or more elements are null.");
        //TODO:erro em html de valor nulo
    }
    console.log(objectArray);
}

document.getElementById("manipulate").onclick = function (){
    manipulate=!manipulate;
}

function verifyManipulate(){
    if(manipulate==true){
        let width = document.getElementById("primitive_width");
        let height = document.getElementById("primitive_height");
        let depth = document.getElementById("primitive_depth");
        let option = document.getElementById("manipulate-objects");
        let optionSelected= option.value;
        if (keys['KeyL']){
            let options = option.options;
            scene.remove(objectArray[optionSelected]);
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === optionSelected) {
                    option.remove(i);
                    break;
                }
            }
            delete objectArray[optionSelected];
            manipulate=!manipulate;
        }
        if(keys['ArrowRight']){
            objectArray[optionSelected].position.x+=0.05;
        }
        if(keys['ArrowLeft']){
            objectArray[optionSelected].position.x-=0.05;
        }
        if(keys['ArrowUp']){
            objectArray[optionSelected].position.z+=0.05;
        }
        if(keys['ArrowDown']){
            objectArray[optionSelected].position.z-=0.05;
        }
        if(keys['PageUp']){
            objectArray[optionSelected].position.y+=0.05;
        }
        if(keys['PageDown']){
            objectArray[optionSelected].position.y-=0.05;
        }
        if(keys['KeyT']){
            addTexture(objectArray[optionSelected]);
        }
        if(keys['KeyR']){
            if(keys['KeyH']){
                objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x+0.05,objectArray[optionSelected].scale.y,objectArray[optionSelected].scale.z);
            }
            if(keys['KeyW']){
                objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x, objectArray[optionSelected].scale.y+0.05,objectArray[optionSelected].scale.z);
            }
            if(keys['KeyD']){
                objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x,objectArray[optionSelected].scale.y,objectArray[optionSelected].scale.z+0.05);
            }
        }
    }
}
function handleKeyDown(event) {
    keys[event.code] = true;
}


function handleKeyUp(event) {
    keys[event.code] = false;
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
    verifyManipulate();
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
