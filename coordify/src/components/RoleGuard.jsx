import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export const RoleGuard = ({ roles = [], children }) => {
  const { user } = useAuth()

  if (!user || (roles.length > 0 && !roles.includes(user.role))) {
    return null
  }

  return children
}
