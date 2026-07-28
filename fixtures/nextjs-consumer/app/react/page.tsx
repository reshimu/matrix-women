import { defaultScene } from '@reshimu/matrix-ai-ui'
import { SceneFallback } from '@reshimu/matrix-ai-ui/react'

// This file has no 'use client' directive of its own -- it is a Server Component
// rendering a Client Component (SceneFallback ships its own 'use client' directive
// from @reshimu/matrix-ai-ui/react). That's the exact scenario this fixture exists to prove.
export default function ReactExportPage() {
  return <SceneFallback scene={defaultScene} />
}
