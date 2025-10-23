import crypto from "crypto"

// Hash password using PBKDF2 (built-in Node.js crypto)
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex")
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err)
      resolve(`${salt}:${derivedKey.toString("hex")}`)
    })
  })
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":")
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err)
      resolve(key === derivedKey.toString("hex"))
    })
  })
}

// Generate JWT token
export function generateToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    }),
  ).toString("base64url")

  const signature = crypto
    .createHmac("sha256", process.env.JWT_SECRET || "your-secret-key-change-in-production")
    .update(`${header}.${payload}`)
    .digest("base64url")

  return `${header}.${payload}.${signature}`
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    const [header, payload, signature] = token.split(".")
    const expectedSignature = crypto
      .createHmac("sha256", process.env.JWT_SECRET || "your-secret-key-change-in-production")
      .update(`${header}.${payload}`)
      .digest("base64url")

    if (signature !== expectedSignature) {
      return null
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString())

    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return { userId: decoded.userId }
  } catch {
    return null
  }
}

// Verify authentication from request
export async function verifyAuth(request: Request): Promise<{ authenticated: boolean; userId?: string }> {
  try {
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader) {
      return { authenticated: false }
    }

    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [key, ...v] = c.split("=")
        return [key, v.join("=")]
      })
    )

    const token = cookies.auth_token
    if (!token) {
      return { authenticated: false }
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return { authenticated: false }
    }

    return { authenticated: true, userId: decoded.userId }
  } catch {
    return { authenticated: false }
  }
}
