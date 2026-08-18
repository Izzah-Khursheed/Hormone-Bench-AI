import "server-only"
import { cookies } from "next/headers"

import { getAdminAuth } from "@/lib/firebase/admin"

const SESSION_COOKIE_NAME = "__session"
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14

export async function createSessionCookie(idToken: string) {
  const auth = getAdminAuth()
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function verifySession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) {
    return null
  }

  try {
    const auth = getAdminAuth()
    const decodedClaims = await auth.verifySessionCookie(
      sessionCookie,
      true
    )
    return decodedClaims
  } catch {
    return null
  }
}

export { SESSION_COOKIE_NAME }
