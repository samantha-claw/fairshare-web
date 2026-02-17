"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.auth.getSession()
      console.log("Session:", data)
      console.log("Error:", error)
    }

    testConnection()
  }, [])

  return (
    <main style={{ padding: 40 }}>
      <h1>FairShare</h1>
      <p>Supabase connection test</p>
    </main>
  )
}
