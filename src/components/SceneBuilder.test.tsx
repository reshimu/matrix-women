// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { SceneBuilder } from './SceneBuilder'

class FakeIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  constructor() {}
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.localStorage.clear()
})

function getExportedScene() {
  const textarea = screen.getByLabelText(/^exported json/i) as HTMLTextAreaElement
  return JSON.parse(textarea.value)
}

describe('SceneBuilder layer management', () => {
  it('adds a particles layer with valid defaults and removes it again', () => {
    render(<SceneBuilder />)

    expect(getExportedScene().layers.some((layer: { type: string }) => layer.type === 'particles')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: /add particles layer/i }))
    expect(getExportedScene().layers.some((layer: { type: string }) => layer.type === 'particles')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /remove particles-1/i }))
    expect(getExportedScene().layers.some((layer: { type: string }) => layer.type === 'particles')).toBe(false)
  })

  it('moves a layer up via the keyboard-accessible move button', () => {
    render(<SceneBuilder />)
    const before = getExportedScene().layers.map((layer: { id: string }) => layer.id)
    expect(before).toEqual(['subject', 'matrix-rain', 'ambient-light'])

    fireEvent.click(screen.getByRole('button', { name: /move matrix-rain up/i }))

    const after = getExportedScene().layers.map((layer: { id: string }) => layer.id)
    expect(after).toEqual(['matrix-rain', 'subject', 'ambient-light'])
  })

  it('disables the move-up button for the first layer and move-down for the last', () => {
    render(<SceneBuilder />)
    expect((screen.getByRole('button', { name: /move subject up/i }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: /move ambient-light down/i }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('SceneBuilder multi-scene management', () => {
  it('creates a new scene, switches to it, and edits are isolated per scene', () => {
    render(<SceneBuilder />)
    const originalId = getExportedScene().id

    fireEvent.click(screen.getByRole('button', { name: /new scene/i }))
    expect(getExportedScene().id).not.toBe(originalId)
    expect(getExportedScene().title).toBe('Untitled scene')

    const titleInput = screen.getByLabelText(/^title$/i)
    fireEvent.change(titleInput, { target: { value: 'My second scene' } })
    expect(getExportedScene().title).toBe('My second scene')

    const select = screen.getByLabelText(/^scene$/i) as HTMLSelectElement
    fireEvent.change(select, { target: { value: originalId } })
    expect(getExportedScene().id).toBe(originalId)
    expect(getExportedScene().title).not.toBe('My second scene')
  })

  it('duplicates the active scene under a new id, preserving its content', () => {
    render(<SceneBuilder />)
    const originalLayerCount = getExportedScene().layers.length

    fireEvent.click(screen.getByRole('button', { name: /duplicate/i }))

    const duplicated = getExportedScene()
    expect(duplicated.title).toMatch(/\(copy\)$/)
    expect(duplicated.layers).toHaveLength(originalLayerCount)
  })

  it('deletes the active scene and falls back to a remaining one, disabling delete at one scene left', () => {
    render(<SceneBuilder />)
    expect((screen.getByRole('button', { name: /^delete$/i }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /new scene/i }))
    expect((screen.getByRole('button', { name: /^delete$/i }) as HTMLButtonElement).disabled).toBe(false)

    const newSceneId = getExportedScene().id
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(getExportedScene().id).not.toBe(newSceneId)
    expect((screen.getByRole('button', { name: /^delete$/i }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('persists builder state to localStorage across remounts', () => {
    const { unmount } = render(<SceneBuilder />)
    fireEvent.click(screen.getByRole('button', { name: /new scene/i }))
    const createdId = getExportedScene().id
    unmount()

    render(<SceneBuilder />)
    expect(getExportedScene().id).toBe(createdId)
  })
})

describe('SceneBuilder config round-trip', () => {
  it('still round-trips a full scene via export -> import', () => {
    render(<SceneBuilder />)
    const exported = screen.getByLabelText(/^exported json/i) as HTMLTextAreaElement

    fireEvent.click(screen.getByRole('button', { name: /add particles layer/i }))
    const exportedWithParticles = exported.value

    fireEvent.click(screen.getByRole('button', { name: /new scene/i }))
    expect(getExportedScene().layers.some((layer: { type: string }) => layer.type === 'particles')).toBe(false)

    const importField = screen.getByLabelText(/import json/i)
    fireEvent.change(importField, { target: { value: exportedWithParticles } })
    fireEvent.click(screen.getByRole('button', { name: /apply imported json/i }))

    expect(getExportedScene().layers.some((layer: { type: string }) => layer.type === 'particles')).toBe(true)
    expect(screen.queryByRole('list', { name: /issues/i })).toBeNull()
  })

  it('surfaces validation issues for malformed import JSON without crashing', () => {
    render(<SceneBuilder />)
    const importField = screen.getByLabelText(/import json/i)
    fireEvent.change(importField, { target: { value: '{not valid json' } })
    fireEvent.click(screen.getByRole('button', { name: /apply imported json/i }))

    expect(within(document.body).getByText(/invalid json/i)).toBeTruthy()
  })
})
