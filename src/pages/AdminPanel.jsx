/**
 * AdminPanel.jsx
 * Example admin-only page demonstrating role-based access control
 * Only accessible to users with ADMIN role
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Settings,
  BarChart3,
  AlertCircle,
  Plus,
  Trash2,
  Shield,
  Lock,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { useAsync } from '../hooks/useAsync'
import { teamService, reportService } from '../services/api'
import { Can } from '../components/Can'
import { MOCK_USERS } from '../data'

export const AdminPanel = () => {
  const { user } = useAuth()
  const { can } = usePermission()
  const navigate = useNavigate()
  const [notification, setNotification] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')

  // Async operations
  const inviteMemberAsync = useAsync(teamService.inviteMember)
  const removeMemberAsync = useAsync(teamService.removeMember)
  const generateReportAsync = useAsync(reportService.generateTeamReport)

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  // Handle invite member
  const handleInviteMember = async (e) => {
    e.preventDefault()

    if (!inviteEmail.trim()) {
      showNotification('error', 'Please enter an email address')
      return
    }

    const result = await inviteMemberAsync.execute(inviteEmail, inviteRole)
    if (result.success) {
      setInviteEmail('')
      setInviteRole('member')
      showNotification('success', result.message)
      inviteMemberAsync.reset()
    } else {
      showNotification('error', result.message || 'Failed to send invitation')
    }
  }

  // Handle remove member
  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?'))
      return

    const result = await removeMemberAsync.execute(userId)
    if (result.success) {
      showNotification('success', 'Member removed successfully')
      removeMemberAsync.reset()
    }
  }

  // Handle generate report
  const handleGenerateReport = async () => {
    const result = await generateReportAsync.execute()
    if (result.success) {
      showNotification(
        'success',
        'Report generated successfully! Check your downloads.'
      )
      generateReportAsync.reset()
    }
  }

  return (
    <div className="space-y-8">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {notification.type === 'success' ? '✓' : '✗'} {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administrative controls and system management
          </p>
        </div>
      </div>

      {/* Admin Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Admin Access Active
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              You are logged in as <strong>{user?.name}</strong> with role{' '}
              <strong>{user?.role?.toUpperCase()}</strong>. You have access to all
              administrative functions.
            </p>
          </div>
        </div>
      </div>

      {/* Team Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invite Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invite Team Member
          </h2>

          <form onSubmit={handleInviteMember} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="newmember@example.com"
                disabled={inviteMemberAsync.loading}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={inviteMemberAsync.loading}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={inviteMemberAsync.loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {inviteMemberAsync.loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>

          {inviteMemberAsync.error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {inviteMemberAsync.error}
              </p>
            </div>
          )}
        </div>

        {/* Reports Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reports & Analytics
          </h2>

          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate comprehensive reports on team performance, project metrics,
              and system usage.
            </p>

            <button
              onClick={handleGenerateReport}
              disabled={generateReportAsync.loading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {generateReportAsync.loading
                ? 'Generating Report...'
                : 'Generate Team Report'}
            </button>

            <Can permission="MANAGE_SETTINGS">
              <button className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium">
                System Settings
              </button>
            </Can>
          </div>

          {generateReportAsync.error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {generateReportAsync.error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Team Members ({MOCK_USERS.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Email
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Role
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="text-gray-900 dark:text-white font-medium">
                      {member.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {member.email}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      member.role === 'admin'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : member.role === 'manager'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : member.role === 'member'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                    }`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {member.id !== user?.id && member.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removeMemberAsync.loading}
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition disabled:opacity-50"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 flex items-start gap-4">
        <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            Security Reminder
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            This is a demo admin panel with mock data. In production, ensure all
            user management operations are properly authenticated, audited, and
            comply with your security policies.
          </p>
        </div>
      </div>
    </div>
  )
}
