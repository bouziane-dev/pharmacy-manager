import { Manrope } from 'next/font/google'
import './globals.css'
import { AppProviders } from './providers'

const manrope = Manrope({ subsets: ['latin'] })

export const metadata = {
  title: 'Pharmacy Manager Dashboard',
  description: 'UI-first, role-based pharmacy management dashboard'
}

export default function RootLayout({ children }) {
  return (
    <html lang='fr' suppressHydrationWarning>
      <body className={manrope.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
