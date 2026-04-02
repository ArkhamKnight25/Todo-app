import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '../lib/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'TaskFlow - Asana-Inspired Todo App',
  description: 'A modern, collaborative task management application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
