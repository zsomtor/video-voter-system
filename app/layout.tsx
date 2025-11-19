import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Video Voter - Test Your YouTube Packaging',
  description: 'Vote on YouTube video titles and thumbnails to predict performance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
