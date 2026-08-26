export function createTexturedShaderProgram(gl: WebGL2RenderingContext): {
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  program: WebGLProgram;
} {
  const vertexSource = `#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

  const fragmentSource = `#version 300 es
precision mediump float;

in vec2 v_texCoord;
uniform sampler2D u_texture;
uniform vec4 u_uvRect;
out vec4 outColor;

void main() {
  vec2 sampleUv = u_uvRect.xy + (v_texCoord * u_uvRect.zw);
  outColor = texture(u_texture, sampleUv);
}`;

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  return { vertexShader, fragmentShader, program };
}

export function createSolidColorShaderProgram(gl: WebGL2RenderingContext): {
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  program: WebGLProgram;
} {
  const vertexSource = `#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;
out vec2 v_localUv;

void main() {
  v_localUv = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

  const fragmentSource = `#version 300 es
precision mediump float;

in vec2 v_localUv;
uniform vec4 u_fillColor;
uniform vec4 u_strokeColor;
uniform float u_strokeWidth;
uniform float u_cornerRadius;
uniform vec2 u_size;
out vec4 outColor;

float roundedRectDistance(vec2 point, vec2 size, float radius) {
  vec2 halfSize = size * 0.5;
  vec2 q = abs(point - halfSize) - (halfSize - vec2(radius));
  return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - radius;
}

void main() {
  vec2 safeSize = max(u_size, vec2(1.0));
  float maxRadius = min(safeSize.x, safeSize.y) * 0.5;
  float cornerRadius = clamp(u_cornerRadius, 0.0, maxRadius);
  float strokeWidth = max(0.0, min(u_strokeWidth, maxRadius));
  vec2 point = v_localUv * safeSize;
  float distanceToEdge = roundedRectDistance(point, safeSize, cornerRadius);
  float antiAliasWidth = 1.0;
  float outerAlpha = 1.0 - smoothstep(0.0, antiAliasWidth, distanceToEdge);

  if (strokeWidth <= 0.0 || u_strokeColor.a <= 0.0) {
    outColor = vec4(u_fillColor.rgb, u_fillColor.a * outerAlpha);
    return;
  }

  float innerAlpha = 1.0 - smoothstep(
    0.0,
    antiAliasWidth,
    distanceToEdge + strokeWidth
  );
  float borderAlpha = max(0.0, outerAlpha - innerAlpha);
  vec4 fillColor = vec4(u_fillColor.rgb, u_fillColor.a * innerAlpha);
  vec4 strokeColor = vec4(u_strokeColor.rgb, u_strokeColor.a * borderAlpha);
  outColor = strokeColor + fillColor * (1.0 - strokeColor.a);
}`;

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  return { vertexShader, fragmentShader, program };
}

function compileShader(
  gl: WebGL2RenderingContext,
  shaderType: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(shaderType);
  if (!shader) {
    throw new Error("Failed to create WebGL shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info =
      gl.getShaderInfoLog(shader) ?? "Unknown shader compile failure.";
    gl.deleteShader(shader);
    throw new Error(info);
  }

  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Failed to create WebGL program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info =
      gl.getProgramInfoLog(program) ?? "Unknown program link failure.";
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error(info);
  }

  return program;
}
