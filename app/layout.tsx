import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
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
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var savedTheme = localStorage.getItem('theme');
                var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme = savedTheme || (systemDark ? 'dark' : 'light');
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(theme);
              } catch (e) {}
            })();
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
