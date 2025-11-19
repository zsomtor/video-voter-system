import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bazu Podcast - Videó Szavazó',
  description: 'Szavazz YouTube videó címekre és thumbnailekre a teljesítmény előrejelzéséhez',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  )
}
