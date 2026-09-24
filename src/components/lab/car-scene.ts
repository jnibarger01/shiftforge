import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BodyStyle, BuildConfig, CarModel, Finish, Scene, WheelStyle } from '@/lib/build-config';
import { analyzeFitment, tireOverallDiameterMm } from '@/lib/fitment';

export type AeroShapes = { front?: string | null; side?: string | null; rear?: string | null; wing?: string | null };
export type ViewPreset = 'front34' | 'rear34' | 'side' | 'front' | 'top' | 'wheel';

type Style = { belt: number; clearance: number; greenhouse: [number, number][]; nose: number; deckDrop: number; hoodDrop: number };

// Greenhouse points are [x as fraction of length (+ = front), y as fraction of total height].
const STYLES: Record<BodyStyle, Style> = {
  coupe: { belt: 0.66, clearance: 0.12, nose: 0.3, deckDrop: 0.0, hoodDrop: 0.2, greenhouse: [[-0.4, 0], [-0.24, 0.72], [-0.1, 1], [0.03, 1], [0.21, 0]] },
  fastback: { belt: 0.64, clearance: 0.13, nose: 0.36, deckDrop: 0.0, hoodDrop: 0.17, greenhouse: [[-0.45, 0], [-0.3, 0.55], [-0.12, 1], [0.04, 1], [0.21, 0]] },
  sedan: { belt: 0.63, clearance: 0.13, nose: 0.36, deckDrop: 0.0, hoodDrop: 0.15, greenhouse: [[-0.34, 0], [-0.22, 0.92], [-0.18, 1], [0.04, 1], [0.2, 0]] },
  hatch: { belt: 0.6, clearance: 0.13, nose: 0.4, deckDrop: 0, hoodDrop: 0.13, greenhouse: [[-0.47, 0], [-0.44, 0.9], [-0.36, 1], [0.05, 1], [0.21, 0]] },
  roadster: { belt: 0.7, clearance: 0.11, nose: 0.3, deckDrop: 0.0, hoodDrop: 0.2, greenhouse: [[-0.14, 0], [-0.06, 0.78], [0.02, 0.8], [0.13, 0]] },
  suv: { belt: 0.57, clearance: 0.23, nose: 0.5, deckDrop: 0, hoodDrop: 0.08, greenhouse: [[-0.49, 0], [-0.47, 0.98], [-0.42, 1], [0.1, 1], [0.24, 0]] },
  truck: { belt: 0.56, clearance: 0.27, nose: 0.55, deckDrop: 0, hoodDrop: 0.03, greenhouse: [[-0.15, 0], [-0.13, 1], [0.12, 1], [0.23, 0]] },
};

const SCENE_LOOK: Record<Scene, { bg: number; floor: number; floorRough: number; fog: [number, number]; exposure: number; env: number; key: number; rim: number; rimColor: number }> = {
  studio: { bg: 0x16171b, floor: 0x1b1c20, floorRough: 0.55, fog: [12, 26], exposure: 1.0, env: 0.9, key: 2.6, rim: 1.6, rimColor: 0xffffff },
  street: { bg: 0x8fa3b8, floor: 0x3a3b3e, floorRough: 0.92, fog: [14, 40], exposure: 1.05, env: 1.0, key: 3.2, rim: 1.0, rimColor: 0xffe2c0 },
  night: { bg: 0x05060a, floor: 0x0c0d11, floorRough: 0.35, fog: [8, 22], exposure: 1.15, env: 0.45, key: 1.2, rim: 3.2, rimColor: 0x4f7bff },
  salt: { bg: 0xdfe4e8, floor: 0xd6d8d6, floorRough: 0.95, fog: [16, 45], exposure: 0.95, env: 1.0, key: 3.4, rim: 0.8, rimColor: 0xfff4e0 },
};

function finishParams(finish: Finish) {
  switch (finish) {
    case 'matte':
      return { metalness: 0.05, roughness: 0.72, clearcoat: 0, clearcoatRoughness: 1 };
    case 'satin':
      return { metalness: 0.25, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.5 };
    case 'metallic':
      return { metalness: 0.65, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06 };
    default:
      return { metalness: 0.08, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.04 };
  }
}

function disposeTree(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose();
  });
}

/** Extrusions come out non-indexed (flat shaded); weld vertices so panels shade smoothly. */
function smooth(geo: THREE.BufferGeometry) {
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
  const merged = mergeVertices(geo, 1e-4);
  merged.computeVertexNormals();
  geo.dispose();
  return merged;
}

function blobShadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.75)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export type SceneInput = { model: CarModel; config: BuildConfig; wheelStyle: WheelStyle; aero: AeroShapes };

export class CarScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  private controls: OrbitControls;
  private car: THREE.Group | null = null;
  private floor: THREE.Mesh;
  private blob: THREE.Mesh;
  private key: THREE.DirectionalLight;
  private rim: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private frame = 0;
  private observer: ResizeObserver;
  private carLength = 4.5;
  private modelId = -1;
  private disposed = false;
  private tween: { from: THREE.Vector3; to: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3; t: number } | null = null;

  constructor(private container: HTMLElement, opts: { interactive?: boolean; autoRotate?: boolean } = {}) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.6);
    this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffffff, 2.5);
    this.key.position.set(4, 8, 5);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    const sc = this.key.shadow.camera;
    sc.left = -5;
    sc.right = 5;
    sc.top = 5;
    sc.bottom = -5;
    sc.near = 1;
    sc.far = 25;
    this.key.shadow.bias = -0.0004;
    this.key.shadow.radius = 6;
    this.scene.add(this.key);
    this.rim = new THREE.DirectionalLight(0xffffff, 1.5);
    this.rim.position.set(-6, 3, -5);
    this.scene.add(this.rim);

    this.floor = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ color: 0x1b1c20, roughness: 0.6 }));
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false }));
    this.blob.rotation.x = -Math.PI / 2;
    this.blob.position.y = 0.002;
    this.scene.add(this.blob);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 14;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.enabled = opts.interactive !== false;
    this.controls.autoRotate = !!opts.autoRotate;
    this.controls.autoRotateSpeed = 0.8;
    this.camera.position.set(5.4, 1.7, 5.2);
    this.controls.target.set(0, 0.6, 0);

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
    this.loop();
  }

  private resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    // Keep the whole car in frame on tall/narrow (mobile) viewports.
    this.camera.fov = w / h < 1 ? 44 : 32;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  private loop = () => {
    if (this.disposed) return;
    if (this.tween) {
      this.tween.t = Math.min(1, this.tween.t + 0.045);
      const k = 1 - Math.pow(1 - this.tween.t, 3);
      this.camera.position.lerpVectors(this.tween.from, this.tween.to, k);
      this.controls.target.lerpVectors(this.tween.fromT, this.tween.toT, k);
      if (this.tween.t >= 1) this.tween = null;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.loop);
  };

  setView(preset: ViewPreset, instant = false) {
    const L = this.carLength;
    const d = L * 1.28;
    const positions: Record<ViewPreset, [THREE.Vector3, THREE.Vector3]> = {
      front34: [new THREE.Vector3(d * 0.78, 1.5, d * 0.78), new THREE.Vector3(0, 0.55, 0)],
      rear34: [new THREE.Vector3(-d * 0.78, 1.6, d * 0.72), new THREE.Vector3(0, 0.55, 0)],
      side: [new THREE.Vector3(0, 0.9, d * 1.05), new THREE.Vector3(0, 0.55, 0)],
      front: [new THREE.Vector3(d * 1.02, 1.0, 0), new THREE.Vector3(0, 0.6, 0)],
      top: [new THREE.Vector3(0.01, d * 1.35, 0.01), new THREE.Vector3(0, 0, 0)],
      wheel: [new THREE.Vector3(L * 0.55, 0.55, 2.1), new THREE.Vector3(L * 0.3, 0.35, 0.8)],
    };
    const [to, toT] = positions[preset];
    if (instant) {
      this.camera.position.copy(to);
      this.controls.target.copy(toT);
      this.tween = null;
      return;
    }
    this.tween = { from: this.camera.position.clone(), to, fromT: this.controls.target.clone(), toT, t: 0 };
  }

  setAutoRotate(on: boolean) {
    this.controls.autoRotate = on;
  }

  capture(width = 1200, height = 750, type = 'image/webp'): string {
    const prev = new THREE.Vector2();
    this.renderer.getSize(prev);
    const prevAspect = this.camera.aspect;
    const prevFov = this.camera.fov;
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.fov = 32;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL(type, 0.9);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(prev.x, prev.y, false);
    this.camera.aspect = prevAspect;
    this.camera.fov = prevFov;
    this.camera.updateProjectionMatrix();
    return url;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.controls.dispose();
    if (this.car) disposeTree(this.car);
    disposeTree(this.scene);
    this.scene.environment?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  update(input: SceneInput) {
    const { model, config } = input;
    const look = SCENE_LOOK[config.scene];
    this.scene.background = new THREE.Color(look.bg);
    this.scene.fog = new THREE.Fog(look.bg, look.fog[0], look.fog[1]);
    this.renderer.toneMappingExposure = look.exposure;
    this.scene.environmentIntensity = look.env;
    (this.floor.material as THREE.MeshStandardMaterial).color.setHex(look.floor);
    (this.floor.material as THREE.MeshStandardMaterial).roughness = look.floorRough;
    this.key.intensity = look.key;
    this.rim.intensity = look.rim;
    this.rim.color.setHex(look.rimColor);
    this.hemi.intensity = config.scene === 'night' ? 0.25 : 0.6;

    if (this.car) {
      this.scene.remove(this.car);
      disposeTree(this.car);
    }
    this.car = buildCar(input);
    this.scene.add(this.car);
    this.carLength = model.lengthMm / 1000;
    this.blob.scale.set(this.carLength * 1.25, (model.widthMm / 1000) * 1.5, 1);
    if (this.modelId !== model.id) {
      this.modelId = model.id;
      this.setView('front34', true);
    }
  }
}

// ---------------------------------------------------------------------------
// Procedural car construction
// ---------------------------------------------------------------------------

function buildCar({ model, config, wheelStyle, aero }: SceneInput): THREE.Group {
  const style = STYLES[model.body];
  const L = model.lengthMm / 1000;
  const W = model.widthMm / 1000;
  const H = model.heightMm / 1000;
  const WB = model.wheelbaseMm / 1000;
  const report = analyzeFitment(config, model);
  const stockR = tireOverallDiameterMm(model.stockDiameter, model.stockTireWidth, model.stockTireAspect) / 2000;
  const tireR = report.overallDiameterMm / 2000;
  const archR = stockR + model.archGap / 1000;
  const drop = config.drop / 1000;
  const frontOverhang = (L - WB) * (model.slug.startsWith('porsche') ? 0.38 : 0.52);
  const xFront = L / 2 - frontOverhang;
  const xRear = xFront - WB;

  const group = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = -drop;
  group.add(body);

  const fp = finishParams(config.finish);
  const paint = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(config.paint), ...fp });
  const trim = new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.55, metalness: 0.2 });
  const carbon = new THREE.MeshPhysicalMaterial({ color: 0x141518, roughness: 0.3, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
  // VLT: higher percentage = lighter glass.
  const glass = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setHSL(0.58, 0.2, 0.015 + 0.1 * (config.tint / 100)),
    roughness: 0.08,
    metalness: 0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.05,
    envMapIntensity: 0.35,
  });

  const clearance = style.clearance;
  const belt = H * style.belt;
  const beltBack = belt - style.deckDrop * H;
  const cowl = L * (style.greenhouse[style.greenhouse.length - 1][0] + 0.02);

  // ---- lower body side profile with wheel arches ----
  const arch = (xc: number, pts: THREE.Vector2[]) => {
    const dy = clearance - stockR;
    const dx = Math.sqrt(Math.max(0, archR * archR - dy * dy));
    const t0 = Math.atan2(dy, dx);
    const t1 = Math.PI - t0;
    for (let i = 0; i <= 24; i++) {
      const t = t0 + ((t1 - t0) * i) / 24;
      pts.push(new THREE.Vector2(xc + archR * Math.cos(t), stockR + archR * Math.sin(t)));
    }
  };
  const bottom: THREE.Vector2[] = [new THREE.Vector2(L / 2 - 0.08, clearance)];
  arch(xFront, bottom);
  arch(xRear, bottom);
  bottom.push(new THREE.Vector2(-L / 2 + 0.08, clearance + 0.02));
  // Upper outline (rear bumper → deck → cowl → hood → nose) is smoothed with a Catmull-Rom spline.
  const truck = model.body === 'truck';
  const upperKeys = [
    new THREE.Vector2(-L / 2 + 0.01, clearance + 0.12),
    new THREE.Vector2(-L / 2 - 0.005, (clearance + beltBack) / 2 + 0.04),
    new THREE.Vector2(-L / 2 + (truck ? 0.0 : 0.04), beltBack - (truck ? 0.01 : 0.05)),
    new THREE.Vector2(-L / 2 + (truck ? 0.03 : 0.16), beltBack),
    new THREE.Vector2((-L / 2 + cowl) / 2, (beltBack + belt) / 2 + 0.005),
    new THREE.Vector2(cowl, belt),
    new THREE.Vector2((cowl + L / 2) / 2, belt - style.hoodDrop * 0.45),
    new THREE.Vector2(L / 2 - 0.12, belt - style.hoodDrop),
    new THREE.Vector2(L / 2 - 0.01, clearance + style.nose * (belt - clearance) + 0.02),
    new THREE.Vector2(L / 2, clearance + 0.1),
  ];
  const upper = new THREE.SplineCurve(upperKeys).getPoints(90);
  const outline = [...bottom, ...upper];
  const shape = new THREE.Shape(outline);

  const bevelT = Math.min(0.17, W * 0.09);
  const lowerGeo = new THREE.ExtrudeGeometry(shape, { depth: W - bevelT * 2, bevelEnabled: true, bevelThickness: bevelT, bevelSize: 0.07, bevelOffset: -0.07, bevelSegments: 8, curveSegments: 12 });
  lowerGeo.translate(0, 0, -(W - bevelT * 2) / 2);
  // Plan-view taper toward the nose and tail plus a slight tuck at the sills.
  const pos = lowerGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const endT = Math.max(0, (Math.abs(x) - (L / 2 - 0.75)) / 0.75);
    const taper = 1 - (x > 0 ? 0.13 : 0.08) * endT * endT;
    const t = Math.min(1, Math.max(0, (y - clearance) / Math.max(0.05, belt - clearance)));
    const section = 1 - 0.035 * (1 - t) ** 3;
    pos.setZ(i, pos.getZ(i) * taper * section);
  }
  const lower = new THREE.Mesh(smooth(lowerGeo), paint);
  lower.castShadow = true;
  lower.receiveShadow = true;
  body.add(lower);

  // Inner arch liners so you cannot see through the wheel wells.
  for (const xc of [xFront, xRear]) {
    const liner = new THREE.Mesh(new THREE.CylinderGeometry(archR - 0.005, archR - 0.005, W * 0.86, 32, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1, side: THREE.BackSide }));
    liner.rotation.x = Math.PI / 2;
    liner.rotation.y = Math.PI / 2;
    liner.position.set(xc, stockR, 0);
    body.add(liner);
  }

  // ---- greenhouse ----
  const ghPts = style.greenhouse.map(([fx, fy]) => [fx * L, belt - 0.02 + fy * (H - belt + 0.02)] as [number, number]);
  const ghKeys = ghPts.map(([x, y]) => new THREE.Vector2(x, y));
  // Smooth the roofline but keep the belt-line corners sharp.
  const roofline = new THREE.SplineCurve(ghKeys.slice(0, -1).concat([ghKeys[ghKeys.length - 1]])).getPoints(60);
  const gh = new THREE.Shape([...roofline]);
  const ghWidth = W * (model.body === 'roadster' ? 0.84 : 0.8);
  const ghBevel = 0.1;
  const ghGeo = new THREE.ExtrudeGeometry(gh, { depth: ghWidth - ghBevel * 2, bevelEnabled: true, bevelThickness: ghBevel, bevelSize: 0.05, bevelOffset: -0.05, bevelSegments: 6, curveSegments: 12 });
  ghGeo.translate(0, 0, -(ghWidth - ghBevel * 2) / 2);
  const gpos = ghGeo.attributes.position;
  for (let i = 0; i < gpos.count; i++) {
    const t = Math.min(1, Math.max(0, (gpos.getY(i) - belt) / (H - belt)));
    gpos.setZ(i, gpos.getZ(i) * (1 - 0.2 * t));
  }
  const greenhouse = new THREE.Mesh(smooth(ghGeo), glass);
  greenhouse.castShadow = true;
  body.add(greenhouse);

  if (model.body !== 'roadster') {
    // Painted roof: the top slice of the greenhouse profile, extruded slightly proud of the glass.
    const yCut = belt + (H - belt) * 0.86;
    const roofOutline = roofline.filter((p) => p.y >= yCut);
    if (roofOutline.length >= 3) {
      const roofShape = new THREE.Shape([new THREE.Vector2(roofOutline[0].x, yCut), ...roofOutline, new THREE.Vector2(roofOutline[roofOutline.length - 1].x, yCut)]);
      const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: ghWidth - ghBevel * 2, bevelEnabled: true, bevelThickness: ghBevel, bevelSize: 0.05, bevelOffset: -0.045, bevelSegments: 6, curveSegments: 12 });
      roofGeo.translate(0, 0, -(ghWidth - ghBevel * 2) / 2);
      const rpos = roofGeo.attributes.position;
      for (let i = 0; i < rpos.count; i++) {
        const t = Math.min(1, Math.max(0, (rpos.getY(i) - belt) / (H - belt)));
        rpos.setZ(i, rpos.getZ(i) * (1 - 0.2 * t) * 1.012);
        rpos.setY(i, rpos.getY(i) + 0.004);
      }
      const roof = new THREE.Mesh(smooth(roofGeo), paint);
      roof.castShadow = true;
      body.add(roof);
    }
  }

  // ---- details: lights, grille, mirrors, exhaust ----
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf4f8ff, emissive: 0xdfeaff, emissiveIntensity: config.scene === 'night' ? 3 : 1.2 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x8a0a10, emissive: 0xff1a22, emissiveIntensity: config.scene === 'night' ? 2.5 : 0.9 });
  const noseY = clearance + style.nose * (belt - clearance);
  for (const side of [1, -1]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.055, W * 0.2), headMat);
    head.position.set(L / 2 - 0.035, noseY - 0.035, side * W * 0.3);
    head.rotation.y = side * 0.25;
    body.add(head);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, W * 0.24), tailMat);
    tail.position.set(-L / 2 + 0.005, (clearance + beltBack) / 2 + 0.1, side * W * 0.31);
    tail.rotation.y = -side * 0.2;
    body.add(tail);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.12), trim);
    mirror.position.set(cowl - 0.08, belt + 0.06, side * (W * 0.42));
    mirror.castShadow = true;
    body.add(mirror);
  }
  const grilleH = Math.max(0.06, (noseY - clearance) * 0.45);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.03, grilleH, W * 0.5), trim);
  grille.position.set(L / 2 - 0.012, clearance + 0.1 + grilleH / 2, 0);
  body.add(grille);
  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0xb0b3b8, metalness: 1, roughness: 0.25 });
  for (const side of model.body === 'truck' ? [1] : [1, -1]) {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 20, 1, true), exhaustMat);
    tip.rotation.z = Math.PI / 2;
    tip.position.set(-L / 2 + 0.02, clearance + 0.07, side * W * 0.3);
    body.add(tip);
  }
  if (model.body === 'truck') {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(L * 0.32, 0.02, W * 0.84), trim);
    bed.position.set(-L * 0.33, beltBack + 0.001, 0);
    body.add(bed);
  }

  // ---- aero ----
  const underY = clearance + 0.01;
  if (aero.front) {
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.025, W * 0.98), carbon);
    splitter.position.set(L / 2 - 0.1, underY - 0.02, 0);
    body.add(splitter);
    if (aero.front === 'canard') {
      for (const side of [1, -1]) {
        for (const k of [0, 1]) {
          const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.1), carbon);
          fin.position.set(L / 2 - 0.08, underY + 0.1 + k * 0.08, side * (W / 2 - 0.02));
          fin.rotation.z = -0.25;
          body.add(fin);
        }
      }
    }
  }
  if (aero.side) {
    const blade = aero.side === 'blade';
    for (const side of [1, -1]) {
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(WB - archR * 2.1, blade ? 0.05 : 0.035, blade ? 0.09 : 0.05), carbon);
      skirt.position.set((xFront + xRear) / 2, underY - 0.01, side * (W / 2 - (blade ? 0.0 : 0.02)));
      body.add(skirt);
    }
  }
  if (aero.rear) {
    const race = aero.rear === 'race';
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, W * 0.7), carbon);
    plate.position.set(-L / 2 + 0.13, underY - 0.02, 0);
    plate.rotation.z = -0.12;
    body.add(plate);
    const strakes = race ? 6 : 4;
    for (let i = 0; i < strakes; i++) {
      const strake = new THREE.Mesh(new THREE.BoxGeometry(0.3, race ? 0.14 : 0.08, 0.012), carbon);
      strake.position.set(-L / 2 + 0.12, underY + (race ? 0.04 : 0.02), -W * 0.32 + (i * W * 0.64) / (strakes - 1));
      body.add(strake);
    }
  }
  if (aero.wing) {
    const deckX = model.body === 'hatch' || model.body === 'suv' ? -L / 2 + 0.1 : -L / 2 + 0.22;
    const deckY = model.body === 'hatch' || model.body === 'suv' ? H + 0.01 : beltBack;
    if (aero.wing === 'ducktail') {
      const duck = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, W * 0.8), carbon);
      duck.position.set(-L / 2 + 0.12, beltBack + 0.03, 0);
      duck.rotation.z = 0.35;
      body.add(duck);
    } else {
      const high = aero.wing === 'swan' ? 0.36 : 0.26;
      const plane = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.025, W * 0.95), carbon);
      plane.position.set(deckX - 0.04, deckY + high, 0);
      plane.rotation.z = 0.08;
      plane.castShadow = true;
      body.add(plane);
      for (const side of [1, -1]) {
        const end = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.012), carbon);
        end.position.set(deckX - 0.04, deckY + high - 0.02, side * W * 0.475);
        body.add(end);
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, high, 0.018), carbon);
        post.position.set(deckX, deckY + high / 2, side * W * 0.25);
        if (aero.wing === 'swan') {
          post.position.y = deckY + high / 2 + 0.03;
          post.rotation.z = -0.35;
        }
        body.add(post);
      }
    }
  }

  // ---- wheels ----
  const zOuterStock = W / 2 - model.fenderClearance / 1000;
  const zOuter = zOuterStock + report.pokeMm / 1000;
  const bolts = Number(model.boltPattern.split('x')[0]) || 5;
  for (const x of [xFront, xRear]) {
    for (const side of [1, -1]) {
      const mount = new THREE.Group();
      mount.position.set(x, tireR, side * zOuter);
      if (side < 0) mount.scale.z = -1;
      const pivot = new THREE.Group();
      pivot.rotation.x = (config.camber * Math.PI) / 180;
      mount.add(pivot);
      pivot.add(buildWheel({ config, tireR, wheelStyle, bolts, front: x === xFront }));
      group.add(mount);
    }
  }
  return group;
}

function buildWheel({ config, tireR, wheelStyle, bolts, front }: { config: BuildConfig; tireR: number; wheelStyle: WheelStyle; bolts: number; front: boolean }) {
  const wheel = new THREE.Group();
  const rimR = (config.diameter * 25.4) / 2000;
  const rimW = (config.width * 25.4) / 1000;
  const tireW = config.tireWidth / 1000;
  const zc = -rimW / 2;
  const deep = wheelStyle === 'deep-dish';
  const faceDepth = deep ? Math.min(rimW * 0.55, 0.035 + Math.max(0, 50 - config.offset) / 1000 * 0.9) : 0.02 + Math.max(0, config.width - 8) * 0.006;

  const rimMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(config.wheelColor), metalness: 0.85, roughness: 0.28, clearcoat: 0.6 });
  const lipMat = deep ? new THREE.MeshStandardMaterial({ color: 0xe6e8ea, metalness: 1, roughness: 0.12 }) : rimMat;
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.88, metalness: 0 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.6, metalness: 0.5 });

  // Tire: lathe of a rounded section between bead (rimR) and tread (tireR).
  const sidewall = tireR - rimR;
  const bulge = Math.min(0.012, Math.max(-0.006, (tireW - rimW) * 0.3));
  const profile: THREE.Vector2[] = [];
  const hw = tireW / 2;
  const seg = 14;
  profile.push(new THREE.Vector2(rimR - 0.005, -rimW / 2 - 0.002));
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const r = rimR + sidewall * t;
    const w = (rimW / 2) + (hw + bulge - rimW / 2) * Math.sin(t * Math.PI * 0.62) - (t > 0.82 ? ((t - 0.82) / 0.18) ** 2 * 0.02 : 0);
    profile.push(new THREE.Vector2(r, -w));
  }
  profile.push(new THREE.Vector2(tireR, 0));
  for (let i = seg; i >= 0; i--) {
    const t = i / seg;
    const r = rimR + sidewall * t;
    const w = (rimW / 2) + (hw + bulge - rimW / 2) * Math.sin(t * Math.PI * 0.62) - (t > 0.82 ? ((t - 0.82) / 0.18) ** 2 * 0.02 : 0);
    profile.push(new THREE.Vector2(r, w));
  }
  profile.push(new THREE.Vector2(rimR - 0.005, rimW / 2 + 0.002));
  const tireGeo = new THREE.LatheGeometry(profile, 64);
  tireGeo.rotateX(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.position.z = zc;
  tire.castShadow = true;
  wheel.add(tire);

  // Barrel + lip
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(rimR * 0.97, rimR * 0.97, rimW, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a2b2e, metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide }));
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = zc;
  wheel.add(barrel);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(rimR, deep ? 0.014 : 0.009, 10, 64), lipMat);
  lip.position.z = -0.004;
  wheel.add(lip);
  if (deep) {
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(rimR * 0.99, rimR * 0.9, faceDepth, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xdfe2e5, metalness: 1, roughness: 0.1, side: THREE.DoubleSide }));
    dish.rotation.x = Math.PI / 2;
    dish.position.z = -faceDepth / 2;
    wheel.add(dish);
  }

  // Face
  const face = new THREE.Group();
  face.position.z = -faceDepth;
  wheel.add(face);
  const inner = rimR * (deep ? 0.88 : 0.95);
  const hubR = rimR * 0.2;
  const spoke = (angle: number, width: number, thick: number, concave = 0.02, twist = 0) => {
    const len = inner - hubR;
    const geo = new THREE.BoxGeometry(len, width, thick);
    geo.translate(hubR + len / 2, 0, 0);
    const m = new THREE.Mesh(geo, rimMat);
    m.rotation.z = angle;
    m.rotation.y = concave; // tilt: hub sits deeper than the outer edge
    m.rotation.x = twist;
    m.castShadow = true;
    face.add(m);
  };
  const concave = Math.min(0.14, 0.03 + Math.max(0, 45 - config.offset) * 0.0015 + Math.max(0, config.width - 8.5) * 0.02);
  const n = { 'five-spoke': 5, 'six-spoke': 6, 'split-spoke': 5, 'multi-spoke': 10, mesh: 10, monoblock: 7, 'deep-dish': 5, turbofan: 18 }[wheelStyle];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    switch (wheelStyle) {
      case 'five-spoke':
        spoke(a, rimR * 0.22, 0.03, concave);
        break;
      case 'six-spoke':
        spoke(a, rimR * 0.16, 0.035, concave);
        break;
      case 'deep-dish':
        spoke(a, rimR * 0.2, 0.03, 0.01);
        break;
      case 'split-spoke':
        spoke(a - 0.09, rimR * 0.09, 0.028, concave);
        spoke(a + 0.09, rimR * 0.09, 0.028, concave);
        break;
      case 'multi-spoke':
        spoke(a, rimR * 0.075, 0.026, concave);
        break;
      case 'monoblock':
        spoke(a - 0.06, rimR * 0.08, 0.03, concave, 0.3);
        spoke(a + 0.06, rimR * 0.08, 0.03, concave, -0.3);
        break;
      case 'mesh':
        spoke(a + 0.2, rimR * 0.045, 0.02, concave * 0.5);
        spoke(a - 0.2, rimR * 0.045, 0.02, concave * 0.5);
        break;
      case 'turbofan':
        spoke(a, rimR * 0.06, 0.02, 0.02, 0.7);
        break;
    }
  }
  if (wheelStyle === 'mesh' || wheelStyle === 'turbofan') {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(inner * 0.97, 0.012, 8, 48), rimMat);
    face.add(ring);
  }
  if (wheelStyle === 'turbofan') {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(inner, 48), darkMat);
    disc.position.z = -0.03;
    face.add(disc);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(hubR, hubR * 1.05, 0.05, 32), rimMat);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = -0.01;
  face.add(hub);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(hubR * 0.45, hubR * 0.45, 0.02, 24), darkMat);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = 0.018;
  face.add(cap);
  const nutMat = new THREE.MeshStandardMaterial({ color: 0x9a9da2, metalness: 1, roughness: 0.3 });
  for (let i = 0; i < bolts; i++) {
    const a = (i / bolts) * Math.PI * 2 + 0.3;
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.02, 6), nutMat);
    nut.rotation.x = Math.PI / 2;
    nut.position.set(Math.cos(a) * hubR * 0.72, Math.sin(a) * hubR * 0.72, 0.016);
    face.add(nut);
  }

  // Brakes sit behind the face and do not rotate with the wheel.
  const discR = Math.min(rimR * 0.78, 0.2);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(discR, discR, 0.028, 40), new THREE.MeshStandardMaterial({ color: 0x6e7074, metalness: 0.9, roughness: 0.45 }));
  disc.rotation.x = Math.PI / 2;
  disc.position.z = -faceDepth - 0.07;
  wheel.add(disc);
  const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.1, discR * 0.8, 0.07), new THREE.MeshStandardMaterial({ color: new THREE.Color(config.caliperColor), roughness: 0.35, metalness: 0.2 }));
  caliper.position.set(front ? -discR * 0.72 : discR * 0.72, discR * 0.35, -faceDepth - 0.06);
  caliper.rotation.z = front ? 0.4 : -0.4;
  wheel.add(caliper);
  return wheel;
}
