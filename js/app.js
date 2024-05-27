import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';


// On loading the page, run the init function
//window.onload = () => init();
window.onload = () => {
    init()
    document.addEventListener('mousemove', handleMouseMove);
};
// Global variables
const angle = 0.02; // rotation in radians
const colorObject = 0x3f51b5; // color
const objLoader = new OBJLoader();
let canvas, currentObject, renderer, scene, camera;
const cameraPositionZ = 5; // camera's Z position
let currentScale = 1; // current scale
let scaleFactor = 0.1; // scale increase/decrease factor
let minScale = 0.3; // minimum size
let maxScale = 2.5; // maximum size
let prevMouseX=0;
let prevMouseY=0;
const mouseSensitivity = 0.7;
let mouseX=0; 
let mouseY=0; // mouse position
const colorLight = 0xffff00; // light color
const lightIntensity = 100; // light intensity
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
    makeLight("ambient",0,0,0,0,0,0,0);
    makeBorders();
    // *** Render
    render();
    animate();
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
const makeCube = (h,w,d,colorType,color,texture,px,py,pz,rx,ry,rz) => {
    const geometry = new THREE.BoxGeometry(w, h, d); // vertex data
    const material = new THREE.MeshPhongMaterial({color: color});
    //const material = new THREE.MeshBasicMaterial({color: color});
    const cube = new THREE.Mesh(geometry, material); // mesh objects represent drawing a specific Geometry with a specific Material
    currentObject = cube;
    /*cube.rotation.x = 1;
    cube.rotation.y = 1;
    cube.rotation.z = 1;*/
    objectArray.push(cube);
    cube.position.set(px,py,pz);
    const animateCube = () => {
        cube.rotation.x += (rx*0.01);
        cube.rotation.y += (ry*0.01);
        cube.rotation.z += (rz*0.01);
    };
    scene.add(cube);
    animations.push(animateCube);
    if (colorType==='texture'){
        addTexture(cube,texture);
    }
}

const makePyramid = (h,w,colorType,color,texture,px,py,pz,rx,ry,rz) => {
    console.log(h);
    console.log(w);
    const pyramidSegments = 4; // A pyramid with a square base

    // CylinderGeometry with top radius 0 to create a pyramid shape
    const geometry = new THREE.CylinderGeometry(0, w, h, pyramidSegments);
    const material = new THREE.MeshPhongMaterial({color: color, emissive: 0xd95000, shininess: 35});
    //const material = new THREE.MeshBasicMaterial({color: color}); // represent the surface properties. Note: the basic material is *not* affected by lights
    const pyramid = new THREE.Mesh(geometry, material); // mesh objects represent drawing a specific Geometry with a specific Material
    currentObject = pyramid;
    objectArray.push(pyramid);
    pyramid.position.set(px,py,pz);
    const animatePyramid = () => {
        pyramid.rotation.x += (rx*0.01);
        pyramid.rotation.y += (ry*0.01);
        pyramid.rotation.z += (rz*0.01);
    };
    scene.add(pyramid);
    animations.push(animatePyramid);
    if (colorType==='texture'){
        addTexture(pyramid,texture);
    }
}

const addTexture = (cube,path) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(path, (texture) => {
        cube.material.map = texture;
        cube.material.color.set(0xffffff);
        cube.material.needsUpdate = true; // Atualiza o material
    });
}

document.getElementById("add_light").onclick = function (){
    scene.remove(light);

    let px= document.getElementById("light_x_position");
    let py= document.getElementById("light_y_position");
    let pz= document.getElementById("light_z_position");

    let dx= document.getElementById("light_x_dir");
    let dy= document.getElementById("light_y_dir");
    let dz= document.getElementById("light_z_dir");

    let color = document.getElementById("light-color");

    makeLight("directional",px.value,py.value,pz.value,dx.value,dy.value,dz.value,color.value);
    /*if (px !== null && py !== null && pz !== null &&
        dx !== null && dy !== null && dz !== null &&
        r !== null && g !== null && b !== null) {
        console.log("luz")
        addLight(px, py, pz, dx, dy, dz, r, b, g);
    } else {
        console.error("One or more elements are null.");
        //TODO:adicionar erro a dizer que um valor é null
    }*/
    
}

const makeLight = (lightType,px,py,pz,dx,dy,dz,color) => {
    switch (lightType) {
        case "ambient": // light that shoots light in all directions
            light = new THREE.AmbientLight(colorLight, lightIntensity);
            break;
        case "directional": // often used to represent the sun, and will shine in the direction of its target
            light = new THREE.DirectionalLight(color, lightIntensity);
            light.position.set(px, py, pz);
            light.target.position.set(dx, dy, dz);
            scene.add(light);
            break;
    }
    scene.add(light);
}


document.getElementById("add_primitive").onclick = function (){
    let type = document.getElementById("object_selector");
    let h = document.getElementById("primitive_height");
    let w = document.getElementById("primitive_width");
    let d = document.getElementById("primitive_depth");

    let px = document.getElementById("primitive_pos_x");
    let py = document.getElementById("primitive_pos_y");
    let pz = document.getElementById("primitive_pos_z");

    let rx = document.getElementById("primitive_rot_x");
    let ry = document.getElementById("primitive_rot_y");
    let rz = document.getElementById("primitive_rot_z");

    let colorType = document.getElementById("filling-selector");
    let color = document.getElementById("primitive-color");
    let textureInput = document.getElementById("primitive-texture");
    let id = document.getElementById("primitive-id");
    console.log(colorType.value);
    let textureName= textureInput.name+".png";

    id.textContent= objectId;
    let selectElement = document.getElementById("manipulate-objects");
    let newOption = document.createElement("option");
    newOption.value= objectId;
    newOption.text= objectId;
    selectElement.add(newOption);

    objectId+=1;
    console.log(document.getElementById("primitive-color"));
    if (type != null && h != null && w != null && d != null) {
        createObject(type.value, h.value, w.value, d.value, colorType.value,color.value,textureName,px.value,py.value,pz.value,rx.value,ry.value,rz.value);
    } else {
        console.error("One or more elements are null.");
        //TODO:erro em html de valor nulo
    }
    console.log(objectArray);
}

function createObject(type,h,w,d,colorType,color,texture,px,py,pz,rx,ry,rz){
    switch (type) {
        case 'cube':
            makeCube(h,w,d,colorType,color,texture,px,py,pz,rx,ry,rz);
            break;
        case 'pyramid':
            makePyramid(h,w,colorType,color,texture,px,py,pz,rx,ry,rz);
            break;
    }
}
document.getElementById("add-model").onclick = function () {
    let px = document.getElementById("primitive_pos_x");
    let py = document.getElementById("primitive_pos_y");
    let pz = document.getElementById("primitive_pos_z");

    let rx = document.getElementById("primitive_rot_x");
    let ry = document.getElementById("primitive_rot_y");
    let rz = document.getElementById("primitive_rot_z");

    let id = document.getElementById("primitive-id");

    id.textContent= objectId;
    let selectElement = document.getElementById("manipulate-objects");
    let newOption = document.createElement("option");
    newOption.value= objectId;
    newOption.text= objectId;
    selectElement.add(newOption);

    objectId+=1;

    let obj = document.getElementById("model-file").files[0].name.replace('.obj', '');
    //addModel(obj,px.value,py.value,pz.value,rx.value,ry.value,rz.value);
    addModel(px.value,py.value,pz.value, obj,rx.value,ry.value,rz.value);
}

function addModel(x, y, z,obj,rx,ry,rz) {
    const textureLoader = new THREE.TextureLoader();
    let texture;
    if (obj== "astronaut" || obj == "cat"){
        texture = textureLoader.load('/modelos/'+obj+'.png');
    }
    else{
        texture = textureLoader.load('/modelos/'+obj+'.jpg');
    }

    objLoader.load(
        '/modelos/'+obj+'.obj',
        function ( object ) {
            object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.material.map = texture;
                }
            });
            object.scale.set(0.01, 0.01, 0.01);
            object.position.set(x,y,z);
            objectArray.push(object);
            const animateObj = () => {
                object.rotation.x += (rx*0.01);
                object.rotation.y += (ry*0.01);
                object.rotation.z += (rz*0.01);
            };
            scene.add( object );
            animations.push(animateObj);
        },
        function ( xhr ) {
    
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
        },
        function ( error ) {
    
            console.log( 'An error happened' );
    
        }
    );
}


document.getElementById("manipulate").onclick = function (){
    manipulate=!manipulate;
    let showManipulate= document.getElementById("manipulate-variable");
    showManipulate.innerHTML = "manipulate: "+manipulate;
}

function verifyManipulate(){
    if(manipulate==true){
        let width = document.getElementById("primitive_width");
        let height = document.getElementById("primitive_height");
        let depth = document.getElementById("primitive_depth");
        let option = document.getElementById("manipulate-objects");
        let optionSelected= option.value;
        let texture = document.getElementById("primitive-texture");
        let textureName= texture.name+".png";
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
            objectArray[optionSelected].position.x = parseFloat(objectArray[optionSelected].position.x) + 0.05;
        }
        if(keys['ArrowLeft']){
            objectArray[optionSelected].position.x = parseFloat(objectArray[optionSelected].position.x) - 0.05;
        }
        if(keys['ArrowUp']){
            objectArray[optionSelected].position.z = parseFloat(objectArray[optionSelected].position.z) + 0.05;
        }
        if(keys['ArrowDown']){
            objectArray[optionSelected].position.z = parseFloat(objectArray[optionSelected].position.z) - 0.05;
        }
        if(keys['PageUp']){
            objectArray[optionSelected].position.y = parseFloat(objectArray[optionSelected].position.y) + 0.05;
        }
        if(keys['PageDown']){
            objectArray[optionSelected].position.y = parseFloat(objectArray[optionSelected].position.y) - 0.05;
        }
        if(keys['KeyT']){
            //let texture = document.getElementById("primitive-texture");
            //let textureName= texture.name+".png";
            addTexture(objectArray[optionSelected],textureName);
        }
        //TODO:Add verification to avoid negative numbers and huge objects
        if(keys['KeyI']){
            if(keys['KeyH']){
                objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x+0.05,objectArray[optionSelected].scale.y,objectArray[optionSelected].scale.z);
            }
            if(keys['KeyJ']){
                objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x, objectArray[optionSelected].scale.y+0.05,objectArray[optionSelected].scale.z);
            }
            if(keys['KeyK']){
                objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x,objectArray[optionSelected].scale.y,objectArray[optionSelected].scale.z+0.05);
            }
        }
        if(keys['KeyO']){
            if(keys['KeyH']){
                objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x-0.05,objectArray[optionSelected].scale.y,objectArray[optionSelected].scale.z);
            }
            if(keys['KeyJ']){
                objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x, objectArray[optionSelected].scale.y-0.05,objectArray[optionSelected].scale.z);
            }
            if(keys['KeyK']){
                objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x,objectArray[optionSelected].scale.y,objectArray[optionSelected].scale.z-0.05);
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

function handleMouseMove(event) {
    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;

    mouseX = (clientX / innerWidth) * 2 - 1;
    mouseY = (clientY / innerHeight) * 2 - 1;
}

/**
 * The render loop.
 */
const render = () => {
    verifyManipulate();
    // Draw the scene

    renderer.render(scene, camera);
    // Make the new frame
    requestAnimationFrame(render);
}

function animate(){
    requestAnimationFrame(animate);;
    const speed = 0.1;
  if (keys['KeyW']) {
    camera.position.x -= Math.sin(camera.rotation.y) * speed;
    camera.position.z -= Math.cos(camera.rotation.y) * speed;
  }
  if (keys['KeyD']) {
    camera.position.x -= Math.sin(camera.rotation.y - Math.PI / 2) * speed;
    camera.position.z -= Math.cos(camera.rotation.y - Math.PI / 2) * speed;
  }
  if (keys['KeyS']) {
    camera.position.x += Math.sin(camera.rotation.y) * speed;
    camera.position.z += Math.cos(camera.rotation.y) * speed;
  }
  if (keys['KeyA']) {
    camera.position.x += Math.sin(camera.rotation.y - Math.PI / 2) * speed;
    camera.position.z += Math.cos(camera.rotation.y - Math.PI / 2) * speed;
  }

  const mouseDeltaX = mouseX - prevMouseX;
  const mouseDeltaY = mouseY - prevMouseY;

  camera.rotation.y -= mouseDeltaX * mouseSensitivity;

  const newRotationX = camera.rotation.x - mouseDeltaY * mouseSensitivity;

  const maxRotationX = Math.PI / 2 - 0.1;
  const minRotationX = -Math.PI / 2 + 0.1;
  camera.rotation.x = Math.max(minRotationX, Math.min(maxRotationX, newRotationX));

  prevMouseX = mouseX;
  prevMouseY = mouseY;

    for (const animation of animations) {
        animation();
    }
    renderer.render(scene, camera);
}
