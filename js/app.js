import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// On loading the page, run the init function
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
const lightIntensity = 2; // light intensity
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

/**
 * Creates and adds three bordered planes (left, back, and floor) to the scene.
 */
function makeBorders (){
    // Materials for the planes
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xC0C0C0});  //Silver color
    const backMaterial = new THREE.MeshBasicMaterial({ color: 0x787878});
    const leftMaterial = new THREE.MeshBasicMaterial({ color: 0x646464});
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // Black border

    // Create and position the left plane
    let planeLeft = createPlane(edgeMaterial, leftMaterial, 20, 20);
    planeLeft.rotateY(1.57);
    planeLeft.position.set(-10, 0, -10);
    scene.add(planeLeft);

    // Create and position the back plane
    let planeBack = createPlane(edgeMaterial, backMaterial, 20, 20);
    planeBack.position.set(0, 0, -20);
    scene.add(planeBack);

    // Create and position the floor plane
    let planeDown = createPlane(edgeMaterial, floorMaterial, 20, 20);
    planeDown.rotateX(-1.57);
    planeDown.rotateZ(-1.57);
    planeDown.position.set(0, -10, -10);
    scene.add(planeDown);

    /**
     * Creates a plane mesh with a border.
     * 
     * @param {THREE.LineBasicMaterial} edgeMaterial - The material for the plane's edges.
     * @param {THREE.MeshBasicMaterial} material - The material for the plane's surface.
     * @param {number} height - The height of the plane.
     * @param {number} width - The width of the plane.
     * @returns {THREE.Mesh} The created plane mesh with a border.
     */
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
 * Draws a cube with different colors on each face and applies animation and optional texture.
 * 
 * @param {number} h - The height of the cube.
 * @param {number} w - The width of the cube.
 * @param {number} d - The depth of the cube.
 * @param {string} colorType - The type of color application ('solid' or 'texture').
 * @param {number} color - The color of the cube in hexadecimal format.
 * @param {string} [texture] - The texture to apply to the cube if colorType is 'texture'.
 * @param {number} px - The x position of the cube.
 * @param {number} py - The y position of the cube.
 * @param {number} pz - The z position of the cube.
 * @param {number} rx - The rotation speed around the x-axis.
 * @param {number} ry - The rotation speed around the y-axis.
 * @param {number} rz - The rotation speed around the z-axis.
 */
const makeCube = (h,w,d,colorType,color,texture,px,py,pz,rx,ry,rz) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshPhongMaterial({color: color});
    const cube = new THREE.Mesh(geometry, material);

    // Set the current object to the newly created cube
    currentObject = cube;
    objectArray.push(cube);

    // Set the position of the cube
    cube.position.set(px,py,pz);

    // Function to animate the cube 
    const animateCube = () => {
        cube.rotation.x += (rx*0.01);
        cube.rotation.y += (ry*0.01);
        cube.rotation.z += (rz*0.01);
    };

    // Add the cube to the scene
    scene.add(cube);

    // Add the animation function to the animations array
    animations.push(animateCube);

    // Apply texture if specified
    if (colorType==='texture'){
        addTexture(cube,texture);
    }
}

/**
 * Draws a pyramid with a specified color or texture, and applies animation.
 * 
 * @param {number} h - The height of the pyramid.
 * @param {number} w - The width of the pyramid's base.
 * @param {string} colorType - The type of color application ('solid' or 'texture').
 * @param {number} color - The color of the pyramid in hexadecimal format.
 * @param {string} [texture] - The texture to apply to the pyramid if colorType is 'texture'.
 * @param {number} px - The x position of the pyramid.
 * @param {number} py - The y position of the pyramid.
 * @param {number} pz - The z position of the pyramid.
 * @param {number} rx - The rotation speed around the x-axis.
 * @param {number} ry - The rotation speed around the y-axis.
 * @param {number} rz - The rotation speed around the z-axis.
 */
const makePyramid = (h,w,colorType,color,texture,px,py,pz,rx,ry,rz) => {
    const pyramidSegments = 4;
    const geometry = new THREE.CylinderGeometry(0, w, h, pyramidSegments);
    const material = new THREE.MeshPhongMaterial({color: color});
    const pyramid = new THREE.Mesh(geometry, material);

    // Set the current object to the newly created pyramid
    currentObject = pyramid;
    objectArray.push(pyramid);

    // Set the position of the pyramid
    pyramid.position.set(px,py,pz);

    // Function to animate the pyramid
    const animatePyramid = () => {
        pyramid.rotation.x += (rx*0.01);
        pyramid.rotation.y += (ry*0.01);
        pyramid.rotation.z += (rz*0.01);
    };

    // Add the pyramid to the scene
    scene.add(pyramid);

    // Add the animation function to the animations array
    animations.push(animatePyramid);
    
    // Apply texture if specified
    if (colorType==='texture'){
        addTexture(pyramid,texture);
    }
}


/**
 * Adds a texture to a given cube.
 * 
 * @param {THREE.Mesh} cube - The cube to which the texture will be applied.
 * @param {string} path - The path to the texture image file.
 */
const addTexture = (cube,path) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(path, (texture) => {
        cube.material.map = texture;
        cube.material.color.set(0xffffff);
        cube.material.needsUpdate = true;
    });
}

/**
 * Event handler for adding a light to the scene. 
 * Removes the existing light and creates a new directional light with specified parameters.
 */
document.getElementById("add_light").onclick = function (){
    // Remove the existing light from the scene
    scene.remove(light);

    // Get position inputs
    let px= document.getElementById("light_x_position");
    let py= document.getElementById("light_y_position");
    let pz= document.getElementById("light_z_position");

    // Get direction inputs
    let dx= document.getElementById("light_x_dir");
    let dy= document.getElementById("light_y_dir");
    let dz= document.getElementById("light_z_dir");

    // Get color input
    let color = document.getElementById("light-color");

    // Check if all inputs are not null
    if (px.value !== null && py.value !== null && pz.value !== null && dx.value !== null && dy.value !== null && dz.value !== null && color.value !== null ) {
        // Create a new directional light with the specified parameters
        makeLight("directional",px.value,py.value,pz.value,dx.value,dy.value,dz.value,color.value);
    } else {
        console.error("One or more elements are null.");
    }
    
}


/**
 * Creates and adds a light to the scene based on the specified parameters.
 * 
 * @param {string} lightType - The type of the light ('ambient' or 'directional').
 * @param {number} px - The x position of the light.
 * @param {number} py - The y position of the light.
 * @param {number} pz - The z position of the light.
 * @param {number} dx - The x direction of the light (used for directional light).
 * @param {number} dy - The y direction of the light (used for directional light).
 * @param {number} dz - The z direction of the light (used for directional light).
 * @param {string} color - The color of the light in hexadecimal format.
 */
const makeLight = (lightType,px,py,pz,dx,dy,dz,color) => {
    switch (lightType) {
        case "ambient": // Light that illuminates all directions
            light = new THREE.AmbientLight(colorLight, lightIntensity);
            break;
        case "directional": // Light that shines in the direction of its target
            light = new THREE.DirectionalLight(color, lightIntensity);
            light.position.set(px, py, pz);
            light.target.position.set(dx, dy, dz);
            scene.add(light);
            break;
    }
    scene.add(light);
}

/**
 * Event handler for adding a primitive object to the scene.
 * Retrieves input values from the form, creates the object, and updates the scene.
 */
document.getElementById("add_primitive").onclick = function (){
    // Get object type and dimensions
    let type = document.getElementById("object_selector");
    let h = document.getElementById("primitive_height");
    let w = document.getElementById("primitive_width");
    let d = document.getElementById("primitive_depth");

    // Get position inputs
    let px = document.getElementById("primitive_pos_x");
    let py = document.getElementById("primitive_pos_y");
    let pz = document.getElementById("primitive_pos_z");

    // Get rotation inputs
    let rx = document.getElementById("primitive_rot_x");
    let ry = document.getElementById("primitive_rot_y");
    let rz = document.getElementById("primitive_rot_z");

    // Get color/texture inputs
    let colorType = document.getElementById("filling-selector");
    let color = document.getElementById("primitive-color");
    let textureInput = document.getElementById("primitive-texture");

    // Get and set the primitive ID
    let id = document.getElementById("primitive-id");
    let textureName= textureInput.name+".png";
    id.textContent= objectId;

    // Add new object ID to the selection dropdown
    let selectElement = document.getElementById("manipulate-objects");
    let newOption = document.createElement("option");
    newOption.value= objectId;
    newOption.text= objectId;
    selectElement.add(newOption);

    // Increment the objects ID for the next object
    objectId+=1;

    // Check that all necessary inputs are not null
    if (h.value !== null && w.value !== null && d.value !== null && px.value !== null && py.value !== null && pz.value !== null && rx.value !== null && ry.value !== null && rz.value !== null && color.value !== null ) {
        // Create the object with the specified parameters
        createObject(type.value, h.value, w.value, d.value, colorType.value,color.value,textureName,px.value,py.value,pz.value,rx.value,ry.value,rz.value);
    } else {
        console.error("One or more elements are null.");
    }
}

/**
 * Creates a 3D object based on the specified type, dimensions, color/texture, position, and rotation.
 * 
 * @param {string} type - The type of the object ('cube' or 'pyramid').
 * @param {number} h - The height of the object.
 * @param {number} w - The width of the object.
 * @param {number} d - The depth of the object (only applicable for cubes).
 * @param {string} colorType - The type of color application ('solid' or 'texture').
 * @param {string} color - The color of the object in hexadecimal format.
 * @param {string} texture - The path to the texture file (only applicable for textured objects).
 * @param {number} px - The x position of the object.
 * @param {number} py - The y position of the object.
 * @param {number} pz - The z position of the object.
 * @param {number} rx - The rotation speed around the x-axis.
 * @param {number} ry - The rotation speed around the y-axis.
 * @param {number} rz - The rotation speed around the z-axis.
 */
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


/**
 * Event handler for adding a 3D model to the scene.
 * Retrieves input values from the form and adds the model to the scene.
 */
document.getElementById("add-model").onclick = function () {
    // Get position inputs
    let px = document.getElementById("primitive_pos_x");
    let py = document.getElementById("primitive_pos_y");
    let pz = document.getElementById("primitive_pos_z");

    // Get rotation inputs
    let rx = document.getElementById("primitive_rot_x");
    let ry = document.getElementById("primitive_rot_y");
    let rz = document.getElementById("primitive_rot_z");

    // Get and set the model ID
    let id = document.getElementById("primitive-id");
    id.textContent= objectId;

    // Add new model ID to the selection dropdown
    let selectElement = document.getElementById("manipulate-objects");
    let newOption = document.createElement("option");
    newOption.value= objectId;
    newOption.text= objectId;
    selectElement.add(newOption);

    // Increment the objects ID for the next object
    objectId+=1;

    // Get the selected model file
    let obj = document.getElementById("model-file").files[0].name.replace('.obj', '');

    // Add the model to the scene with the specified parameters
    addModel(px.value,py.value,pz.value, obj,rx.value,ry.value,rz.value);
}


/**
 * Adds a 3D model to the scene with the specified position, rotation, and texture.
 * 
 * @param {number} x - The x position of the model.
 * @param {number} y - The y position of the model.
 * @param {number} z - The z position of the model.
 * @param {string} obj - The name of the model file without extension.
 * @param {number} rx - The rotation speed around the x-axis.
 * @param {number} ry - The rotation speed around the y-axis.
 * @param {number} rz - The rotation speed around the z-axis.
 */
function addModel(x, y, z,obj,rx,ry,rz) {
    const textureLoader = new THREE.TextureLoader();
    let texture;

    // Load texture based on the model name
    if (obj== "astronaut" || obj == "cat"){
        texture = textureLoader.load('/modelos/'+obj+'.png');
    }
    else{
        texture = textureLoader.load('/modelos/'+obj+'.jpg');
    }

    // Load the model file
    objLoader.load(
        '/modelos/'+obj+'.obj',
        function ( object ) {
            object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.material.map = texture;
                }
            });

            // Set scale based on the model type
            if(obj =="astronaut"){
                object.scale.set(1, 1, 1);
            }else if(obj=="bird"){
                object.scale.set(0.1, 0.1, 0.1);
            }else if(obj=="tiger"){
                object.scale.set(0.001, 0.001, 0.001);
            }else{
                object.scale.set(0.1, 0.1, 0.1);
            }
            // Set position of the object
            object.position.set(x,y,z);

            objectArray.push(object);

            // Function to animate the object
            const animateObj = () => {
                object.rotation.x += (rx*0.01);
                object.rotation.y += (ry*0.01);
                object.rotation.z += (rz*0.01);
            };

            // Add the object to the scene
            scene.add( object );
            
            // Add the animation function to the animations array
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

/**
 * Event handler for toggling the manipulate variable and updating the UI.
 * 
 * @event click
 */
document.getElementById("manipulate").onclick = function (){
    // Toggle the manipulate variable
    manipulate=!manipulate;

    // Update the UI to display the current value of manipulate
    let showManipulate= document.getElementById("manipulate-variable");
    showManipulate.innerHTML = "manipulate: "+manipulate;
}

/**
 * Verifies the manipulation of objects based on keyboard inputs.
 * If manipulate is true, performs various operations such as moving, scaling, and removing objects.
 * 
 * @function verifyManipulate
 */
function verifyManipulate(){
    if(manipulate==true){
        let width = document.getElementById("primitive_width");
        let height = document.getElementById("primitive_height");
        let depth = document.getElementById("primitive_depth");
        let option = document.getElementById("manipulate-objects");
        let optionSelected= option.value;

        // Remove the selected object if 'L' key is pressed
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

        // Move the selected object based on arrow key inputs
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

         // Apply texture to the selected object if 'T' key is pressed
        if(keys['KeyT']){
            addTexture(objectArray[optionSelected],"texture_3.png");
        }

        //TODO:Add verification to avoid negative numbers and huge objects
        // Scale the selected object based on 'I' and 'O' key inputs
        if(keys['KeyI']){
            if(keys['KeyH']){
                if(objectArray[optionSelected].scale.x<3){      
                    objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x+0.05,objectArray[optionSelected].scale.y,objectArray[optionSelected].scale.z);
                }
            }
            if(keys['KeyJ']){
                if(objectArray[optionSelected].scale.y<3){
                    objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x, objectArray[optionSelected].scale.y+0.05,objectArray[optionSelected].scale.z);
                }
            }
            if(keys['KeyK']){
                if(objectArray[optionSelected].scale.z<3){
                    objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x,objectArray[optionSelected].scale.y,objectArray[optionSelected].scale.z+0.05);
                }
            }
        }
        if(keys['KeyO']){
            if(keys['KeyH']){
                if(objectArray[optionSelected].scale.x>=0.2){
                    objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x-0.05,objectArray[optionSelected].scale.y,objectArray[optionSelected].scale.z);
                }
            }
            if(keys['KeyJ']){
                if(objectArray[optionSelected].scale.y>=0.2){
                    objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x, objectArray[optionSelected].scale.y-0.05,objectArray[optionSelected].scale.z);
                }
            }
            if(keys['KeyK']){
                if(objectArray[optionSelected].scale.z>=0.2){
                    objectArray[optionSelected].scale.set(objectArray[optionSelected].scale.x,objectArray[optionSelected].scale.y,objectArray[optionSelected].scale.z-0.05);
                }
            }
        }
    }
}


/**
 * Handles keydown events by updating the keys object with the corresponding key code.
 * 
 * @param {Event} event - The keydown event object.
 */
function handleKeyDown(event) {
    keys[event.code] = true;
}


/**
 * Handles keyup events by updating the keys object with the corresponding key code.
 * 
 * @param {Event} event - The keyup event object.
 */
function handleKeyUp(event) {
    keys[event.code] = false;
}


/**
 * Handles mousemove events by updating the mouseX and mouseY variables based on the cursor position.
 * 
 * @param {Event} event - The mousemove event object.
 */
function handleMouseMove(event) {
    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;

    mouseX = (clientX / innerWidth) * 2 - 1;
    mouseY = (clientY / innerHeight) * 2 - 1;
}

/**
 * The render loop function.
 * 
 * This function continuously renders the scene and handles object manipulation based on user input.
 * 
 * @function render
 */
const render = () => {
    // Verify if manipulation is enabled and perform necessary actions
    verifyManipulate();

    // Draw the scene
    renderer.render(scene, camera);
    
    // Request the next frame to continue the animation loop
    requestAnimationFrame(render);
}

/**
 * Animates the scene based on user input and registered animations.
 * 
 * @function animate
 */
function animate(){
    // Request the next animation frame
    requestAnimationFrame(animate);

    // Speed of camera movement
    const speed = 0.1;

    // Move the camera based on keyboard inputs
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


    // Calculate mouse movement delta
    const mouseDeltaX = mouseX - prevMouseX;
    const mouseDeltaY = mouseY - prevMouseY;

    // Rotate the camera based on mouse movement
    camera.rotation.y -= mouseDeltaX * mouseSensitivity;

    // Calculate new rotation angle for camera's vertical rotation
    const newRotationX = camera.rotation.x - mouseDeltaY * mouseSensitivity;

    // Limit the vertical rotation angle to prevent camera flipping
    const maxRotationX = Math.PI / 2 - 0.1;
    const minRotationX = -Math.PI / 2 + 0.1;
    camera.rotation.x = Math.max(minRotationX, Math.min(maxRotationX, newRotationX));

    // Update previous mouse positions
    prevMouseX = mouseX;
    prevMouseY = mouseY;

    // Execute registered animations
    for (const animation of animations) {
        animation();
    }

    // Render the scene
    renderer.render(scene, camera);
}
