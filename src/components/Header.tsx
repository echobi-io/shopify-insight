import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

const Header: React.FC = () => {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-end">
        {user && (
          <div className="flex items-center space-x-6">
            <span className="text-sm font-light text-gray-600">{user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="font-light"
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header