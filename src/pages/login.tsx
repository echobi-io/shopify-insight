import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BarChart3, Mail, Lock, ArrowLeft } from 'lucide-react'
import GoogleButton from '@/components/GoogleButton'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signInWithMagicLink, initializing } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic'>('password')

  const handleAdminLogin = async () => {
    setLoading(true)
    try {
      // Set a simple flag for dev admin mode
      localStorage.setItem('dev-admin-mode', 'true')
      localStorage.setItem('dev-admin-merchant-id', '11111111-1111-1111-1111-111111111111')
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Admin login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await signInWithMagicLink(email)
      setMagicLinkSent(true)
    } catch (error) {
      console.error('Magic link error:', error)
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

      {/* Login Form */}
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">
              Welcome Back
            </CardTitle>
            <CardDescription>
              Sign in to access your ShopifyIQ dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {magicLinkSent ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">Check your email!</p>
                  <p className="text-green-600 text-sm mt-1">
                    We've sent you a magic link to sign in.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMagicLinkSent(false)
                    setEmail('')
                  }}
                  className="w-full"
                >
                  Try a different email
                </Button>
              </div>
            ) : (
              <>
                {/* Google Sign In */}
                <GoogleButton />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                {/* Login Method Toggle */}
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={loginMethod === 'password' ? 'default' : 'outline'}
                    onClick={() => setLoginMethod('password')}
                    className="flex-1"
                    size="sm"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Password
                  </Button>
                  <Button
                    type="button"
                    variant={loginMethod === 'magic' ? 'default' : 'outline'}
                    onClick={() => setLoginMethod('magic')}
                    className="flex-1"
                    size="sm"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Magic Link
                  </Button>
                </div>

                {/* Password Login Form */}
                {loginMethod === 'password' && (
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loading || !email || !password}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                )}

                {/* Magic Link Form */}
                {loginMethod === 'magic' && (
                  <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magic-email">Email</Label>
                      <Input
                        id="magic-email"
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
                      {loading ? 'Sending...' : 'Send Magic Link'}
                    </Button>
                  </form>
                )}

                {/* Development Admin Login */}
                {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_CO_DEV_ENV) && (
                  <div className="border-t pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAdminLogin}
                      className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
                      disabled={loading}
                    >
                      🔧 Dev Admin Login (Bypass Auth)
                    </Button>
                    <p className="text-xs text-orange-600 text-center mt-1">
                      Development only - bypasses authentication
                    </p>
                  </div>
                )}

                {/* Additional Links */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-slate-600">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                      Sign up
                    </Link>
                  </p>
                  <p className="text-sm">
                    <Link href="/forgot-password" className="text-slate-500 hover:text-slate-700">
                      Forgot your password?
                    </Link>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}