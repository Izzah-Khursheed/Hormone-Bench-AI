import "server-only"
import { getApps, initializeApp, cert, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined
  let sanitized = key.trim()

  // Remove surrounding double or single quotes if added in Vercel UI
  if (
    (sanitized.startsWith('"') && sanitized.endsWith('"')) ||
    (sanitized.startsWith("'") && sanitized.endsWith("'"))
  ) {
    sanitized = sanitized.slice(1, -1)
  }

  // Handle Base64 encoded private keys (if user base64 encoded it for Vercel)
  if (!sanitized.includes("-----BEGIN PRIVATE KEY-----") && !sanitized.includes("\\n")) {
    try {
      const decoded = Buffer.from(sanitized, "base64").toString("utf8")
      if (decoded.includes("-----BEGIN PRIVATE KEY-----")) {
        sanitized = decoded
      }
    } catch {
      // Continue with original sanitized string
    }
  }

  // Replace literal \n string with actual newlines
  return sanitized.replace(/\\n/g, "\n")
}

export function getAdminApp(): App {
  if (getApps().length) {
    return getApps()[0]!
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY)

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Firebase Admin environment variables missing: projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`
    )
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
}

export function getAdminAuth(): Auth {
  const app = getAdminApp()
  return getAuth(app)
}
