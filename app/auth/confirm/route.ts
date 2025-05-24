import type { EmailOtpType } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const redirectTo = searchParams.get("redirectTo")

  if (token_hash && type) {
    const supabase = createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Redirect to the intended destination or home
      const destination = redirectTo && redirectTo !== "/" ? redirectTo : "/"
      redirect(destination)
    }
  }

  // redirect the user to an error page with some instructions
  redirect("/auth/auth-code-error")
}
