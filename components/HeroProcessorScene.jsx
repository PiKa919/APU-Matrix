'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroProcessorScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const lattice = new THREE.Group();
    const resources = [];
    camera.position.set(0, 0, 7);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        const geometry = new THREE.BoxGeometry(1.05, 1.05, 0.24);
        const material = new THREE.MeshBasicMaterial({
          color: x === 0 && y === 0 ? '#72d7f6' : '#53616e',
          wireframe: true,
          transparent: true,
          opacity: x === 0 && y === 0 ? 0.9 : 0.34,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x * 1.35, y * 1.35, (Math.abs(x) + Math.abs(y)) * -0.18);
        lattice.add(mesh);
        resources.push(geometry, material);
      }
    }
    scene.add(lattice);

    function resize() {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    function draw() {
      renderer.render(scene, camera);
    }
    let frameId;
    function animate() {
      lattice.rotation.y += 0.003;
      lattice.rotation.x = Math.sin(Date.now() * 0.00035) * 0.11;
      draw();
      frameId = window.requestAnimationFrame(animate);
    }
    resize();
    if (reducedMotion) draw(); else animate();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      observer.disconnect();
      resources.forEach((resource) => resource.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return <div ref={containerRef} className="hero-scene" role="img" aria-label={reducedMotion ? 'Static processor lattice' : 'Animated processor lattice'} />;
}
