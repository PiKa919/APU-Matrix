import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('three', () => {
  const dispose = vi.fn();
  return {
    rendererDispose: dispose,
    Scene: class { add() {} },
    PerspectiveCamera: class { constructor() { this.position = { set() {} }; } lookAt() {} updateProjectionMatrix() {} },
    WebGLRenderer: class { constructor() { this.domElement = document.createElement('canvas'); } setPixelRatio() {} setSize() {} render() {} dispose = dispose; },
    Group: class { constructor() { this.rotation = { x: 0, y: 0 }; } add() {} },
    BoxGeometry: class { dispose = dispose; },
    EdgesGeometry: class { dispose = dispose; },
    MeshBasicMaterial: class { dispose = dispose; },
    LineBasicMaterial: class { dispose = dispose; },
    Mesh: class { constructor() { this.position = { set() {} }; } },
    LineSegments: class { constructor() {} },
    Color: class { constructor() {} },
  };
});

import HeroProcessorScene from '@/components/HeroProcessorScene';
import * as THREE from 'three';

describe('HeroProcessorScene', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders an accessible canvas region and disposes the renderer on unmount', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const { unmount } = render(<HeroProcessorScene />);

    expect(screen.getByLabelText('Animated processor lattice')).toBeInTheDocument();
    unmount();
    expect(THREE.rendererDispose).toHaveBeenCalled();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });

  it('renders the same scene without scheduling animation for reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    render(<HeroProcessorScene />);

    expect(screen.getByLabelText('Static processor lattice')).toBeInTheDocument();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });
});
