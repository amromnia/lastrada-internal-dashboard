import { redirect } from "next/navigation"

export default async function Home() {
  // Redirect to dashboard - authentication is handled by middleware
  redirect("/dashboard")
}
