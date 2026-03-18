import React from 'react'

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {Icon && <Icon className="h-16 w-16 text-gray-400 mb-4" />}
      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

export const PageHeader = ({ title, description, action }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

export const StatCard = ({ label, value, icon: Icon, trend, trendValue }) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {trend && (
            <p className={`text-sm font-medium mt-2 ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>
    </div>
  )
}

export const AvatarGroup = ({ avatars, max = 3 }) => {
  const displayed = avatars.slice(0, max)
  const remaining = Math.max(0, avatars.length - max)

  return (
    <div className="flex items-center -space-x-2">
      {displayed.map((avatar, idx) => (
        <img
          key={idx}
          src={avatar}
          alt="avatar"
          className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
          title={`User ${idx + 1}`}
        />
      ))}
      {remaining > 0 && (
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800 text-sm font-medium">
          +{remaining}
        </div>
      )}
    </div>
  )
}
