import type { Metadata } from 'next'
import { practiceConfig } from '@/lib/practice-config'
import './globals.css'

export const metadata: Metadata = {
  title: `${practiceConfig.name} - ${practiceConfig.specialization}`,
  description: `Professional healthcare services by ${practiceConfig.doctor} in ${practiceConfig.location}. Specializing in ${practiceConfig.specialization}.`,
  keywords: `healthcare, ${practiceConfig.specialization}, ${practiceConfig.location}, ${practiceConfig.doctor}`,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏥</text></svg>" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}