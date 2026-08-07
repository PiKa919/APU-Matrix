import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('three', () => {
  const rendererDispose = vi.fn();
  const geometryDispose = vi.fn();
  const materialDispose = vi.fn();
  let rendererShouldThrow = false;
  let rendererCanvas;
  return {
    rendererDispose,
    geometryDispose,
    materialDispose,
    getRendererCanvas: () => rendererCanvas,
    setWebGLRendererFailure: (value) => { rendererShouldThrow = value; },
    Scene: class { add() {} },
    PerspectiveCamera: class { constructor() { this.position = { set() {} }; } lookAt() {} updateProjectionMatrix() {} },
    WebGLRenderer: class { constructor() { if (rendererShouldThrow) throw new Error('WebGL is unavailable'); this.domElement = document.createElement('canvas'); rendererCanvas = this.domElement; } setPixelRatio() {} setSize() {} render() {} dispose = rendererDispose; },
    Group: class { constructor() { this.rotation = { x: 0, y: 0 }; } add() {} },
    BoxGeometry: class { dispose = geometryDispose; },
    EdgesGeometry: class { dispose = geometryDispose; },
    MeshBasicMaterial: class { dispose = materialDispose; },
    LineBasicMaterial: class { dispose = materialDispose; },
    Mesh: class { constructor() { this.position = { set() {} }; } },
    LineSegments: class { constructor() {} },
    Color: class { constructor() {} },
  };
});

import HeroProcessorScene from '@/components/HeroProcessorScene';
import * as THREE from 'three';

describe('HeroProcessorScene', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    THREE.setWebGLRendererFailure(false);
    vi.clearAllMocks();
  });

  it('disposes every scene resource and removes the canvas on unmount', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(0));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const observerDisconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect = observerDisconnect;
    });
    const { container, unmount } = render(<HeroProcessorScene />);
    const canvas = container.querySelector('canvas');
    const rendererCanvas = THREE.getRendererCanvas();
    const removeCanvas = vi.spyOn(rendererCanvas, 'remove');

    expect(screen.getByLabelText('Animated processor lattice')).toBeInTheDocument();
    expect(canvas).toBeInTheDocument();
    unmount();

    expect(THREE.rendererDispose).toHaveBeenCalled();
    expect(THREE.geometryDispose).toHaveBeenCalledTimes(9);
    expect(THREE.materialDispose).toHaveBeenCalledTimes(9);
    expect(observerDisconnect).toHaveBeenCalledTimes(1);
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(0);
    expect(removeCanvas).toHaveBeenCalledTimes(1);
    expect(canvas.parentElement).toBeNull();
  });

  it('renders the same scene without scheduling animation for reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    render(<HeroProcessorScene />);

    expect(screen.getByLabelText('Static processor lattice')).toBeInTheDocument();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('keeps a labelled static fallback when WebGL renderer initialization fails', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    THREE.setWebGLRendererFailure(true);

    const { container } = render(<HeroProcessorScene />);

    expect(screen.getByRole('img', { name: 'Static processor lattice (WebGL unavailable)' })).toBeInTheDocument();
    expect(screen.getByText('Static processor lattice')).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull();
  });
});
