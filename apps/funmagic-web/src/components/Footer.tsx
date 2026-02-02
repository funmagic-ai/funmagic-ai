import Link from 'next/link'
import { connection } from 'next/server'

export async function Footer() {
  await connection()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Funmagic AI</h3>
            <p className="text-sm">
              Transform your ideas into reality with our powerful AI tools.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Tools</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tools" className="hover:text-white transition-colors">
                  All Tools
                </Link>
              </li>
              <li>
                <Link href="/tools/figme" className="hover:text-white transition-colors">
                  FigMe
                </Link>
              </li>
              <li>
                <Link href="/tools/background-remove" className="hover:text-white transition-colors">
                  Background Remove
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/assets" className="hover:text-white transition-colors">
                  My Assets
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>&copy; {year} Funmagic AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
