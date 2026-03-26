import { Manrope } from 'next/font/google'
import './globals.css'
import { AppProviders } from './providers'

const manrope = Manrope({ subsets: ['latin'] })

export const metadata = {
  title: 'Pharmacy Manager Dashboard',
  description: 'UI-first, role-based pharmacy management dashboard'
}

export default function RootLayout({ children }) {
  const themeBootstrapScript = `
    (function () {
      try {
        var savedTheme = localStorage.getItem('pm-theme');
        var theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';
        var root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        root.style.colorScheme = theme;
      } catch (_error) {}
    })();
  `

  return (
    <html lang='fr' suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={manrope.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
