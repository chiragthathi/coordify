import React, { useState } from 'react'
import { Settings as SettingsIcon, Save, Users, Lock, Bell as BellIcon } from 'lucide-react'
import { PageHeader } from '../components/Common'
import { useAuth } from '../contexts/AuthContext'

export const Settings = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState({
    profileName: user?.name || '',
    profileEmail: user?.email || '',
    notificationsEmail: true,
    notificationsInApp: true,
    notificationsTaskAssigned: true,
    notificationsProjectUpdate: true,
    privacyPublicProfile: false,
    privacyShowActivity: true,
  })

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    // Mock save
    console.log('Settings saved:', settings)
    alert('Settings saved successfully!')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'team', label: 'Team', icon: Users },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <div className="card">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Profile Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={settings.profileName}
                        onChange={e => handleChange('profileName', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={settings.profileEmail}
                        onChange={e => handleChange('profileEmail', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notificationsEmail}
                        onChange={e => handleChange('notificationsEmail', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Email Notifications
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notificationsInApp}
                        onChange={e => handleChange('notificationsInApp', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        In-App Notifications
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notificationsTaskAssigned}
                        onChange={e => handleChange('notificationsTaskAssigned', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Task Assignments
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notificationsProjectUpdate}
                        onChange={e =>
                          handleChange('notificationsProjectUpdate', e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Project Updates
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Privacy Settings
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacyPublicProfile}
                        onChange={e => handleChange('privacyPublicProfile', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Make profile public
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacyShowActivity}
                        onChange={e => handleChange('privacyShowActivity', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Show activity to team
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Team Management
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Team settings can be managed from the Team page.
                  </p>
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
