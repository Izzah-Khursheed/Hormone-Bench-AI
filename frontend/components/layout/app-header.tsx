"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronDown, LogOut, Settings, User, Activity, RefreshCw } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { healthApi, type HealthCheckResponse } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export function AppHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [health, setHealth] = React.useState<HealthCheckResponse | null>(null)
  const [isChecking, setIsChecking] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const checkHealth = React.useCallback(async () => {
    setIsChecking(true)
    setError(null)
    try {
      const res = await healthApi.check()
      setHealth(res)
    } catch (err: any) {
      setError(err.message || "Offline")
    } finally {
      setIsChecking(false)
    }
  }, [])

  React.useEffect(() => {
    checkHealth()
  }, [checkHealth])

  async function handleSignOut() {
    await signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h1 className="truncate text-base font-semibold text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {description}
          </p>
        ) : null}
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <button
          onClick={checkHealth}
          title="Click to re-check API status"
          className="flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/30 px-2.5 py-1 text-xs transition-colors hover:bg-muted/80"
        >
          <span className="relative flex size-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                health?.status === "ok" ? "bg-emerald-400" : isChecking ? "bg-amber-400" : "bg-rose-400"
              }`}
            />
            <span
              className={`relative inline-flex size-2 rounded-full ${
                health?.status === "ok" ? "bg-emerald-500" : isChecking ? "bg-amber-500" : "bg-rose-500"
              }`}
            />
          </span>
          <span className="font-medium text-foreground">
            {isChecking ? "Checking API..." : health?.status === "ok" ? "API Ready" : "API Offline"}
          </span>
          {health?.model && (
            <Badge variant="outline" className="h-4 text-[10px] uppercase font-mono">
              {health.model}
            </Badge>
          )}
          <RefreshCw className={`size-3 text-muted-foreground ${isChecking ? "animate-spin" : ""}`} />
        </button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="gap-2 pl-1.5 pr-2">
              <Avatar size="sm">
                <AvatarFallback>
                  {getInitials(user?.displayName, user?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {user?.displayName || user?.email || "Account"}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem render={<Link href="/settings" />}>
            <User />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <Settings />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

