"use client"

import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

export { useToast }
