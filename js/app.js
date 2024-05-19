let pointsArray = [];
let texCoordsArray = [];

let gl;
let ctm;
let projMatrix;
let modelViewMatrix;

let program;

const angle = 0.02; // rotation in radians

// constants for rotating
let xAxis = 0;
let yAxis = 1;
let zAxis = 2;
let axis = xAxis;

//stuff to load the models
var model_src = "modelos/tiger.obj";
var model_texture = "modelos/tiger_texture.jpg";
var model_data;

window.onload = function () {
    init();
}

async function init() {

    // *** Get canvas ***
    const canvas = document.getElementById('gl-canvas');

    /** @type {WebGLRenderingContext} */ // ONLY FOR VS CODE
    gl = canvas.getContext('webgl') || canvas.getContext("experimental-webgl");
    if (!gl) {
        alert('WebGL not supported');
        return;
    }

    var aspectRatio =  canvas.width / canvas.height;

    //** Load the models */
    const model_content =  await loadObjResource(model_src);
    data =  parseOBJ(model_content);
    pointsArray = data.position;
    texCoordsArray = data.texcoord;
    vertexNormals = data.normal;

    normalize(pointsArray);// easier to visualize

    // *** Set viewport ***
    gl.viewport(0, 0, canvas.width, canvas.height)

    // *** Set color to the canvas ***
    gl.clearColor(1.0, 1.0, 1.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // *** Initialize vertex and fragment shader ***
    program = await initShaders(gl);
    gl.useProgram(program);

    // *** Send position data to the GPU ***
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointsArray), gl.STATIC_DRAW);

    // *** Define the form of the data ***
    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    // *** Send texture data to the GPU ***
    let tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoordsArray), gl.STATIC_DRAW);

    // *** Define the form of the data ***
    let vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.enableVertexAttribArray(vTexCoord);
    gl.vertexAttribPointer(vTexCoord, 3, gl.FLOAT, false, 0, 0);



    //* * Send normal vector data to the GPU ***
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    var vNormData = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(vNormData, 3, gl.FLOAT, gl.TRUE, 0, 0);
    gl.enableVertexAttribArray(vNormData);
    
    /*Lighthing information*/
    amibientLightUniformLocation =  gl.getUniformLocation(program,'fambientLightIntensity');
    sunlightIntensityUniformLocation =  gl.getUniformLocation(program,'sun.color');
    sunlightDirectionUniformLocation =  gl.getUniformLocation(program,'sun.direction');


    gl.uniform3f(amibientLightUniformLocation, 0.5,0.5,0.5);
    gl.uniform3f(sunlightIntensityUniformLocation, 0.5,0.5,0.5);
    gl.uniform3f(sunlightDirectionUniformLocation,1.0,-4.0,-2.0);

    // *** Get a pointer for the model viewer
    modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
    ctm = mat4.create();

    // Set the image for the texture
    let image = new Image();
    image.src = model_texture;
    image.onload = function () {
        configureTexture(image);
    }

    // *** Create the event listeners for the buttons
    document.getElementById("rotateX").onclick = function () {
        axis = xAxis;
    };
    document.getElementById("rotateY").onclick = function () {
        axis = yAxis;
    };
    document.getElementById("rotateZ").onclick = function () {
        axis = zAxis;
    };

    projMatUniformLocation = gl.getUniformLocation(program, 'projectionMatrix');

    projMatrix = new Float32Array(16); // 4x4
    mat4.identity(projMatrix);
    mat4.lookAt(projMatrix,[0,0,-3],[0,0,0],[0,1,0]);
    mat4.perspective(projMatrix,glMatrix.toRadian(60),aspectRatio,0.01,1000.0);

    gl.uniformMatrix4fv( projMatUniformLocation, gl.FALSE, projMatrix);

    // after the implementation of the prespective we need to ajust the position
    // so that the we can see the object...
    mat4.translate(ctm,ctm,[0,0,-2]);

    // *** Render ***
    render();

}


function render() {
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Apply rotation
    switch (axis) {
        case xAxis:
            mat4.rotateX(ctm, ctm, angle);
            break;
        case yAxis:
            mat4.rotateY(ctm, ctm, angle);
            break;
        case zAxis:
            mat4.rotateZ(ctm, ctm, angle);
            break;
        default:
            return -1
    }
    // Transfer the information to the model viewer
    gl.uniformMatrix4fv(modelViewMatrix, false, ctm);

    // Draw the triangles
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length / 3);

    // Make the new frame
    requestAnimationFrame(render);
}

function configureTexture(image) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

function applyLighting(){
    let amb_r = document.getElementById("ambient_r").value;
    let amb_g = document.getElementById("ambient_g").value;
    let amb_b = document.getElementById("ambient_b").value;

    let sun_r = document.getElementById("sun_r").value;
    let sun_g = document.getElementById("sun_g").value;
    let sun_b = document.getElementById("sun_b").value;

    let sun_x =  document.getElementById("sun_x").value;
    let sun_y =  document.getElementById("sun_y").value;
    let sun_z =  document.getElementById("sun_z").value;

    gl.uniform3f(amibientLightUniformLocation,amb_r,amb_g,amb_b);
    gl.uniform3f(sunlightIntensityUniformLocation,sun_r,sun_g,sun_b);
    gl.uniform3f(sunlightDirectionUniformLocation,sun_x,sun_y,sun_z);    
}

function setupTranslation(){
    let xTranslation = document.getElementById("X_translation").value;
    let yTranslation = document.getElementById("Y_translation").value;
    let zTranslation = document.getElementById("Z_translation").value;
    mat4.translate(ctm, ctm, [xTranslation, yTranslation, zTranslation]);
}