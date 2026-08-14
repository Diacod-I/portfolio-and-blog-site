'use client'

// Lightweight React-18-compatible port of React Bits' Dither background.
// The registry version currently depends on React Three Fiber 9 (React 19),
// so this uses the project's existing OGL renderer instead.

import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'

type DitherBackgroundProps = {
  waveColor?: [number, number, number]
  waveSpeed?: number
  waveFrequency?: number
  waveAmplitude?: number
  colorNum?: number
  pixelSize?: number
}

const vertexShader = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const fragmentShader = `
  precision highp float;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uWaveSpeed;
  uniform float uWaveFrequency;
  uniform float uWaveAmplitude;
  uniform vec3 uWaveColor;
  uniform float uColorNum;
  uniform float uPixelSize;
  varying vec2 vUv;

  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec2 fade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

  float cnoise(vec2 p) {
    vec4 pi = floor(p.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 pf = fract(p.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    pi = mod289(pi);
    vec4 ix = pi.xzxz;
    vec4 iy = pi.yyww;
    vec4 fx = pf.xzxz;
    vec4 fy = pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
    vec4 gy = abs(gx) - 0.5;
    gx -= floor(gx + 0.5);
    vec2 g00 = vec2(gx.x, gy.x);
    vec2 g10 = vec2(gx.y, gy.y);
    vec2 g01 = vec2(gx.z, gy.z);
    vec2 g11 = vec2(gx.w, gy.w);
    vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
    g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 nX = mix(vec2(n00, n01), vec2(n10, n11), fade(pf.xy).x);
    return 2.3 * mix(nX.x, nX.y, fade(pf.xy).y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 1.0;
    for (int i = 0; i < 4; i++) {
      value += amplitude * abs(cnoise(p));
      p *= uWaveFrequency;
      amplitude *= uWaveAmplitude;
    }
    return value;
  }

  float bayer8(vec2 pixel) {
    float x = mod(pixel.x, 8.0);
    float y = mod(pixel.y, 8.0);
    float index = x + y * 8.0;
    float values[64];
    values[0]=0.0; values[1]=48.0; values[2]=12.0; values[3]=60.0; values[4]=3.0; values[5]=51.0; values[6]=15.0; values[7]=63.0;
    values[8]=32.0; values[9]=16.0; values[10]=44.0; values[11]=28.0; values[12]=35.0; values[13]=19.0; values[14]=47.0; values[15]=31.0;
    values[16]=8.0; values[17]=56.0; values[18]=4.0; values[19]=52.0; values[20]=11.0; values[21]=59.0; values[22]=7.0; values[23]=55.0;
    values[24]=40.0; values[25]=24.0; values[26]=36.0; values[27]=20.0; values[28]=43.0; values[29]=27.0; values[30]=39.0; values[31]=23.0;
    values[32]=2.0; values[33]=50.0; values[34]=14.0; values[35]=62.0; values[36]=1.0; values[37]=49.0; values[38]=13.0; values[39]=61.0;
    values[40]=34.0; values[41]=18.0; values[42]=46.0; values[43]=30.0; values[44]=33.0; values[45]=17.0; values[46]=49.0; values[47]=31.0;
    values[48]=10.0; values[49]=58.0; values[50]=6.0; values[51]=54.0; values[52]=9.0; values[53]=57.0; values[54]=5.0; values[55]=53.0;
    values[56]=42.0; values[57]=26.0; values[58]=38.0; values[59]=22.0; values[60]=41.0; values[61]=25.0; values[62]=37.0; values[63]=21.0;
    for (int i = 0; i < 64; i++) if (float(i) == index) return values[i] / 64.0;
    return 0.0;
  }

  void main() {
    vec2 p = vUv - 0.5;
    p.x *= uResolution.x / uResolution.y;
    vec2 p2 = p - uTime * uWaveSpeed;
    float brightness = fbm(p + fbm(p2));
    float stepSize = 1.0 / max(uColorNum - 1.0, 1.0);
    vec3 color = uWaveColor * brightness;
    color += (bayer8(floor(gl_FragCoord.xy / uPixelSize)) - 0.25) * stepSize;
    color = clamp(color - 0.2, 0.0, 1.0);
    color = floor(color * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`

export default function DitherBackground({
  // Neutral charcoal keeps the animation understated beneath player controls.
  waveColor = [0.34, 0.35, 0.38],
  waveSpeed = 0.05,
  waveFrequency = 3,
  waveAmplitude = 0.3,
  colorNum = 4,
  pixelSize = 1,
}: DitherBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new Renderer({ alpha: true, dpr: 1 })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uResolution: { value: new Float32Array([1, 1]) },
        uTime: { value: 0 },
        uWaveSpeed: { value: waveSpeed },
        uWaveFrequency: { value: waveFrequency },
        uWaveAmplitude: { value: waveAmplitude },
        uWaveColor: { value: new Float32Array(waveColor) },
        uColorNum: { value: colorNum },
        uPixelSize: { value: pixelSize },
      },
    })
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })

    const resize = () => {
      renderer.setSize(container.offsetWidth, container.offsetHeight)
      const resolution = program.uniforms.uResolution.value
      resolution[0] = gl.canvas.width
      resolution[1] = gl.canvas.height
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()
    container.appendChild(gl.canvas)

    let animationFrame = 0
    const render = (time: number) => {
      program.uniforms.uTime.value = time * 0.001
      renderer.render({ scene: mesh })
      animationFrame = requestAnimationFrame(render)
    }
    animationFrame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
      gl.canvas.remove()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [colorNum, pixelSize, waveAmplitude, waveColor, waveFrequency, waveSpeed])

  return <div ref={containerRef} className="absolute inset-0 opacity-85" aria-hidden />
}
