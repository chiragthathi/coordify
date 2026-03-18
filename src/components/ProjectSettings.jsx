import React, { useState } from 'react'
import { Save, AlertCircle, Trash2, Lock, Globe, Bell } from 'lucide-react'

export const ProjectSettings = ({ project = {} }) => {
  const [settings, setSettings] = useState({
    visibility: project.visibility || 'private',
    notifications: true,
    allowComments: true,
    autoArchiveDone: false,
  })

  const [saved, setSaved] = useState(false)

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Save Notification */}
      {saved && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <div className="h-3 w-3 bg-green-500 rounded-full" />
          <p className="text-sm text-green-700 dark:text-green-400">Changes saved successfully</p>
        </div>
      )}

      {/* General Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">General</h3>

        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project Name
          </label>
          <input
            type="text"
            defaultValue={project.name || ''}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">To edit this, go to project details</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            rows={3}
            defaultValue={project.description || ''}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">To edit this, go to project details</p>
        </div>
      </div>

      {/* Visibility Settings */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visibility</h3>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={settings.visibility === 'private'}
              onChange={(e) => handleChange('visibility', e.target.value)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Private
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Only team members can access</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={settings.visibility === 'public'}
              onChange={(e) => handleChange('visibility', e.target.value)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Public
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Anyone in the organization can view</p>
            </div>
          </label>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => handleChange('notifications', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Enable Project Notifications
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Notify me of project updates and task changes</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allowComments}
            onChange={(e) => handleChange('allowComments', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Comments</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Team members can comment on tasks</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoArchiveDone}
            onChange={(e) => handleChange('autoArchiveDone', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-Archive Completed Tasks</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Automatically move completed tasks to archive</p>
          </div>
        </label>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4 pt-6 border-t border-red-200 dark:border-red-900/30">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>

        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">Delete Project</p>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                This action cannot be undone. All project data will be permanently deleted.
              </p>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
                <Trash2 className="h-4 w-4" />
                Delete Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition font-medium">
          Cancel
        </button>
      </div>
    </div>
  )
}
