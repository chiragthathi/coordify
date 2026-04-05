import React from 'react'

export const OfflineBanner = ({ isOnline }) => {
  if (isOnline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-white text-sm font-medium px-4 py-2 text-center"
    >
      You are offline. Some features may be unavailable. We will retry when connection is restored.
    </div>
  )
}
