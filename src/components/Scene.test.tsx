// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Scene } from './Scene'
import { defaultScene } from '../scene'

class FakeIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  constructor() {}
}

class FakeResizeObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  constructor() {}
}

function createFakeWebglContext() {
  const shader = {}
  const program = {}
  return {
    createShader: () => shader,
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    deleteShader: () => {},
    createProgram: () => program,
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    deleteProgram: () => {},
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    getAttribLocation: () => 0,
    getUniformLocation: () => ({}),
    useProgram: () => {},
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    uniform1f: () => {},
    uniform2f: () => {},
    uniform4f: () => {},
    uniform1i: () => {},
    activeTexture: () => {},
    bindTexture: () => {},
    drawArrays: () => {},
    viewport: () => {},
    createTexture: () => ({}),
    deleteTexture: () => {},
    texImage2D: () => {},
    pixelStorei: () => {},
    texParameteri: () => {},
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    FLOAT: 7,
    TRIANGLES: 8,
    TEXTURE0: 9,
    TEXTURE_2D: 10,
    RGBA: 11,
    UNSIGNED_BYTE: 12,
    UNPACK_FLIP_Y_WEBGL: 13,
    CLAMP_TO_EDGE: 14,
    TEXTURE_WRAP_S: 15,
    TEXTURE_WRAP_T: 16,
    TEXTURE_MIN_FILTER: 17,
    TEXTURE_MAG_FILTER: 18,
    LINEAR: 19,
  }
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Scene branch decision', () => {
  it('mounts SceneWebgl when WebGL is available and motion is not reduced', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement, id: string) {
      return id === 'webgl' ? (createFakeWebglContext() as unknown as RenderingContext) : null
    } as typeof HTMLCanvasElement.prototype.getContext)

    render(<Scene scene={{ ...defaultScene, reducedMotion: false }} />)

    expect(document.querySelector('.scene__webgl-canvas')).not.toBeNull()
    expect(document.querySelector('.scene__subject')).toBeNull()
  })

  it('mounts SceneFallback when WebGL is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    render(<Scene scene={{ ...defaultScene, reducedMotion: false }} />)

    expect(document.querySelector('.scene__webgl-canvas')).toBeNull()
    expect(document.querySelector('.scene__subject')).not.toBeNull()
  })

  it('mounts SceneFallback when reduced motion is requested, even if WebGL is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement, id: string) {
      return id === 'webgl' ? (createFakeWebglContext() as unknown as RenderingContext) : null
    } as typeof HTMLCanvasElement.prototype.getContext)

    render(<Scene scene={{ ...defaultScene, reducedMotion: true }} />)

    expect(document.querySelector('.scene__webgl-canvas')).toBeNull()
    expect(document.querySelector('.scene__subject')).not.toBeNull()
  })
})
