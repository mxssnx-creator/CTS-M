import type { Metadata } from "next"
// @ts-expect-error CSS import not typed
import "@/app/globals.css"
import { Providers } from "@/components/providers"
import { initializeApplication } from "@/lib/init-app"

export const metadata: Metadata = {
  title: "CTS v3.2 Dashboard",
  description: "Crypto Trading System Dashboard",
}

export const dynamic = "force-dynamic"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await initializeApplication()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
