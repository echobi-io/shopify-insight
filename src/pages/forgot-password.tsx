import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { resetPassword, initializing } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await resetPassword(email)
      setEmailSent(true)
    } catch (error) {
      console.error('Reset password error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">ShopifyIQ</h1>
          </Link>
        </div>
      </header>

      {/* Reset Password Form */}
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">
              Reset Password
            </CardTitle>
            <CardDescription>
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">Check your email!</p>
                  <p className="text-green-600 text-sm mt-1">
                    We've sent you a password reset link.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false)
                    setEmail('')
                  }}
                  className="w-full"
                >
                  Try a different email
                </Button>
                <div className="text-center">
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 text-sm">
                    Back to sign in
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading || !email}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>

                <div className="text-center">
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 text-sm">
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}