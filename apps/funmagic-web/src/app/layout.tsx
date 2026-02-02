import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Funmagic AI - AI Tools Platform',
  description: 'Create amazing content with AI-powered tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-accent="purple" suppressHydrationWarning>
      <head>
        {/* FOUC prevention script - must be in <head> to run before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem('theme'),
                  s=window.matchMedia('(prefers-color-scheme: dark)').matches;
              if(t==='dark'||(!t&&s))
                document.documentElement.classList.add('dark');
              document.documentElement.dataset.accent=
                localStorage.getItem('accent')||'purple'
            }catch(e){}})()`,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
