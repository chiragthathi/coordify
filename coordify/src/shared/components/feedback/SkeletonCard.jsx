import React from 'react'

export const SkeletonCard = ({ className = 'h-24' }) => {
  return <div className={`rounded-xl bg-gray-200 dark:bg-gray-700 ${className}`} />
}
