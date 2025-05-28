import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StarHistory - Track GitHub Repository Star Growth",
  description: "Visualize the star history of GitHub repositories with beautiful charts and analytics",
  keywords: "github, stars, repository, analytics, open source, tracking",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="8L9RtyerwgMhYKkaY7BmUXXySRHyuMwERNq5AuqsNlg" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
