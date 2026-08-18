"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronDown, LogOut, Settings, User, RefreshCw } from "lucide-react"

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

  const checkHealth = React.useCallback(async () => {
    setIsChecking(true)
    try {
      const res = await healthApi.check()
      setHealth(res)
    } catch {
      setHealth(null)
    } finally {
      setIsChecking(false)
    }
  }, [])

  React.useEffect(() => {
    let isMounted = true
    setIsChecking(true)
    healthApi
      .check()
      .then((res) => {
        if (isMounted) setHealth(res)
      })
      .catch(() => {
        if (isMounted) setHealth(null)
      })
      .finally(() => {
        if (isMounted) setIsChecking(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-background/95 px-3 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />

        <div className="flex min-w-0 flex-col justify-center">
          <h1 className="truncate text-sm sm:text-base font-semibold text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Live API Health Status Button */}
        <button
          onClick={checkHealth}
          title="Click to refresh API status"
          className="flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-xs transition-all hover:bg-muted/80 hover:border-border active:scale-95"
        >
          <span className="relative flex size-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                health?.status === "ok" || health?.status === "healthy"
                  ? "bg-emerald-400"
                  : isChecking
                  ? "bg-amber-400"
                  : "bg-rose-400"
              }`}
            />
            <span
              className={`relative inline-flex size-2 rounded-full ${
                health?.status === "ok" || health?.status === "healthy"
                  ? "bg-emerald-500"
                  : isChecking
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
            />
          </span>
          <span className="hidden xs:inline font-medium text-[11px] text-foreground">
            {isChecking ? "Pinging..." : health?.status === "ok" || health?.status === "healthy" ? "API Live" : "API Offline"}
          </span>
          {health?.model && (
            <Badge variant="outline" className="hidden sm:inline-flex h-4 text-[9px] uppercase font-mono bg-background">
              {health.model}
            </Badge>
          )}
          <RefreshCw className={`size-3 text-muted-foreground ${isChecking ? "animate-spin" : ""}`} />
        </button>

        {/* Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="gap-2 pl-1 pr-1.5 sm:px-2">
                <Avatar size="sm" className="size-7">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {getInitials(user?.displayName, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-xs font-medium sm:inline max-w-[100px] truncate">
                  {user?.displayName || user?.email || "Account"}
                </span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem render={<Link href="/settings" />}>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
