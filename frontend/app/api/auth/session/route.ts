import { NextResponse } from "next/server"

import {
  createSessionCookie,
  clearSessionCookie,
  verifySession,
} from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { idToken } = body

    if (typeof idToken !== "string" || !idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 })
    }

    await createSessionCookie(idToken)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Firebase Session Cookie error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to create session cookie" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await verifySession()

    if (!session) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    await clearSessionCookie()
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Firebase Session Delete error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to clear session" },
      { status: 500 }
    )
  }
}
