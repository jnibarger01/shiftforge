'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { BuildConfig } from '@/lib/types';

export type CarPreviewHandle = {
  capture: () => string | null;
};

type Props = {
  config: BuildConfig;
  className?: string;
};

const carDims = {
  'sport-coupe': { length: 4.55, width: 1.92, height: 0.52, cabin: 0.72 },
  'performance-sedan': { length: 4.9, width: 1.9, height: 0.56, cabin: 0.78 },
  'track-hatch': { length: 4.25, width: 1.86, height: 0.58, cabin: 0.86 },
};

function finishValues(finish: BuildConfig['finish']) {
  if (finish === 'matte') return { roughness: 0.78, metalness: 0.05 };
  if (finish === 'satin') return { roughness: 0.42, metalness: 0.12 };
  return { roughness: 0.18, metalness: 0.22 };
}

const CarPreview = forwardRef<CarPreviewHandle, Props>(function CarPreview(
  { config, className },
  ref,
) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useImperativeHandle(ref, () => ({
    capture: () => {
      const canvas = rendererRef.current?.domElement;
      return canvas ? canvas.toDataURL('image/png') : null;
    },
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const bg =
      config.environment === 'night'
        ? '#05070c'
        : config.environment === 'salt'
          ? '#d9dde0'
          : '#0b0d10';
    scene.background = new THREE.Color(bg);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(6.4, 2.9, 6.1);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = config.environment === 'night' ? 1.35 : 1.05;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4.8;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 0.72, 0);

    const hemi = new THREE.HemisphereLight(
      config.environment === 'night' ? 0x5070aa : 0xffffff,
      0x111215,
      config.environment === 'night' ? 2.1 : 1.6,
    );
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 5.2);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    scene.add(key);

    const rim = new THREE.DirectionalLight(
      config.environment === 'night' ? 0x3f6dff : 0xff8b4a,
      3.4,
    );
    rim.position.set(-5, 3, -4);
    scene.add(rim);

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: config.environment === 'salt' ? 0xc9cdd0 : 0x111419,
      roughness: 0.84,
      metalness: 0,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const group = new THREE.Group();
    scene.add(group);

    const dims = carDims[config.car];
    const wheelRadius = 0.44 + (config.wheelSize - 17) * 0.025;
    const wheelWidth = config.wheel === 'deep-dish' ? 0.3 : 0.24;
    const bodyY = wheelRadius + 0.38 - config.stance * 0.0038;
    const finish = finishValues(config.finish);
    const paint = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(config.paint),
      roughness: finish.roughness,
      metalness: finish.metalness,
      clearcoat: config.finish === 'gloss' ? 1 : 0.28,
      clearcoatRoughness: 0.12,
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(dims.length, dims.height, dims.width),
      paint,
    );
    body.position.y = bodyY;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(dims.length * 0.34, dims.height * 0.36, dims.width * 0.94),
      paint,
    );
    hood.position.set(dims.length * 0.32, bodyY + dims.height * 0.37, 0);
    hood.castShadow = true;
    group.add(hood);

    const cabinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x121a22,
      roughness: 0.18,
      metalness: 0.18,
      transmission: 0.08,
      transparent: true,
      opacity: 0.94,
    });
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(dims.length * 0.48, dims.cabin, dims.width * 0.82),
      cabinMaterial,
    );
    cabin.position.set(
      config.car === 'track-hatch' ? -0.12 : -0.28,
      bodyY + dims.height * 0.7,
      0,
    );
    cabin.rotation.z = config.car === 'sport-coupe' ? -0.035 : 0;
    cabin.castShadow = true;
    group.add(cabin);

    const bumperMaterial = new THREE.MeshStandardMaterial({
      color: 0x111318,
      roughness: 0.5,
      metalness: 0.2,
    });
    for (const x of [-dims.length * 0.51, dims.length * 0.51]) {
      const bumper = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.2, dims.width * 0.92),
        bumperMaterial,
      );
      bumper.position.set(x, bodyY - 0.09, 0);
      group.add(bumper);
    }

    const lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xeaf4ff,
      emissive: 0x9ec8ff,
      emissiveIntensity: 4,
    });
    for (const z of [-dims.width * 0.31, dims.width * 0.31]) {
      const light = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.11, dims.width * 0.22),
        lightMaterial,
      );
      light.position.set(dims.length * 0.506, bodyY + 0.1, z);
      group.add(light);
    }

    const tyreMaterial = new THREE.MeshStandardMaterial({
      color: 0x08090b,
      roughness: 0.9,
    });
    const rimMaterial = new THREE.MeshStandardMaterial({
      color:
        config.wheel === 'aero'
          ? 0x17191d
          : config.wheel === 'mesh'
            ? 0xc7c9cc
            : 0x6c7077,
      roughness: 0.25,
      metalness: 0.82,
    });
    const wheelX = dims.length * 0.33;
    const wheelZ = dims.width * 0.5 + (config.wheel === 'deep-dish' ? 0.02 : -0.01);
    for (const x of [-wheelX, wheelX]) {
      for (const z of [-wheelZ, wheelZ]) {
        const tyre = new THREE.Mesh(
          new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 36),
          tyreMaterial,
        );
        tyre.rotation.x = Math.PI / 2;
        tyre.position.set(x, wheelRadius - config.stance * 0.0018, z);
        tyre.castShadow = true;
        group.add(tyre);

        const rimMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(wheelRadius * 0.62, wheelRadius * 0.62, wheelWidth + 0.012, 24),
          rimMaterial,
        );
        rimMesh.rotation.x = Math.PI / 2;
        rimMesh.position.copy(tyre.position);
        group.add(rimMesh);
      }
    }

    if (config.aero !== 'stock') {
      const splitter = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.055, dims.width * 1.03),
        bumperMaterial,
      );
      splitter.position.set(dims.length * 0.49, bodyY - 0.29, 0);
      group.add(splitter);
    }

    if (config.aero === 'wing' || config.aero === 'track') {
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.06, dims.width * 0.9),
        bumperMaterial,
      );
      wing.position.set(-dims.length * 0.43, bodyY + 0.73, 0);
      group.add(wing);
      for (const z of [-0.48, 0.48]) {
        const stand = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.42, 0.05),
          bumperMaterial,
        );
        stand.position.set(-dims.length * 0.43, bodyY + 0.5, z);
        group.add(stand);
      }
    }

    if (config.aero === 'track') {
      const side = new THREE.Mesh(
        new THREE.BoxGeometry(dims.length * 0.6, 0.05, dims.width * 1.045),
        bumperMaterial,
      );
      side.position.set(0, bodyY - 0.28, 0);
      group.add(side);
    }

    const resize = () => {
      const width = mount.clientWidth;
      const height = Math.max(360, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      rendererRef.current = null;
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [
    config.aero,
    config.car,
    config.environment,
    config.finish,
    config.paint,
    config.stance,
    config.wheel,
    config.wheelSize,
  ]);

  return <div ref={mountRef} className={className ?? 'car-preview'} />;
});

export default CarPreview;
