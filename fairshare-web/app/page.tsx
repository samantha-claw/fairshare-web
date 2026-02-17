"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [status, setStatus] = useState("Checking connection...")

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setStatus("Error connecting to Supabase ❌")
      } else {
        setStatus("Supabase connected successfully ✅")
      }
    }

    testConnection()
  }, [])

  return (
    <main style={{ padding: 40 }}>
      <h1>FairShare</h1>
      <p>{status}</p>
    </main>
  )
}
