// This file is kept minimal to avoid bundling issues

export function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split(".")
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString())
    return decoded.exp < Math.floor(Date.now() / 1000)
  } catch {
    return true
  }
}

export function getTokenUserId(token: string): string | null {
  try {
    const [, payload] = token.split(".")
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString())
    return decoded.userId || null
  } catch {
    return null
  }
}
