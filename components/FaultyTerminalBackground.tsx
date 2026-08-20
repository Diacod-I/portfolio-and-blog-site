'use client'

// Retro "broken CRT terminal" shader backdrop for advith.exe's Home/About/
// Contact tabs (see HomeClient.tsx). Ported from reactbits.dev's
// FaultyTerminal (https://reactbits.dev/backgrounds/faulty-terminal) —
// same shader, trimmed to only the props actually used here.
//
// Uses `ogl` (a ~26KB WebGL wrapper), same choice and reasoning as
// MusicPlayer's LiquidChromeBackground: this project is pinned to React 18,
// and three.js/@react-three/fiber's current major requires React 19 — ogl
// has no React version coupling at all, so there's none of that dependency
// risk for a decorative background.
//
// gridMul/timeScale/dpr/pageLoadAnimation from the original component are
// hardcoded here rather than exposed as props: gridMul in particular is an
// array, and HomeClient re-renders often (the About tab's role-morph text
// ticks every 40ms) — an array *prop* with a fresh default reference each
// render would sit in the effect's dependency list below and tear down and
// rebuild the whole WebGL context on nearly every parent render. Every prop
// actually exposed below is a primitive (number/string/boolean), which is
// referentially stable across renders on its own, so the effect only reruns
// when a real config value changes.

import { forwardRef, useEffect, useImperativeHandle, useRef, useCallback } from 'react'
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl'

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
precision mediump float;

varying vec2 vUv;

uniform float iTime;
uniform vec3  iResolution;
uniform float uScale;

uniform vec2  uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3  uTint;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uBrightness;
uniform float uScrollOffset;
uniform float uDissolveProgress;

float time;

float hash21(vec2 p){
  p = fract(p * 234.56);
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float noise(vec2 p)
{
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2;
}

mat2 rotate(float angle)
{
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p)
{
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5 * uNoiseAmp;

  mat2 modify0 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify0 * p * 2.0;
  amp *= 0.454545;

  mat2 modify1 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify1 * p * 2.0;
  amp *= 0.454545;

  mat2 modify2 = rotate(time * 0.08);
  f += amp * noise(p);

  return f;
}

float pattern(vec2 p, out vec2 q, out vec2 r) {
  vec2 offset1 = vec2(1.0);
  vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * time);
  mat2 rot1 = rotate(0.1);

  q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
  r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
  return fbm(p + r);
}

float digit(vec2 p){
    vec2 grid = uGridMul * 15.0;
    vec2 s = floor(p * grid) / grid;
    p = p * grid;
    vec2 q, r;
    float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;

    if(uUseMouse > 0.5){
        vec2 mouseWorld = uMouse * uScale;
        float distToMouse = distance(s, mouseWorld);
        float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
        intensity += mouseInfluence;

        float ripple = sin(distToMouse * 20.0 - iTime * 5.0) * 0.1 * mouseInfluence;
        intensity += ripple;
    }

    p = fract(p);
    p *= uDigitSize;

    float px5 = p.x * 5.0;
    float py5 = (1.0 - p.y) * 5.0;
    float x = fract(px5);
    float y = fract(py5);

    float i = floor(py5) - 2.0;
    float j = floor(px5) - 2.0;
    float n = i * i + j * j;
    float f = n * 0.0625;

    float isOn = step(0.1, intensity - f);
    float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);

    return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightness;
}

float onOff(float a, float b, float c)
{
  return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
}

float displace(vec2 look)
{
    float y = look.y - mod(iTime * 0.25, 1.0);
    float window = 1.0 / (1.0 + 50.0 * y * y);
    return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window;
}

vec3 getColor(vec2 p){

    float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
    bar *= uScanlineIntensity;

    float displacement = displace(p);
    p.x += displacement;

    if (uGlitchAmount != 1.0) {
      float extra = displacement * (uGlitchAmount - 1.0);
      p.x += extra;
    }

    float middle = digit(p);

    const float off = 0.002;
    float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
                digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));

    vec3 baseColor = vec3(0.9) * middle + sum * 0.1 * vec3(1.0) * bar;
    return baseColor;
}

vec2 barrel(vec2 uv){
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + uCurvature * r2;
  return c * 0.5 + 0.5;
}

void main() {
    time = iTime * 0.333333;
    vec2 uv = vUv;

    if(uCurvature != 0.0){
      uv = barrel(uv);
    }

    vec2 p = uv * uScale;
    // Scroll-linked parallax lives here now, not as a CSS transform on an
    // oversized DOM element (see HomeClient.tsx's old bgScrollTop/
    // handleTabScroll wrapper div, since replaced) — that approach was
    // bounded by however much extra canvas was pre-rendered above/below
    // the viewport, so it broke (revealed a bare edge) once scrolling past
    // that fixed overscan, and would keep needing a bigger overscan as
    // more content (e.g. the Home tab's story chapters) got added. Adding
    // the offset directly to the world-space coordinate the pattern is
    // sampled at is genuinely unbounded — fbm/noise below are continuous
    // functions of p, not a finite pre-rendered image, so this works
    // identically at any scroll depth, no matter how tall the page gets.
    p.y += uScrollOffset;
    vec3 col = getColor(p);

    if(uChromaticAberration != 0.0){
      vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
      col.r = getColor(p + ca).r;
      col.b = getColor(p - ca).b;
    }

    col *= uTint;
    col *= uBrightness;

    // Hidden-zone "reveal" easter egg (see HomeClient.tsx's Home tab and
    // its faultyTerminalRef.setDissolveProgress calls) — NOT a flat
    // overlay/fade. A blocky, dithered threshold (same coarse-pixel
    // aesthetic as the digit pattern above) sweeps top-to-bottom across
    // the screen as uDissolveProgress goes 0->1, so the boundary reads as
    // a scattered, pixelated dissolve edge — like static resolving into a
    // new picture — rather than a smooth linear wipe. Screen-space
    // (gl_FragCoord), not world-space: the boundary stays fixed relative
    // to the viewport as you scroll, instead of scrolling away with the
    // parallax. Recolors per-pixel based on this same pixel's own
    // pre-existing brightness (a proxy for "is this a lit digit or a gap
    // between them") rather than just tinting everything uniformly, so
    // the underlying faulty-terminal pattern stays recognizable on both
    // sides of the dissolve — background flips black -> white (drifting
    // toward a subtle pink further down the screen), and the pattern's
    // own dots flip from uTint's usual color -> red/pink.
    if (uDissolveProgress > 0.0) {
      vec2 blockCoord = floor(gl_FragCoord.xy / 14.0);
      float dither = hash21(blockCoord + 91.7);
      float yNorm = gl_FragCoord.y / iResolution.y;
      float threshold = clamp(yNorm + (dither - 0.5) * 0.35, 0.0, 1.0);
      float revealed = step(threshold, uDissolveProgress);

      float lum = clamp(dot(col, vec3(0.299, 0.587, 0.114)) * 2.5, 0.0, 1.0);
      vec3 revealBg = mix(vec3(1.0), vec3(1.0, 0.86, 0.90), yNorm);
      vec3 revealDot = vec3(0.95, 0.25, 0.45);
      vec3 revealedCol = mix(revealBg, revealDot, lum);

      col = mix(col, revealedCol, revealed);
    }

    if(uDither > 0.0){
      float rnd = hash21(gl_FragCoord.xy);
      col += (rnd - 0.5) * (uDither * 0.003922);
    }

    gl_FragColor = vec4(col, 1.0);
}
`

// Fixed, not exposed as a prop — see the file header for why.
const GRID_MUL = new Float32Array([2, 1])
const TIME_SCALE = 0.3

type FaultyTerminalBackgroundProps = {
  scale?: number
  digitSize?: number
  scanlineIntensity?: number
  glitchAmount?: number
  flickerAmount?: number
  noiseAmp?: number
  chromaticAberration?: number
  dither?: number
  curvature?: number
  tint?: string
  mouseReact?: boolean
  mouseStrength?: number
  brightness?: number
  /** Initial world-space Y offset fed into the shader's pattern sampling
   *  (see uScrollOffset in the fragment shader above) — only read once, on
   *  mount, to seed scrollOffsetRef below. After mount, use the imperative
   *  handle's setScrollOffset instead (see FaultyTerminalBackgroundHandle)
   *  — a caller driving this from a scroll event needs to update it far
   *  too often to go through a React prop/state round-trip without causing
   *  a parent re-render on every scroll tick. */
  scrollOffset?: number
  /** Initial value for the hidden-zone "reveal" dissolve (see
   *  uDissolveProgress in the fragment shader above) — same "only read
   *  once, on mount" deal as scrollOffset, for the same reason: driven
   *  from a scroll handler via the imperative handle's
   *  setDissolveProgress after that. */
  dissolveProgress?: number
}

export type FaultyTerminalBackgroundHandle = {
  /** Imperative scroll-linked parallax update — writes straight into the
   *  ref the RAF loop reads from (see uScrollOffset in the fragment
   *  shader), with no React state/prop involved and therefore no
   *  re-render of this component OR whatever parent is calling this on
   *  every scroll event. This existed as a `scrollOffset` prop + a state
   *  variable on the caller (HomeClient) originally, but that meant every
   *  scroll tick re-rendered HomeClient's entire tree (every open window,
   *  the story chapters, etc.) just to push one number into a shader
   *  uniform — visibly janky once the Home tab grew past a single
   *  dossier. This imperative path is the fix: same value, same
   *  destination, zero React re-renders. */
  setScrollOffset: (value: number) => void
  /** Same deal as setScrollOffset, for the hidden-zone reveal (see
   *  uDissolveProgress in the fragment shader above) — 0 = normal,
   *  1 = fully dissolved into the white/pink + red/pink-dot look. */
  setDissolveProgress: (value: number) => void
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255]
}

const FaultyTerminalBackground = forwardRef<FaultyTerminalBackgroundHandle, FaultyTerminalBackgroundProps>(function FaultyTerminalBackground({
  scale = 1.5,
  digitSize = 1.2,
  scanlineIntensity = 0.5,
  glitchAmount = 1,
  flickerAmount = 1,
  noiseAmp = 1,
  chromaticAberration = 0,
  dither = 0,
  curvature = 0.1,
  tint = '#2baca4',
  mouseReact = true,
  mouseStrength = 0.5,
  brightness = 0.6,
  scrollOffset = 0,
  dissolveProgress = 0,
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 })
  const rafRef = useRef(0)
  const timeOffsetRef = useRef(Math.random() * 100)
  // Seeded once from the initial prop, then updated exclusively through
  // the imperative handle below (see FaultyTerminalBackgroundHandle) — no
  // effect syncing this from a `scrollOffset` prop on every render.
  const scrollOffsetRef = useRef(scrollOffset)
  const dissolveProgressRef = useRef(dissolveProgress)

  useImperativeHandle(ref, () => ({
    setScrollOffset: (value: number) => {
      scrollOffsetRef.current = value
    },
    setDissolveProgress: (value: number) => {
      dissolveProgressRef.current = value
    },
  }), [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const ctn = containerRef.current
    if (!ctn) return
    const rect = ctn.getBoundingClientRect()
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: 1 - (e.clientY - rect.top) / rect.height,
    }
  }, [])

  useEffect(() => {
    const ctn = containerRef.current
    if (!ctn) return

    const [tr, tg, tb] = hexToRgb(tint)
    // Read here (inside the effect, client-only) rather than as a default
    // parameter evaluated during render — the latter touches `window`
    // during Next's server-render pass and crashes, same class of bug as
    // DitherBackground's earlier SSR incompatibility (see MusicPlayer.tsx
    // history for that saga).
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const renderer = new Renderer({ dpr })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 1)

    const geometry = new Triangle(gl)
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        uScale: { value: scale },
        uGridMul: { value: GRID_MUL },
        uDigitSize: { value: digitSize },
        uScanlineIntensity: { value: scanlineIntensity },
        uGlitchAmount: { value: glitchAmount },
        uFlickerAmount: { value: flickerAmount },
        uNoiseAmp: { value: noiseAmp },
        uChromaticAberration: { value: chromaticAberration },
        uDither: { value: dither },
        uCurvature: { value: curvature },
        uTint: { value: new Color(tr, tg, tb) },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseStrength: { value: mouseStrength },
        uUseMouse: { value: mouseReact ? 1 : 0 },
        uBrightness: { value: brightness },
        uScrollOffset: { value: scrollOffsetRef.current },
        uDissolveProgress: { value: dissolveProgressRef.current },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })

    function resize() {
      if (!ctn) return
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight)
      program.uniforms.iResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      )
    }
    const observer = new ResizeObserver(resize)
    observer.observe(ctn)
    resize()

    function update(t: number) {
      rafRef.current = requestAnimationFrame(update)
      program.uniforms.iTime.value = (t * 0.001 + timeOffsetRef.current) * TIME_SCALE
      program.uniforms.uScrollOffset.value = scrollOffsetRef.current
      program.uniforms.uDissolveProgress.value = dissolveProgressRef.current

      if (mouseReact) {
        const damping = 0.08
        const smooth = smoothMouseRef.current
        const mouse = mouseRef.current
        smooth.x += (mouse.x - smooth.x) * damping
        smooth.y += (mouse.y - smooth.y) * damping
        const m = program.uniforms.uMouse.value as Float32Array
        m[0] = smooth.x
        m[1] = smooth.y
      }

      renderer.render({ scene: mesh })
    }
    rafRef.current = requestAnimationFrame(update)
    ctn.appendChild(gl.canvas)
    if (mouseReact) ctn.addEventListener('mousemove', handleMouseMove)

    return () => {
      cancelAnimationFrame(rafRef.current)
      observer.disconnect()
      if (mouseReact) ctn.removeEventListener('mousemove', handleMouseMove)
      if (gl.canvas.parentElement === ctn) ctn.removeChild(gl.canvas)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [
    scale,
    digitSize,
    scanlineIntensity,
    glitchAmount,
    flickerAmount,
    noiseAmp,
    chromaticAberration,
    dither,
    curvature,
    tint,
    mouseReact,
    mouseStrength,
    brightness,
    handleMouseMove,
  ])

  return <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden />
})

FaultyTerminalBackground.displayName = 'FaultyTerminalBackground'

export default FaultyTerminalBackground
