import type { ReactNode } from 'react'
import '@reshimu/matrix-ai-ui/react.css'

export const metadata = {
  title: 'Matrix AI UI — Next.js consumer fixture',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
