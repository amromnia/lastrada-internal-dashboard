"use server"

import { createServerSupabaseClient } from "./supabase-server"

export async function getDb() {
  return await createServerSupabaseClient()
}
