"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { StyleInitializer } from "@/components/style-initializer"
import { SystemInitializer } from "@/components/system-initializer"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <StyleInitializer />
      <SystemInitializer />
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}
