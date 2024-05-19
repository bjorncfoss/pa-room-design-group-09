precision mediump float;

attribute vec3 vPosition;
attribute vec2 vTexCoord;

varying vec2 fTexCoord;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 aNormal;
varying vec3 fNormal;

void main() {
	fTexCoord = vTexCoord;
	fNormal =  (modelViewMatrix* vec4(aNormal,0.0)).xyz;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
}