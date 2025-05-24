import { createServerClient } from "@supabase/ssr"

// Create a client that works regardless of environment (App Router or Pages Router)
export async function createClient() {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // In browser environment, use the client-side client
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            const cookies = document.cookie.split(';').map(c => c.trim())
            const cookie = cookies.find(c => c.startsWith(`${name}=`))
            return cookie ? cookie.split('=')[1] : undefined
          },
          set(name, value, options) {
            document.cookie = `${name}=${value}; path=${options?.path || '/'}`
          },
          remove(name, options) {
            document.cookie = `${name}=; path=${options?.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          },
        },
      }
    )
  }

  // In server environment, create a simple implementation that doesn't depend on next/headers
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: {
        get: (name: string) => '',
        set: (name: string, value: string) => {},
        remove: (name: string) => {}
      }
    }
  )
}
