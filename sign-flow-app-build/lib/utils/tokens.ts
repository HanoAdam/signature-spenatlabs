import { randomBytes } from "crypto"

export function generateSigningToken(): string {
  return randomBytes(32).toString("hex")
}

export function getTokenExpiryDate(days = 7): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}
