'use client'

// Animated liquid-metal shader background for MusicPlayer, shown behind the
// player chrome only while a track is playing (see MusicPlayer.tsx). Ported
// from reactbits.dev's LiquidChrome (https://reactbits.dev/backgrounds/liquid-chrome),
// trimmed for a small, subtle widget background rather than a full-page hero:
// tuned colors/amplitude for something calm sitting behind readable text,
// and mouse interaction dropped (nothing to react to — a decorative strip,
// not a full-viewport background).
//
// Uses `ogl` (a ~26KB WebGL wrapper) rather than three.js/@react-three/fiber
// — this project is pinned to React 18, and the current @react-three/fiber
// major requires React 19, which would mean pulling in three.js plus older,
// less-maintained r3f/postprocessing versions just for one small decorative
// effect. ogl has no React version coupling at all.

import { useEffect, useRef } from 'react'
import { Renderer, Program, Mesh, Triangle } from 'ogl'

type LiquidChromeBackgroundProps = {
  /** Normalized (0-1) RGB base color. */
  baseColor?: [number, number, number]
  speed?: number
  amplitude?: number
  frequencyX?: number
  frequencyY?: number
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
  uniform float uTime;
  uniform vec3 uResolution;
  uniform vec3 uBaseColor;
  uniform float uAmplitude;
  uniform float uFrequencyX;
  uniform float uFrequencyY;
  varying vec2 vUv;

  vec4 renderImage(vec2 uvCoord) {
      vec2 fragCoord = uvCoord * uResolution.xy;
      vec2 uv = (2.0 * fragCoord - uResolution.xy) / min(uResolution.x, uResolution.y);

      for (float i = 1.0; i < 10.0; i++){
          uv.x += uAmplitude / i * cos(i * uFrequencyX * uv.y + uTime);
          uv.y += uAmplitude / i * cos(i * uFrequencyY * uv.x + uTime);
      }

      vec3 color = uBaseColor / abs(sin(uTime - uv.y - uv.x));
      return vec4(color, 1.0);
  }

  void main() {
      vec4 col = vec4(0.0);
      int samples = 0;
      for (int i = -1; i <= 1; i++){
          for (int j = -1; j <= 1; j++){
              vec2 offset = vec2(float(i), float(j)) * (1.0 / min(uResolution.x, uResolution.y));
              col += renderImage(vUv + offset);
              samples++;
          }
      }
      gl_FragColor = col / float(samples);
  }
`

export default function LiquidChromeBackground({
  baseColor = [0.02, 0.02, 0.08],
  speed = 0.15,
  amplitude = 0.15,
  frequencyX = 3,
  frequencyY = 3,
}: LiquidChromeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new Renderer({ antialias: true, alpha: true })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)

    const geometry = new Triangle(gl)
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Float32Array([gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height]),
        },
        uBaseColor: { value: new Float32Array(baseColor) },
        uAmplitude: { value: amplitude },
        uFrequencyX: { value: frequencyX },
        uFrequencyY: { value: frequencyY },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })

    function resize() {
      if (!container) return
      renderer.setSize(container.offsetWidth, container.offsetHeight)
      const res = program.uniforms.uResolution.value
      res[0] = gl.canvas.width
      res[1] = gl.canvas.height
      res[2] = gl.canvas.width / gl.canvas.height
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    let animationId: number
    function update(t: number) {
      animationId = requestAnimationFrame(update)
      program.uniforms.uTime.value = t * 0.001 * speed
      renderer.render({ scene: mesh })
    }
    animationId = requestAnimationFrame(update)

    container.appendChild(gl.canvas)

    return () => {
      cancelAnimationFrame(animationId)
      observer.disconnect()
      if (gl.canvas.parentElement) {
        gl.canvas.parentElement.removeChild(gl.canvas)
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [baseColor, speed, amplitude, frequencyX, frequencyY])

  return <div ref={containerRef} className="absolute inset-0" aria-hidden />
}
