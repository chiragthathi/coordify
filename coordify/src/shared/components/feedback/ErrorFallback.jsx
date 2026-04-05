import React from 'react'

export const ErrorFallback = ({ onRetry }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-6 text-center space-y-4">
        <h1 className="text-xl font-semibold text-red-800 dark:text-red-300">Something went wrong</h1>
        <p className="text-sm text-red-700 dark:text-red-400">
          The app hit an unexpected error. Please retry.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
