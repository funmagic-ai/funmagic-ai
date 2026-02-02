import Link from "next/link"
import { ShieldX } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-4">
            <ShieldX className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin panel. Please contact
            an administrator if you believe this is a mistake.
          </p>
          <Link
            href="/login"
            className="inline-block bg-gray-900 text-white py-2 px-6 rounded-lg hover:bg-gray-800"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
