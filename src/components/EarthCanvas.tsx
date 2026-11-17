import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  STOPS_S,
  STOPS_X,
  STOPS_Y,
  clamp,
  computeEntryOffset,
  computeScrollProgress,
  sampleStops,
} from "../utils/earthMath";

const ASSET_BASE_URL =
  "https://api.getlayers.ai/storage/v1/object/public/public/assets/ascend-d9857ad1f2";
const PLANET_GLB = `${ASSET_BASE_URL}/planet.glb`;
const PLANET_LIGHTS_GLB = `${ASSET_BASE_URL}/planet-lights.glb`;
const PLANET_CLOUDS_PNG = `${ASSET_BASE_URL}/planet-clouds.png`;

const CONFIG = {
  rimColor: "#c1faff",
  rimPower: 2.4,
  nightLights: 10,
  terrainDepth: 0.33,
  terrainShade: 1.3,
  oceanGlint: 0.45,
  oceanDeep: 0.12,
  oceanFlow: 3,
  oceanFlowSpeed: 0.8,
  oceanFlowScale: 2.1,
  glowColor: "#3a6cff",
  glowIntensity: 3.35,
  planetRadius: 1.95,
  spin: 0.03,
  initRotation: 2.07,
  tilt: 0.37,
  autoRotate: 0,
  cloud1Height: 1.005,
  cloud1Opacity: 0.6,
  cloud1Spin: 0.06,
  cloud2Height: 1.03,
  cloud2Opacity: 0.5,
  cloud2Spin: 0.14,
  cloud3Height: 1.075,
  cloud3Opacity: 0.5,
  cloud3Spin: 0.1,
  bgColor: "#040a1e",
  flameColor: "#3a6cff",
  flameColor2: "#c1faff",
  flameAmt: 0.15,
  atmoColor: "#9fc4ff",
  atmoCount: 320,
  atmoSize: 22,
  atmoSpeed: 0.8,
  starColor: "#cfe0ff",
  starCount: 1400,
  starSize: 1.6,
  starFlicker: 1,
  markerColor: "#ffd27a",
  markerCount: 60,
  markerSize: 16,
  markerSpeed: 0.5,
} as const;

const LAYERS = {
  NONE: 0,
  TORUS_SCENE: 1,
  BLOOM_SCENE: 2,
  ENTIRE_SCENE: 3,
} as const;

const SNOISE = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

function hexToVec3(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

function detectSoftwareGl(): boolean {
  try {
    const probe = document.createElement("canvas");
    const gl =
      (probe.getContext("webgl") as WebGLRenderingContext | null) ||
      (probe.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

interface EarthCanvasProps {
  reducedMotion: boolean;
}

export default function EarthCanvas({ reducedMotion }: EarthCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let rafId = 0;
    let timeoutId = 0;

    document.body.dataset.earthReady = "loading";

    const isSoftwareGl = detectSoftwareGl();
    if (isSoftwareGl) {
      document.documentElement.classList.add("ascend-software-gl");
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pixelRatio = isSoftwareGl ? 1 : window.devicePixelRatio || 1;

    const renderer = new THREE.WebGL1Renderer({
      canvas,
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 200);
    camera.position.set(0, 0, 8);
    camera.layers.enable(LAYERS.TORUS_SCENE);
    camera.layers.enable(LAYERS.BLOOM_SCENE);
    camera.layers.enable(LAYERS.ENTIRE_SCENE);
    scene.add(camera);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    ambientLight.layers.set(LAYERS.ENTIRE_SCENE);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 10, 2);
    dirLight.layers.set(LAYERS.ENTIRE_SCENE);
    scene.add(dirLight);

    const bloomW = w;
    const bloomH = h;

    let torusComposer: EffectComposer | null = null;
    let bloomComposer: EffectComposer | null = null;

    if (!isSoftwareGl) {
      torusComposer = new EffectComposer(renderer);
      torusComposer.renderToScreen = false;
      torusComposer.setPixelRatio(pixelRatio);
      torusComposer.setSize(bloomW, bloomH);
      torusComposer.addPass(new RenderPass(scene, camera));
      torusComposer.addPass(new ShaderPass(GammaCorrectionShader));
      const torusBloomPass = new UnrealBloomPass(
        new THREE.Vector2(bloomW, bloomH),
        0.22,
        0.2,
        0
      );
      torusComposer.addPass(torusBloomPass);
      torusComposer.addPass(new ShaderPass(CopyShader));

      bloomComposer = new EffectComposer(renderer);
      bloomComposer.renderToScreen = false;
      bloomComposer.setPixelRatio(pixelRatio);
      bloomComposer.setSize(bloomW, bloomH);
      bloomComposer.addPass(new RenderPass(scene, camera));
      const sceneBloomPass = new UnrealBloomPass(
        new THREE.Vector2(bloomW, bloomH),
        0.5,
        0.6,
        0
      );
      bloomComposer.addPass(sceneBloomPass);
      bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));
    }

    const emptyHaloTex = new THREE.DataTexture(
      new Uint8Array([0, 0, 0, 255]),
      1,
      1,
      THREE.RGBAFormat
    );
    emptyHaloTex.needsUpdate = true;

    const FinalPass = {
      uniforms: {
        iTime: { value: 0 },
        tDiffuse: { value: null },
        torusTexture: { value: null },
        bloomTexture: { value: null },
        haloTexture: { value: null },
        uBg: { value: hexToVec3(CONFIG.bgColor) },
        uFlameA: { value: hexToVec3(CONFIG.flameColor) },
        uFlameB: { value: hexToVec3(CONFIG.flameColor2) },
        uFlameAmt: { value: CONFIG.flameAmt },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float iTime; uniform sampler2D tDiffuse; uniform sampler2D bloomTexture; uniform sampler2D torusTexture; uniform sampler2D haloTexture;
        uniform vec3 uBg; uniform vec3 uFlameA; uniform vec3 uFlameB; uniform float uFlameAmt;
        varying vec2 vUv;
        vec3 warp3d(vec3 pos, float t){ float curv=.8,a=1.9,b=0.7; pos*=2.;
          pos.x+=curv*sin(t+a*pos.y)+t*b; pos.y+=curv*cos(t+a*pos.x);
          pos.y+=curv*sin(t+a*pos.z)+t*b; pos.z+=curv*cos(t+a*pos.y);
          pos.z+=curv*sin(t+a*pos.x)+t*b; pos.x+=curv*cos(t+a*pos.z);
          return 0.5+0.5*cos(pos.xyz+vec3(1,2,4)); }
        void main(){
          vec2 uv = 2.*vUv - 1.;
          vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime*1.5), vec3(1.5));
          vec3 flame = 1.5*uFlameA*w.x; flame*=w.y; flame += uFlameB*w.z;
          flame *= smoothstep(0.25, 1., abs(uv.y));
          float md = smoothstep(-0.7, 1., -uv.y*uv.x); flame *= md*md;
          vec3 bg = uBg * (1.0 - 0.4 * length(uv));
          vec3 halo = texture2D(haloTexture, vUv).xyz;
          gl_FragColor = vec4(bg + flame*uFlameAmt + texture2D(bloomTexture, vUv).xyz + texture2D(torusTexture, vUv).xyz + texture2D(tDiffuse, vUv).xyz + halo, 1.);
        }`,
    };

    const finalPass = new ShaderPass(FinalPass);
    finalPass.uniforms.torusTexture.value = torusComposer
      ? torusComposer.renderTarget1.texture
      : emptyHaloTex;
    finalPass.uniforms.bloomTexture.value = bloomComposer
      ? bloomComposer.renderTarget1.texture
      : emptyHaloTex;
    finalPass.uniforms.haloTexture.value = emptyHaloTex;
    const finalComposer = new EffectComposer(renderer);
    finalComposer.setPixelRatio(pixelRatio);
    finalComposer.setSize(w, h);
    finalComposer.addPass(new RenderPass(scene, camera));
    finalComposer.addPass(finalPass);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.enabled = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = CONFIG.autoRotate;
    controls.minDistance = 3.5;
    controls.maxDistance = 16;
    controls.target.set(0, 0, 0);

    // Scene hierarchy
    const worldGroup = new THREE.Group();
    worldGroup.position.set(STOPS_X[0].v, STOPS_Y[0].v, 0);
    worldGroup.scale.setScalar(STOPS_S[0].v);
    scene.add(worldGroup);

    const planetGroup = new THREE.Group();
    planetGroup.rotation.z = CONFIG.tilt;
    planetGroup.rotation.y = CONFIG.initRotation;
    worldGroup.add(planetGroup);

    const cloudGroup = new THREE.Group();
    cloudGroup.rotation.z = CONFIG.tilt;
    cloudGroup.visible = false;
    worldGroup.add(cloudGroup);

    // Atmosphere halo billboard
    const glowGeo = new THREE.PlaneGeometry(2, 2);
    const glowMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uGlow: { value: hexToVec3(CONFIG.glowColor) },
        uIntensity: { value: isSoftwareGl ? 1.35 : CONFIG.glowIntensity },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 uGlow; uniform float uIntensity; varying vec2 vUv;
        void main(){
          float d = length(vUv - 0.5) * 2.0;
          float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.2);
          gl_FragColor = vec4(uGlow * a * uIntensity, a);
        }`,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.scale.setScalar(CONFIG.planetRadius * 2.3);
    glowMesh.renderOrder = 1;
    glowMesh.layers.set(isSoftwareGl ? LAYERS.ENTIRE_SCENE : LAYERS.BLOOM_SCENE);
    glowMesh.visible = false;
    worldGroup.add(glowMesh);

    const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    let loadedPlanetMesh: THREE.Mesh | null = null;
    let savedPlanetMaterial: THREE.Material | THREE.Material[] | null = null;

    // Shared mutable time uniforms
    const planetTime = { value: 0 };
    const cloudTime = { value: 0 };
    const starTime = { value: 0 };
    const markerTime = { value: 0 };
    const uRes = { value: new THREE.Vector2(w, h) };

    // Ambient atmosphere motes
    const atmoPos = new Float32Array(CONFIG.atmoCount * 3);
    const atmoSizes = new Float32Array(CONFIG.atmoCount);
    const atmoSeeds = new Float32Array(CONFIG.atmoCount);
    for (let i = 0; i < CONFIG.atmoCount; i++) {
      atmoPos[i * 3] = Math.random() * 2 - 1;
      atmoPos[i * 3 + 1] = Math.random() * 2 - 1;
      atmoPos[i * 3 + 2] = Math.random() * 2 - 1;
      atmoSizes[i] = CONFIG.atmoSize * (0.4 + Math.random());
      atmoSeeds[i] = Math.random() * 100;
    }
    const atmoGeo = new THREE.BufferGeometry();
    atmoGeo.setAttribute("position", new THREE.BufferAttribute(atmoPos, 3));
    atmoGeo.setAttribute("size", new THREE.BufferAttribute(atmoSizes, 1));
    atmoGeo.setAttribute("seed", new THREE.BufferAttribute(atmoSeeds, 1));
    const atmoMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uRes,
        uColor: { value: hexToVec3(CONFIG.atmoColor) },
      },
      vertexShader: `
        attribute float size; attribute float seed; uniform float uTime; uniform vec2 uRes;
        varying float vA;
        vec3 warp(vec3 p, float t){ float c=0.9,a=1.9,b=0.02,s=0.05; p*=2.;
          p.x+=c*sin(s*t+a*p.y)+t*b; p.y+=c*cos(s*t+a*p.x); p.y+=c*sin(s*t+a*p.z)+t*b;
          p.z+=c*cos(s*t+a*p.y); p.z+=c*sin(s*t+a*p.x)+t*b; p.x+=c*cos(s*t+a*p.z);
          return cos(p+vec3(1,2,4)); }
        void main(){
          vec3 v = position*4.0 + warp(position, uTime)*1.2;
          vec4 mv = modelViewMatrix * vec4(v, 1.0);
          float r = length(v); float farF = 1.0 - smoothstep(5.0, 6.5, r); float nearF = smoothstep(0.0, 0.5, -mv.z);
          vA = farF * nearF;
          gl_PointSize = size * uRes.y / 900.0 / -mv.z; gl_PointSize = max(gl_PointSize, 1.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; varying float vA;
        void main(){ vec2 p = gl_PointCoord - 0.5; float l = length(p); if (l > 0.5) discard;
          float tex = smoothstep(0.5, 0.0, l); gl_FragColor = vec4(uColor * tex, tex * vA * 0.55); }`,
    });
    const atmoPoints = new THREE.Points(atmoGeo, atmoMat);
    atmoPoints.frustumCulled = false;
    atmoPoints.layers.set(LAYERS.ENTIRE_SCENE);
    atmoPoints.onBeforeRender = () => {
      const perfNow = performance.now() * 0.001;
      atmoMat.uniforms.uTime.value = perfNow * CONFIG.atmoSpeed * 8;
      finalPass.uniforms.iTime.value = perfNow;
    };
    scene.add(atmoPoints);

    // Starfield on sphere r = 90
    const starPos = new Float32Array(CONFIG.starCount * 3);
    const starSeeds = new Float32Array(CONFIG.starCount);
    const starBright = new Float32Array(CONFIG.starCount);
    for (let i = 0; i < CONFIG.starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 90;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
      starSeeds[i] = Math.random() * Math.PI * 2;
      starBright[i] = 0.35 + Math.random() * 0.65;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("seed", new THREE.BufferAttribute(starSeeds, 1));
    starGeo.setAttribute("bright", new THREE.BufferAttribute(starBright, 1));
    const starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: starTime,
        uSize: { value: CONFIG.starSize },
        uFlicker: { value: CONFIG.starFlicker },
        uColor: { value: hexToVec3(CONFIG.starColor) },
        uRes,
      },
      vertexShader: `
        attribute float seed; attribute float bright;
        uniform float uTime; uniform float uSize; uniform float uFlicker; uniform vec2 uRes;
        varying float vTw;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float tw = 0.6 + 0.4 * sin(uTime * uFlicker + seed);
          vTw = bright * tw;
          gl_PointSize = max(uSize * uRes.y / 900.0 * (90.0 / max(-mv.z, 1.0)), 1.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; varying float vTw;
        void main(){
          vec2 p = gl_PointCoord - 0.5; float l = length(p); if (l > 0.5) discard;
          float core = smoothstep(0.5, 0.0, l);
          gl_FragColor = vec4(uColor, core * vTw);
        }`,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    starPoints.frustumCulled = false;
    starPoints.layers.set(LAYERS.ENTIRE_SCENE);
    scene.add(starPoints);

    // Cloud shells (3 layers)
    const cloudConfigs = [
      {
        h: CONFIG.cloud1Height,
        o: CONFIG.cloud1Opacity,
        spin: CONFIG.cloud1Spin,
        ry: 0.0,
        phase: 0.0,
      },
      {
        h: CONFIG.cloud2Height,
        o: CONFIG.cloud2Opacity,
        spin: CONFIG.cloud2Spin,
        ry: 2.2,
        phase: 13.0,
      },
      {
        h: CONFIG.cloud3Height,
        o: CONFIG.cloud3Opacity,
        spin: CONFIG.cloud3Spin,
        ry: 4.3,
        phase: 27.0,
      },
    ];
    const cloudMeshes: Array<{ mesh: THREE.Mesh; spin: number }> = [];
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    const cloudTex = textureLoader.load(PLANET_CLOUDS_PNG, (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(5, 5);
      tex.needsUpdate = true;
    });
    cloudTex.wrapS = THREE.RepeatWrapping;
    cloudTex.wrapT = THREE.RepeatWrapping;
    cloudTex.repeat.set(5, 5);

    for (const layer of cloudConfigs) {
      const geo = new THREE.SphereGeometry(CONFIG.planetRadius * layer.h, 64, 64);
      const mat = new THREE.MeshStandardMaterial({
        map: cloudTex,
        transparent: true,
        depthWrite: false,
      });
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = cloudTime;
        shader.uniforms.noiseScale = { value: 20 };
        shader.uniforms.uSpeedX = { value: 1 };
        shader.uniforms.uSpeedY = { value: 2 };
        shader.uniforms.uSpeedZ = { value: 2 };
        shader.uniforms.uOpacity = { value: layer.o };
        shader.uniforms.uPhase = { value: layer.phase };

        shader.vertexShader = `varying vec2 vCloudUv;\n${shader.vertexShader}`.replace(
          "void main() {",
          "void main() {\n  vCloudUv = uv;"
        );
        shader.fragmentShader = `
          uniform float uTime;
          uniform float noiseScale;
          uniform float uSpeedX;
          uniform float uSpeedY;
          uniform float uSpeedZ;
          uniform float uOpacity;
          uniform float uPhase;
          varying vec2 vCloudUv;
          ${SNOISE}
          ${shader.fragmentShader}
        `.replace(
          "#include <dithering_fragment>",
          `#include <dithering_fragment>
          gl_FragColor.rgb = vec3(1.0);
          float cloudNoise = snoise(vec3(vCloudUv.x * noiseScale + uTime * uSpeedX + uPhase, vCloudUv.y * noiseScale - uTime * uSpeedY + uPhase, uTime * uSpeedZ + uPhase));
          float cloudNdv = max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0);
          float cloudEdge = pow(1.0 - cloudNdv, 3.0);
          float cloudMod = mix(cloudNoise, 1.0, cloudEdge);
          float cloudNdl = dot(normalize(vNormal), normalize(vec3(-0.9, 0.18, 0.4)));
          float cloudDay = 1.0 - smoothstep(0.30, -0.30, cloudNdl) * 0.9;
          gl_FragColor.a *= cloudMod * uOpacity * cloudDay;`
        );
      };
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.y = layer.ry;
      mesh.renderOrder = 2;
      mesh.layers.set(LAYERS.ENTIRE_SCENE);
      cloudGroup.add(mesh);
      cloudMeshes.push({ mesh, spin: layer.spin });
    }

    // Load Earth GLB + Night city lights GLB
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.5/"
    );
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.setCrossOrigin("anonymous");

    let entryStartMs: number | null = null;
    const loadedTextures: THREE.Texture[] = [cloudTex, emptyHaloTex];
    const loadedGeometries: THREE.BufferGeometry[] = [glowGeo, atmoGeo, starGeo];
    const loadedMaterials: THREE.Material[] = [
      glowMat,
      atmoMat,
      starMat,
      darkMaterial,
    ];

    function findFirstMesh(root: THREE.Object3D): THREE.Mesh | null {
      let found: THREE.Mesh | null = null;
      root.traverse((obj) => {
        if (!found && (obj as THREE.Mesh).isMesh) {
          found = obj as THREE.Mesh;
        }
      });
      return found;
    }

    function createLandMarkers(
      mesh: THREE.Mesh,
      baseMap: THREE.Texture | null
    ): void {
      const geom = mesh.geometry;
      const posAttr = geom.getAttribute("position");
      const uvAttr = geom.getAttribute("uv");
      if (!posAttr || !uvAttr) return;

      const index = geom.getIndex();
      const triCount = index ? index.count / 3 : posAttr.count / 3;
      if (triCount <= 0) return;

      const areas = new Float32Array(triCount);
      let totalArea = 0;
      const vA = new THREE.Vector3();
      const vB = new THREE.Vector3();
      const vC = new THREE.Vector3();
      const ab = new THREE.Vector3();
      const ac = new THREE.Vector3();

      for (let t = 0; t < triCount; t++) {
        const i0 = index ? index.getX(t * 3) : t * 3;
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
        vA.fromBufferAttribute(posAttr, i0);
        vB.fromBufferAttribute(posAttr, i1);
        vC.fromBufferAttribute(posAttr, i2);
        ab.subVectors(vB, vA);
        ac.subVectors(vC, vA);
        totalArea += ab.cross(ac).length() * 0.5;
        areas[t] = totalArea;
      }
      if (totalArea <= 0) return;

      let imgData: ImageData | null = null;
      let texW = 0;
      let texH = 0;
      const texImg = baseMap?.image as
        | HTMLImageElement
        | HTMLCanvasElement
        | ImageBitmap
        | undefined;
      if (texImg && "width" in texImg && texImg.width > 0) {
        try {
          const sampleCanvas = document.createElement("canvas");
          texW = texImg.width;
          texH = texImg.height;
          sampleCanvas.width = texW;
          sampleCanvas.height = texH;
          const ctx = sampleCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(texImg, 0, 0);
            imgData = ctx.getImageData(0, 0, texW, texH);
          }
        } catch {
          imgData = null;
        }
      }

      const positions: number[] = [];
      const seeds: number[] = [];
      const uvA = new THREE.Vector2();
      const uvB = new THREE.Vector2();
      const uvC = new THREE.Vector2();

      let attempts = 0;
      const maxAttempts = CONFIG.markerCount * 40;
      while (positions.length / 3 < CONFIG.markerCount && attempts < maxAttempts) {
        attempts++;
        const target = Math.random() * totalArea;
        let lo = 0;
        let hi = triCount - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (areas[mid] < target) lo = mid + 1;
          else hi = mid;
        }
        const i0 = index ? index.getX(lo * 3) : lo * 3;
        const i1 = index ? index.getX(lo * 3 + 1) : lo * 3 + 1;
        const i2 = index ? index.getX(lo * 3 + 2) : lo * 3 + 2;

        let r1 = Math.random();
        let r2 = Math.random();
        if (r1 + r2 > 1) {
          r1 = 1 - r1;
          r2 = 1 - r2;
        }
        const r0 = 1 - r1 - r2;

        uvA.set(uvAttr.getX(i0), uvAttr.getY(i0));
        uvB.set(uvAttr.getX(i1), uvAttr.getY(i1));
        uvC.set(uvAttr.getX(i2), uvAttr.getY(i2));
        const u = uvA.x * r0 + uvB.x * r1 + uvC.x * r2;
        const v = uvA.y * r0 + uvB.y * r1 + uvC.y * r2;

        if (imgData && texW > 0 && texH > 0) {
          const px = clamp(Math.floor(((u % 1) + 1) % 1 * texW), 0, texW - 1);
          const py = clamp(Math.floor((1 - (((v % 1) + 1) % 1)) * texH), 0, texH - 1);
          const idx = (py * texW + px) * 4;
          const cr = imgData.data[idx];
          const cg = imgData.data[idx + 1];
          const cb = imgData.data[idx + 2];
          if (cb > cr + 6 && cb > cg + 6) {
            continue;
          }
        }

        vA.fromBufferAttribute(posAttr, i0);
        vB.fromBufferAttribute(posAttr, i1);
        vC.fromBufferAttribute(posAttr, i2);
        const pxPos = (vA.x * r0 + vB.x * r1 + vC.x * r2) * 1.012;
        const pyPos = (vA.y * r0 + vB.y * r1 + vC.y * r2) * 1.012;
        const pzPos = (vA.z * r0 + vB.z * r1 + vC.z * r2) * 1.012;
        positions.push(pxPos, pyPos, pzPos);
        seeds.push(Math.random());
      }

      if (positions.length === 0) return;

      const markerGeo = new THREE.BufferGeometry();
      markerGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );
      markerGeo.setAttribute(
        "seed",
        new THREE.Float32BufferAttribute(seeds, 1)
      );
      const markerMat = new THREE.ShaderMaterial({
        transparent: true,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: markerTime,
          uColor: { value: hexToVec3(CONFIG.markerColor) },
          uSize: { value: CONFIG.markerSize },
          uSpeed: { value: CONFIG.markerSpeed },
          uRes,
        },
        vertexShader: `
          attribute float seed; uniform float uSize; uniform vec2 uRes;
          varying float vSeed; varying float vFade;
          void main(){
            vSeed = seed;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vec3 vn = normalize(normalMatrix * normalize(position));
            vec3 vd = normalize(-mv.xyz);
            vFade = smoothstep(0.15, 0.5, dot(vn, vd));
            gl_PointSize = max(uSize * uRes.y / 900.0 * (7.0 / max(-mv.z, 1.0)), 2.0);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform vec3 uColor; uniform float uTime; uniform float uSpeed;
          varying float vSeed; varying float vFade;
          void main(){
            if (vFade <= 0.001) discard;
            vec2 p = gl_PointCoord - 0.5;
            float d = length(p) * 2.0;
            if (d > 1.0) discard;
            float core = smoothstep(0.30, 0.0, d) * 1.2;
            float ph = fract(uTime * uSpeed + vSeed);
            float ring = smoothstep(0.07, 0.0, abs(d - ph)) * (1.0 - ph);
            gl_FragColor = vec4(uColor, clamp(core + ring, 0.0, 1.0) * vFade);
          }`,
      });
      const markerPoints = new THREE.Points(markerGeo, markerMat);
      markerPoints.layers.set(LAYERS.ENTIRE_SCENE);
      markerPoints.layers.enable(LAYERS.BLOOM_SCENE);
      mesh.add(markerPoints);
      loadedGeometries.push(markerGeo);
      loadedMaterials.push(markerMat);
    }

    function loadAssets() {
      gltfLoader.load(
        PLANET_LIGHTS_GLB,
        (lightsGltf) => {
          if (disposed) return;
          const lightsMesh = findFirstMesh(lightsGltf.scene);
          const lightsMat = lightsMesh?.material as
            | THREE.MeshStandardMaterial
            | undefined;
          const nightTex = lightsMat?.map ?? null;
          if (nightTex) {
            loadedTextures.push(nightTex);
          }

          gltfLoader.load(
            PLANET_GLB,
            (planetGltf) => {
              if (disposed) return;
              const planetMesh = findFirstMesh(planetGltf.scene);
              if (!planetMesh) return;

              planetMesh.geometry.computeBoundingSphere();
              const bsRadius = planetMesh.geometry.boundingSphere?.radius || 1;
              const scaleFactor = CONFIG.planetRadius / bsRadius;
              planetMesh.scale.setScalar(scaleFactor);

              const origMat = Array.isArray(planetMesh.material)
                ? planetMesh.material[0]
                : planetMesh.material;
              const clonedMat = (origMat.clone() as THREE.MeshStandardMaterial & {
                extensions?: { derivatives?: boolean };
              });
              clonedMat.metalness = 0;
              clonedMat.roughness = 1;
              clonedMat.envMapIntensity = 0;
              clonedMat.extensions = { derivatives: true };

              clonedMat.onBeforeCompile = (shader) => {
                shader.uniforms.time = planetTime;
                shader.uniforms.noiseScale = { value: 30 };
                shader.uniforms.speedX = { value: 1.5 };
                shader.uniforms.speedY = { value: 2.0 };
                shader.uniforms.speedZ = { value: 2.5 };
                shader.uniforms.rimColor = { value: hexToVec3(CONFIG.rimColor) };
                shader.uniforms.rimPower = { value: CONFIG.rimPower };
                shader.uniforms.nightBlendTexture = {
                  value: nightTex ?? emptyHaloTex,
                };
                shader.uniforms.nightLights = { value: CONFIG.nightLights };
                shader.uniforms.terrainDepth = { value: CONFIG.terrainDepth };
                shader.uniforms.terrainShade = { value: CONFIG.terrainShade };
                shader.uniforms.oceanGlint = { value: CONFIG.oceanGlint };
                shader.uniforms.oceanDeep = { value: CONFIG.oceanDeep };
                shader.uniforms.oceanFlow = { value: CONFIG.oceanFlow };
                shader.uniforms.oceanFlowSpeed = { value: CONFIG.oceanFlowSpeed };
                shader.uniforms.oceanFlowScale = { value: CONFIG.oceanFlowScale };

                shader.vertexShader = `varying vec2 vCustomUv;\n${shader.vertexShader}`.replace(
                  "void main() {",
                  "void main() {\n  vCustomUv = uv;"
                );

                shader.fragmentShader = `
                  uniform float time;
                  uniform float noiseScale;
                  uniform float speedX;
                  uniform float speedY;
                  uniform float speedZ;
                  uniform vec3 rimColor;
                  uniform float rimPower;
                  uniform sampler2D nightBlendTexture;
                  uniform float nightLights;
                  uniform float terrainDepth;
                  uniform float terrainShade;
                  uniform float oceanGlint;
                  uniform float oceanDeep;
                  uniform float oceanFlow;
                  uniform float oceanFlowSpeed;
                  uniform float oceanFlowScale;
                  varying vec2 vCustomUv;
                  ${SNOISE}
                  ${shader.fragmentShader}
                `.replace(
                  "#include <dithering_fragment>",
                  `#include <dithering_fragment>
                  vec3 normalizedNormal = normalize(vNormal);
                  vec3 viewDir = normalize(vViewPosition);
                  float rim = 1.0 - max(dot(viewDir, normalizedNormal), 0.0);
                  rim = pow(rim, rimPower); rim = pow(rim, 1.5); rim *= 0.7;
                  vec3 currentColor = gl_FragColor.rgb;
                  float blueDom = currentColor.b - max(currentColor.r, currentColor.g);
                  float waterMask = clamp(smoothstep(-0.005, 0.03, blueDom), 0.0, 1.0);
                  float shimmer = snoise(vec3(vCustomUv.x * noiseScale + time * speedX, vCustomUv.y * noiseScale - time * speedY, time * speedZ));
                  gl_FragColor.rgb += waterMask * shimmer * 0.025;
                  float fT = time * oceanFlowSpeed * 4.0;
                  float fS = 4.0 * oceanFlowScale;
                  float warp = snoise(vec3(vCustomUv.x * fS - fT * 0.5, vCustomUv.y * fS + fT * 0.4, fT * 0.5));
                  float flow = snoise(vec3(vCustomUv.x * fS * 2.0 + fT * 0.6 + warp, vCustomUv.y * fS * 2.0 - fT * 0.5, fT * 0.7));
                  flow = warp * 0.6 + flow * 0.4;
                  gl_FragColor.rgb += waterMask * flow * 0.12 * oceanFlow;
                  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.01, 0.06, 0.16), waterMask * oceanDeep);
                  vec3 finalColor = mix(gl_FragColor.rgb, rimColor, rim);
                  gl_FragColor = vec4(finalColor, 1.0);
                  vec3 surfPos = -vViewPosition;
                  float terrH = dot(texture2D(map, vCustomUv).rgb, vec3(0.299, 0.587, 0.114));
                  vec3 sigX = dFdx(surfPos), sigY = dFdy(surfPos);
                  vec3 vR1 = cross(sigY, normalizedNormal), vR2 = cross(normalizedNormal, sigX);
                  float fDet = dot(sigX, vR1);
                  vec3 vGrad = sign(fDet) * (dFdx(terrH) * vR1 + dFdy(terrH) * vR2);
                  vec3 bumpedNormal = normalize(abs(fDet) * normalizedNormal - terrainDepth * vGrad);
                  vec3 shadeNormal = mix(bumpedNormal, normalizedNormal, waterMask);
                  vec3 cityLights = texture2D(nightBlendTexture, vCustomUv).rgb * gl_FragColor.rgb * nightLights;
                  vec3 viewSunDir = normalize(vec3(-0.9, 0.18, 0.4));
                  float ndl = dot(normalizedNormal, viewSunDir);
                  float dayAmt = smoothstep(-0.05, 0.35, ndl);
                  float relief = dot(shadeNormal, viewSunDir) - ndl;
                  gl_FragColor.rgb *= clamp(1.0 + relief * terrainShade * dayAmt, 0.55, 1.6);
                  float nightFactor  = smoothstep(0.18, -0.30, ndl);
                  float lightsFactor = smoothstep(0.30, -0.35, ndl);
                  gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.08, nightFactor);
                  gl_FragColor.rgb += cityLights * lightsFactor;
                  vec3 halfDir = normalize(viewSunDir + viewDir);
                  float ripple = snoise(vec3(vCustomUv * 240.0, time * 4.0));
                  float ndh = max(dot(normalizedNormal, halfDir) + ripple * 0.02, 0.0);
                  float glint = pow(ndh, 140.0);
                  gl_FragColor.rgb += glint * waterMask * dayAmt * oceanGlint * vec3(1.0, 0.97, 0.88);`
                );
              };

              planetMesh.material = clonedMat;
              planetMesh.layers.set(LAYERS.ENTIRE_SCENE);
              planetGroup.add(planetMesh);
              loadedPlanetMesh = planetMesh;
              savedPlanetMaterial = clonedMat;
              loadedGeometries.push(planetMesh.geometry);
              loadedMaterials.push(clonedMat);
              if (clonedMat.map) loadedTextures.push(clonedMat.map);

              createLandMarkers(planetMesh, clonedMat.map);

              cloudGroup.visible = true;
              glowMesh.visible = true;
              entryStartMs = performance.now();
              document.body.dataset.earthReady = "true";
            },
            undefined,
            () => {
              document.body.dataset.earthReady = "error";
            }
          );
        },
        undefined,
        () => {
          document.body.dataset.earthReady = "error";
        }
      );
    }

    loadAssets();

    function handleResize() {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      const pr = isSoftwareGl ? 1 : window.devicePixelRatio || 1;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pr);
      renderer.setSize(nw, nh);
      if (torusComposer) {
        torusComposer.setPixelRatio(pr);
        torusComposer.setSize(nw, nh);
      }
      if (bloomComposer) {
        bloomComposer.setPixelRatio(pr);
        bloomComposer.setSize(nw, nh);
      }
      finalComposer.setPixelRatio(pr);
      finalComposer.setSize(nw, nh);
      uRes.value.set(nw, nh);
    }

    window.addEventListener("resize", handleResize);

    // Choreography damped state
    let curP = 0;
    let curX = STOPS_X[0].v;
    let curY = STOPS_Y[0].v;
    let curS = STOPS_S[0].v;
    let spinPhase = 0;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext();
      const gl2 = gl as unknown as Partial<WebGL2RenderingContext>;
      if (typeof gl2.fenceSync === "function" && typeof gl2.getSyncParameter === "function") {
        const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE!, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl2.deleteSync?.(sync);
            return;
          }
          const state = sync && gl2.getSyncParameter?.(sync, gl2.SYNC_STATUS!);
          if (state === gl2.UNSIGNALED) {
            timeoutId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl2.deleteSync?.(sync);
            timeoutId = window.setTimeout(cb, 80);
          }
        };
        timeoutId = window.setTimeout(poll, 5);
      } else {
        gl.finish();
        timeoutId = window.setTimeout(cb, 220);
      }
    }

    function renderLoop() {
      if (disposed) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;
      finalPass.uniforms.iTime.value = now * 0.001;

      planetTime.value += dt / 12;
      cloudTime.value += dt / 20;
      starTime.value += dt;
      markerTime.value += dt;

      for (const c of cloudMeshes) {
        c.mesh.rotation.y += dt * c.spin;
      }

      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const pTarget = computeScrollProgress(
        window.scrollY,
        scrollHeight,
        window.innerHeight
      );
      curP += (pTarget - curP) * Math.min(1, dt * 4.5);

      const sideScale = clamp(window.innerWidth / 1200, 0.5, 1);
      const targetX = sampleStops(STOPS_X, curP) * sideScale;
      const targetY = sampleStops(STOPS_Y, curP);
      const targetS = sampleStops(STOPS_S, curP);
      const k = Math.min(1, dt * 3.2);
      curX += (targetX - curX) * k;
      curY += (targetY - curY) * k;
      curS += (targetS - curS) * k;

      const elapsedEntrySec =
        entryStartMs !== null ? (now - entryStartMs) * 0.001 : null;
      const entryY = computeEntryOffset(
        elapsedEntrySec,
        reducedMotionRef.current
      );

      worldGroup.position.set(curX, curY + entryY, 0);
      worldGroup.scale.setScalar(curS);

      spinPhase += dt * CONFIG.spin;
      planetGroup.rotation.y =
        CONFIG.initRotation + spinPhase + curP * Math.PI * 1.6;

      atmoPoints.position.copy(camera.position);
      glowMesh.quaternion.copy(camera.quaternion);
      controls.update();

      if (torusComposer) {
        camera.layers.set(LAYERS.TORUS_SCENE);
        torusComposer.render();
      }

      if (bloomComposer) {
        if (loadedPlanetMesh && savedPlanetMaterial) {
          loadedPlanetMesh.material = darkMaterial;
          loadedPlanetMesh.layers.enable(LAYERS.BLOOM_SCENE);
        }
        camera.layers.set(LAYERS.BLOOM_SCENE);
        bloomComposer.render();
        if (loadedPlanetMesh && savedPlanetMaterial) {
          loadedPlanetMesh.material = savedPlanetMaterial;
          loadedPlanetMesh.layers.disable(LAYERS.BLOOM_SCENE);
        }
      }

      camera.layers.set(LAYERS.ENTIRE_SCENE);
      finalComposer.render();

      if (isSoftwareGl) {
        afterDraw(renderLoop);
      } else {
        rafId = requestAnimationFrame(renderLoop);
      }
    }

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      document.documentElement.classList.remove("ascend-software-gl");
      delete document.body.dataset.earthReady;

      for (const c of cloudMeshes) {
        c.mesh.geometry.dispose();
        (c.mesh.material as THREE.Material).dispose();
      }
      for (const g of loadedGeometries) g.dispose();
      for (const m of loadedMaterials) m.dispose();
      for (const t of loadedTextures) t.dispose();

      for (const composer of [torusComposer, bloomComposer, finalComposer]) {
        if (composer) {
          composer.renderTarget1.dispose();
          composer.renderTarget2.dispose();
        }
      }
      dracoLoader.dispose();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="ascend-planet-canvas"
      data-testid="earth-canvas"
      aria-hidden="true"
    />
  );
}
