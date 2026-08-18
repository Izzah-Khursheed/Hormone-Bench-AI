"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth"

import { firebaseAuth } from "@/lib/firebase/client"

type AuthContextValue = {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function syncSessionCookie(user: User | null) {
  if (!user) {
    await fetch("/api/auth/session", { method: "DELETE" })
    return
  }

  try {
    // Force refresh ID token to ensure a fresh, unexpired token for session cookie creation
    const idToken = await user.getIdToken(true)
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Session sync cookie HTTP error:", response.status, errorData)
      throw new Error(errorData.error || "Failed to establish a session cookie. Try signing in again.")
    }
  } catch (err: any) {
    console.error("syncSessionCookie error:", err)
    throw err
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    )
    await syncSessionCookie(credential.user)
  }, [])

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      )
      if (name) {
        await updateProfile(credential.user, { displayName: name })
      }
      await syncSessionCookie(credential.user)
    },
    []
  )

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(firebaseAuth, email, {
      url: `${window.location.origin}/login`,
      handleCodeInApp: true,
    })
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuth)
    await syncSessionCookie(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithEmail,
      signUpWithEmail,
      sendPasswordReset,
      signOut,
    }),
    [user, loading, signInWithEmail, signUpWithEmail, sendPasswordReset, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
