import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { ThemeScript } from '@/components/theme/theme-script';
import { Toaster } from '@/components/ui/sonner';
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  isValidMode,
  isValidTheme,
  MODE_COOKIE_KEY,
  THEME_COOKIE_KEY,
} from '@/lib/theme';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Funmagic Admin',
  description: 'Admin panel for Funmagic AI',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_KEY)?.value;
  const modeCookie = cookieStore.get(MODE_COOKIE_KEY)?.value;

  const defaultTheme =
    themeCookie && isValidTheme(themeCookie) ? themeCookie : DEFAULT_THEME;
  const defaultMode =
    modeCookie && isValidMode(modeCookie) ? modeCookie : DEFAULT_MODE;

  return (
    <html lang="en" data-theme={defaultTheme} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f6f6f8" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#131022" media="(prefers-color-scheme: dark)" />
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme={defaultTheme} defaultMode={defaultMode}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
