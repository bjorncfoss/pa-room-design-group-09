precision mediump float;

struct DirectionalLight{
	vec3 direction;
	vec3 color;
};

varying vec2 fTexCoord;
varying vec3 fNormal;
uniform vec3 fambientLightIntensity;
uniform DirectionalLight sun;
uniform sampler2D texture;

void main()
{
	vec3 sunlightDirection = normalize(sun.direction); 

	vec4 texel = texture2D(texture,fTexCoord);
	vec3 normal =  normalize(fNormal);
	vec3 lightIntensity = fambientLightIntensity +(sun.color * max(dot(normal,sunlightDirection),0.0));
	gl_FragColor = vec4(texel.rgb * lightIntensity, texel.a);

}