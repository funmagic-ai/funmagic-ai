"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { signUp } from "@/lib/auth-client"
import { useRouter } from "@/i18n/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    const result = await signUp.email({
      name,
      email,
      password,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error.message || "Registration failed")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-card text-card-foreground rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6">{t("common.signUp")}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                {t("auth.email")}
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                {t("auth.password")}
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-10"
                placeholder="At least 8 characters"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t("common.loading") : t("common.signUp")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <a href="/login" className="text-primary hover:underline">
              {t("common.signIn")}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
