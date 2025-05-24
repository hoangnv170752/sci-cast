import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { EnvCheck } from "@/components/env-check"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sci-Cast - Technology Podcast Platform",
  description: "Listen to the latest technology podcasts for influencers, techies, students, and researchers",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
          <AuthProvider>
            {children}
            <EnvCheck />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
