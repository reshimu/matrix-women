import type { ReactNode } from 'react'

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
