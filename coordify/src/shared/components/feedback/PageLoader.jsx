import React from 'react'
import { SkeletonCard } from './SkeletonCard'

export const PageLoader = () => (
  <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <SkeletonCard className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
      </div>
      <SkeletonCard className="h-10 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard className="h-60" />
        <SkeletonCard className="h-60" />
      </div>
    </div>
  </div>
)
