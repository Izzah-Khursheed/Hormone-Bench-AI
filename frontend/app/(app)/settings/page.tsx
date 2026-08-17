"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, KeyRound, LogOut, MailCheck } from "lucide-react"

import { AppHeader } from "@/components/layout/app-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { getAuthErrorMessage } from "@/lib/auth/error-messages"

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
  }
  return email?.[0]?.toUpperCase() ?? "?"
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, sendPasswordReset, signOut } = useAuth()

  const [isSendingReset, setIsSendingReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handlePasswordReset() {
    if (!user?.email) return
    setResetError(null)
    setIsSendingReset(true)
    try {
      await sendPasswordReset(user.email)
      setResetSent(true)
    } catch (err) {
      setResetError(getAuthErrorMessage(err))
    } finally {
      setIsSendingReset(false)
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    await signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title="Settings"
        description="Manage your account."
      />

      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your account information from your Firebase profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                <AvatarFallback>
                  {getInitials(user?.displayName, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {user?.displayName || "—"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="full-name">Full name</Label>
                <Input id="full-name" value={user?.displayName ?? ""} disabled />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email ?? ""} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your password and session.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {resetError ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            ) : null}

            {resetSent ? (
              <div className="flex items-start gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                <MailCheck className="mt-0.5 size-4 shrink-0" />
                <span>
                  If an account exists for {user?.email}, we&apos;ve sent a
                  link to reset your password.
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <KeyRound className="size-4 text-muted-foreground" />
                  Change password
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePasswordReset}
                  disabled={isSendingReset || !user?.email}
                >
                  {isSendingReset ? "Sending…" : "Send reset link"}
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              variant="destructive"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut />
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
