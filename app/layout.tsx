import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ui/theme-provider'
import SupabaseProvider from './supabase-provider'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}