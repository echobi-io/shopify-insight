import React, { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect directly to dashboard
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}