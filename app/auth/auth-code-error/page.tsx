import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            There was an error confirming your account. The link may have expired or already been used.
          </p>
          <div className="space-y-3">
            <Link href="/signup">
              <Button className="w-full" variant="outline">
                Try signing up again
              </Button>
            </Link>
            <Link href="/login">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">Back to Login</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
