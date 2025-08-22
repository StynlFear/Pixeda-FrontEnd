import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Pixeda Management System",
  description: "Internal print-shop management tool for Pixeda.ro",
  generator: ''
}

type Props = {
  children: React.ReactNode;
  params: {locale: string};
};

export default function LocaleLayout({
  children,
  params: {locale}
}: Props) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export function generateStaticParams() {
  return [{locale: 'en'}, {locale: 'ro'}];
}
