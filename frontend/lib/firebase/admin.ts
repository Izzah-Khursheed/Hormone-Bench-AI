import "server-only"
import { getApps, initializeApp, cert, type App } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined
  let sanitized = key.trim()
  // Remove surrounding quotes if user added quotes in Vercel UI
  if (
    (sanitized.startsWith('"') && sanitized.endsWith('"')) ||
    (sanitized.startsWith("'") && sanitized.endsWith("'"))
  ) {
    sanitized = sanitized.slice(1, -1)
  }
  // Replace escaped \n strings with real line breaks
  return sanitized.replace(/\\n/g, "\n")
}

function createAdminApp(): App {
  if (getApps().length) {
    return getApps()[0]!
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY)

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin environment variables missing or incomplete.")
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
}

export const firebaseAdminApp = createAdminApp()
export const firebaseAdminAuth = getAuth(firebaseAdminApp)
