import React, { useEffect, useMemo, useState } from 'react'
import { Save, AlertCircle, Trash2, Lock, Globe, Bell, UserPlus, UserMinus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { projectService, teamService } from '../services/api'
import { usePermission } from '../hooks/usePermission'
import { AiConfirmDialog } from './AiFeedback'

const buildProjectSettings = (project = {}) => ({
  name: project.name || '',
  description: project.description || '',
  visibility: project.visibility || 'private',
  status: project.status || 'planning',
  priority: project.priority || 'medium',
  dueDate: project.dueDate ? String(project.dueDate).slice(0, 10) : '',
  budget: Number.isFinite(project.budget) ? String(project.budget) : '',
  spent: Number.isFinite(project.spent) ? String(project.spent) : '',
  notifications: true,
  allowComments: true,
  autoArchiveDone: false,
})

const toNormalizedToken = (value) => String(value || '').trim().toLowerCase()

const getMemberTokens = (member = {}) => {
  const tokens = [
    member.id,
    member.userId,
    member.authUserId,
    member.memberId,
    member.email,
  ]

  return tokens
    .map(toNormalizedToken)
    .filter(Boolean)
}

export const ProjectSettings = ({ project = {}, onProjectUpdated, onProjectDeleted }) => {
  const navigate = useNavigate()
  const { can } = usePermission()
  const canEditProject = can('EDIT_PROJECT')
  const canDeleteProject = can('DELETE_PROJECT')
  const canManageMembers = can('MANAGE_PROJECT_MEMBERS')
  const [settings, setSettings] = useState(buildProjectSettings(project))
  const [initialSettings, setInitialSettings] = useState(buildProjectSettings(project))

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [memberActionLoading, setMemberActionLoading] = useState(false)
  const [deletingProject, setDeletingProject] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [memberError, setMemberError] = useState('')
  const [memberSuccess, setMemberSuccess] = useState('')

  useEffect(() => {
    const nextSettings = buildProjectSettings(project)
    setSettings(nextSettings)
    setInitialSettings(nextSettings)
  }, [project])

  useEffect(() => {
    const loadMembers = async () => {
      if (!canManageMembers) return

      try {
        setMembersLoading(true)
        setMemberError('')
        const response = await teamService.getMembers({})
        const allMembers = Array.isArray(response?.data) ? response.data : []
        const activeMembers = allMembers.filter((member) => member.status === 'active' || member.status === 'joined')
        setMembers(activeMembers)
      } catch (loadError) {
        setMemberError(loadError?.message || 'Failed to load team members')
      } finally {
        setMembersLoading(false)
      }
    }

    loadMembers()
  }, [canManageMembers])

  const hasChanges = useMemo(() => {
    return (
      settings.name !== initialSettings.name ||
      settings.description !== initialSettings.description ||
      settings.visibility !== initialSettings.visibility ||
      settings.status !== initialSettings.status ||
      settings.priority !== initialSettings.priority ||
      settings.dueDate !== initialSettings.dueDate ||
      settings.budget !== initialSettings.budget ||
      settings.spent !== initialSettings.spent ||
      settings.notifications !== initialSettings.notifications ||
      settings.allowComments !== initialSettings.allowComments ||
      settings.autoArchiveDone !== initialSettings.autoArchiveDone
    )
  }, [initialSettings, settings])

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
    setSaved(false)
    setError('')
  }

  const handleSave = async () => {
    if (!canEditProject) {
      setError('You do not have permission to edit this project.')
      return
    }

    if (!project?.id) {
      setError('Missing project id.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const normalizedName = String(settings.name || '').trim()
      const normalizedDescription = String(settings.description || '').trim()

      if (normalizedName.length < 2) {
        setError('Project name must be at least 2 characters.')
        setSaving(false)
        return
      }

      const payload = {
        name: normalizedName,
        visibility: settings.visibility,
        status: settings.status,
        priority: settings.priority,
        ...(normalizedDescription.length >= 3 ? { description: normalizedDescription } : {}),
        ...(settings.dueDate ? { dueDate: settings.dueDate } : {}),
        ...(settings.budget !== '' ? { budget: Number(settings.budget) } : {}),
        ...(settings.spent !== '' ? { spent: Number(settings.spent) } : {}),
      }

      const response = await projectService.update(project.id, payload)
      const updatedProject = response?.data || { ...project, ...payload }
      onProjectUpdated?.(updatedProject)
      setInitialSettings(settings)

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (saveError) {
      setError(saveError?.message || 'Failed to update project settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(initialSettings)
    setError('')
  }

  const projectMemberTokenSet = useMemo(() => {
    const projectTokens = [
      ...(Array.isArray(project.memberIds) ? project.memberIds : []),
      ...(Array.isArray(project.memberEmails) ? project.memberEmails : []),
    ]

    return new Set(projectTokens.map(toNormalizedToken).filter(Boolean))
  }, [project.memberEmails, project.memberIds])

  const isMemberInProject = (member) => {
    const memberTokens = getMemberTokens(member)
    return memberTokens.some((token) => projectMemberTokenSet.has(token))
  }

  const projectMembers = members.filter((member) => isMemberInProject(member))
  const availableMembers = members.filter((member) => !isMemberInProject(member))

  const handleAddMember = async () => {
    if (!canManageMembers) {
      setMemberError('You do not have permission to manage project members.')
      return
    }

    if (!project?.id || !selectedMemberId) {
      setMemberError('Select a team member to add.')
      return
    }

    try {
      setMemberActionLoading(true)
      setMemberError('')
      setMemberSuccess('')
      const selectedMember = members.find((member) => member.id === selectedMemberId)
      const response = await projectService.addMember(project.id, {
        memberId: selectedMemberId,
        memberEmail: selectedMember?.email || '',
      })
      const updatedProject = response?.data || project
      onProjectUpdated?.(updatedProject)
      setSelectedMemberId('')
      setMemberSuccess('Member added to project.')
    } catch (actionError) {
      setMemberError(actionError?.message || 'Failed to add member')
    } finally {
      setMemberActionLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!canDeleteProject) {
      setError('You do not have permission to delete this project.')
      return
    }

    if (!project?.id) {
      setError('Missing project id.')
      return
    }

    setShowDeleteConfirm(true)
  }

  const confirmDeleteProject = async () => {
    if (!project?.id) {
      setError('Missing project id.')
      setShowDeleteConfirm(false)
      return
    }

    try {
      setDeletingProject(true)
      setError('')
      await projectService.delete(project.id)
      onProjectDeleted?.(project.id)
      setShowDeleteConfirm(false)

      if (!onProjectDeleted) {
        navigate('/projects')
      }
    } catch (deleteError) {
      setError(deleteError?.message || 'Failed to delete project')
    } finally {
      setDeletingProject(false)
    }
  }

  const handleRemoveMember = async (memberId, memberEmail = '') => {
    if (!canManageMembers || !project?.id || !memberId) return

    try {
      setMemberActionLoading(true)
      setMemberError('')
      setMemberSuccess('')
      const response = await projectService.removeMember(project.id, memberId, memberEmail)
      const updatedProject = response?.data || project
      onProjectUpdated?.(updatedProject)
      setMemberSuccess('Member removed from project.')
    } catch (actionError) {
      setMemberError(actionError?.message || 'Failed to remove member')
    } finally {
      setMemberActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <AiConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete project"
        message={`Delete "${project.name || 'this project'}" permanently? This action cannot be undone.`}
        confirmText="Delete"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteProject}
        busy={deletingProject}
      />

      {/* Save Notification */}
      {saved && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <div className="h-3 w-3 bg-green-500 rounded-full" />
          <p className="text-sm text-green-700 dark:text-green-400">Changes saved successfully</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {error}
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
            value={settings.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!canEditProject}
          />
          {!canEditProject && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You have read-only access.</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            rows={3}
            value={settings.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!canEditProject}
          />
          {!canEditProject && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You have read-only access.</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={settings.status}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={!canEditProject}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
            <select
              value={settings.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              disabled={!canEditProject}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
            <input
              type="date"
              value={settings.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              disabled={!canEditProject}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget</label>
            <input
              type="number"
              min="0"
              step="1"
              value={settings.budget}
              onChange={(e) => handleChange('budget', e.target.value)}
              disabled={!canEditProject}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Spent</label>
            <input
              type="number"
              min="0"
              step="1"
              value={settings.spent}
              onChange={(e) => handleChange('spent', e.target.value)}
              disabled={!canEditProject}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
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
              disabled={!canEditProject}
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
              disabled={!canEditProject}
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

      {/* Project Members */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Members</h3>

        {canManageMembers ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                disabled={membersLoading || memberActionLoading || availableMembers.length === 0}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select member to add</option>
                {availableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddMember}
                disabled={!selectedMemberId || memberActionLoading || membersLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <UserPlus className="h-4 w-4" />
                Add Member
              </button>
            </div>

            {membersLoading && (
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading team members...</p>
            )}

            {projectMembers.length > 0 ? (
              <div className="space-y-2">
                {projectMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{member.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id, member.email || '')}
                      disabled={memberActionLoading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60"
                    >
                      <UserMinus className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No members assigned to this project.</p>
            )}

            {memberError && <p className="text-sm text-red-600 dark:text-red-400">{memberError}</p>}
            {memberSuccess && <p className="text-sm text-green-600 dark:text-green-400">{memberSuccess}</p>}
          </>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You do not have permission to manage project members.
          </p>
        )}
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
              <button
                onClick={handleDeleteProject}
                disabled={!canDeleteProject || deletingProject}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                {deletingProject ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={!canEditProject || saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
