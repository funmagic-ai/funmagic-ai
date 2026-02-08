"use client"

import { useState } from "react"
import { signIn } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/layout/logo"
import { LoginInputSchema } from "@funmagic/shared/schemas"

type FieldErrors = {
  email?: string
  password?: string
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setFieldErrors({})

    // Validate with Zod
    const result = LoginInputSchema.safeParse({ email, password })
    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors
        if (field && !errors[field]) {
          errors[field] = issue.message
        }
      }
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    const signInResult = await signIn.email({
      email,
      password,
    })

    setLoading(false)

    if (signInResult.error) {
      setError(signInResult.error.message || "Login failed")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="bg-card text-card-foreground rounded-xl shadow-lg p-8 border border-border">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Logo className="h-6 w-6" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">Admin Login</h1>
          <p className="text-center text-muted-foreground mb-6">
            Sign in to access the admin panel
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <div role="alert" className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
              />
              {fieldErrors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
