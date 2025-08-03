import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "./providers/query-provider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PesoHQ - High Performance Data Grid",
  description: "A high-performance data grid with real-time updates and virtualization",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
        <Toaster 
          closeButton 
          toastOptions={{
            style: {
              background: 'white',
              color: '#374151',
              border: '1px solid #e5e7eb',
            },
            className: 'font-sans',
          }}
        />
      </body>
    </html>
  )
}
