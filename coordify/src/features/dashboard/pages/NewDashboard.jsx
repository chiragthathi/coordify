import React from 'react'
import { Dashboard } from '../../../pages/Dashboard'

export const NewDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20 p-4">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          New Dashboard experience is enabled via feature flag.
        </p>
      </div>
      <Dashboard />
    </div>
  )
}
