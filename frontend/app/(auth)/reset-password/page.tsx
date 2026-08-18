"use client"

import { Suspense, useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react"

import { firebaseAuth } from "@/lib/firebase/client"
import { getAuthErrorMessage } from "@/lib/auth/error-messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Status = "verifying" | "ready" | "invalid" | "success"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oobCode = searchParams.get("oobCode")

  const [status, setStatus] = useState<Status>("verifying")
  const [email, setEmail] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true
    if (!oobCode) {
      setStatus("invalid")
      return
    }

    verifyPasswordResetCode(firebaseAuth, oobCode)
      .then((verifiedEmail) => {
        if (isMounted) {
          setEmail(verifiedEmail)
          setStatus("ready")
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(getAuthErrorMessage(err))
          setStatus("invalid")
        }
      })

    return () => {
      isMounted = false
    }
  }, [oobCode])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!oobCode) return

    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await confirmPasswordReset(firebaseAuth, oobCode, password)
      setStatus("success")
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "verifying") {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">Verifying your link…</p>
        </CardContent>
      </Card>
    )
  }

  if (status === "invalid") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="size-4.5" />
          </span>
          <CardTitle className="text-xl">Link expired or invalid</CardTitle>
          <CardDescription>
            {error ?? "This password reset link is no longer valid. Request a new one to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" render={<Link href="/forgot-password" />}>
            Request a new link
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted text-secondary">
            <CheckCircle2 className="size-4.5" />
          </span>
          <CardTitle className="text-xl">Password updated</CardTitle>
          <CardDescription>
            Your password has been reset. Sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => router.push("/login")}
          >
            <ArrowLeft />
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>
          {email ? `Resetting the password for ${email}.` : "Choose a new password for your account."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">
              At least 8 characters, with a letter and a number.
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="mt-1">
            {isSubmitting ? "Saving…" : "Save new password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
