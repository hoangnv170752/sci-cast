"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

interface EnvStatus {
  supabase: boolean
  elevenlabs: boolean
  cerebras: boolean
}

export function EnvCheck() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)

  useEffect(() => {
    const checkEnv = () => {
      const status: EnvStatus = {
        supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        elevenlabs: false, // Can't check server-side env vars from client
        cerebras: false, // Can't check server-side env vars from client
      }
      setEnvStatus(status)
    }

    checkEnv()
  }, [])

  if (!envStatus) return null

  const allGood = envStatus.supabase
  const hasIssues = !allGood

  if (!hasIssues) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert variant={hasIssues ? "destructive" : "default"}>
        {hasIssues ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
        <AlertDescription>
          <div className="space-y-1">
            <div className="font-medium">Environment Configuration</div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                {envStatus.supabase ? "✅" : "❌"} Supabase
                {!envStatus.supabase && " (Check NEXT_PUBLIC_SUPABASE_* vars)"}
              </div>
              <div className="flex items-center gap-2">⚠️ ElevenLabs (Server-side - check .env.local)</div>
              <div className="flex items-center gap-2">⚠️ Cerebras (Server-side - check .env.local)</div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
