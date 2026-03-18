import React, { useState, useMemo } from 'react'
import { Plus, Users, Mail, Shield, Trash2, Edit2, MoreVertical } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { MOCK_USERS, getProjectsForUser, MOCK_PROJECTS } from '../data'

const roleColors = {
  admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700',
  manager: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
  member: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700',
  viewer: 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-600',
}

const statusColors = {
  active: 'text-green-600 dark:text-green-400',
  away: 'text-yellow-600 dark:text-yellow-400',
  offline: 'text-gray-600 dark:text-gray-400',
}

// Member Card Component
const MemberCard = ({ member, isAdmin, isCurrentUser }) => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition">
      {/* Card Header with Actions */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Avatar */}
          <div className="relative">
            <img
              src={member.avatar}
              alt={member.name}
              className="h-12 w-12 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
            />
            {/* Status Indicator */}
            {member.status === 'active' && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {member.name}
              </h3>
              {isCurrentUser && (
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                  You
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {member.title}
            </p>
          </div>
        </div>

        {/* Admin-Only Menu */}
        {isAdmin && !isCurrentUser && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 rounded-t-lg">
                  <Edit2 className="h-4 w-4" />
                  Edit Role
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
                  <Trash2 className="h-4 w-4" />
                  Remove Member
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Details */}
      <div className="space-y-3 mb-4">
        {/* Email */}
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <a
            href={`mailto:${member.email}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
          >
            {member.email}
          </a>
        </div>

        {/* Department */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Department:</span> {member.department}
        </div>

        {/* Joined Date */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Joined:</span>{' '}
          {new Date(member.joinedDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Bio */}
      {member.bio && (
        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-4 line-clamp-2">
          "{member.bio}"
        </p>
      )}

      {/* Role Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
            roleColors[member.role] || roleColors.member
          }`}
        >
          <Shield className="h-3 w-3" />
          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
        </span>

        {/* Status Badge */}
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 ${
            statusColors[member.status] || statusColors.offline
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
        </span>
      </div>
    </div>
  )
}

export const Team = () => {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'table'

  // Check if current user is admin
  const isAdmin = user?.role === 'admin'

  // For MEMBER: get team members only from their projects
  // For MANAGER/ADMIN: get all users
  const team = useMemo(() => {
    if (user?.role === 'member') {
      // Get all projects the member is working on
      const memberProjects = getProjectsForUser(user?.id)
      // Extract all unique member IDs from those projects
      const memberIds = new Set()
      memberProjects.forEach(project => {
        project.memberIds?.forEach(id => memberIds.add(id))
      })
      // Filter MOCK_USERS to only include members from those projects
      return MOCK_USERS.filter(u => memberIds.has(u.id))
    }
    // MANAGER/ADMIN see all users
    return MOCK_USERS
  }, [user?.id, user?.role])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your team members and their roles
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              <Plus className="h-4 w-4" />
              Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Admin-Only Settings Banner */}
      {isAdmin && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">Admin Controls</h3>
            <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
              As an admin, you have full access to manage team members, roles, and permissions.
            </p>
          </div>
        </div>
      )}

      {/* View Mode Selector */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setViewMode('cards')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            viewMode === 'cards'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="h-4 w-4 inline-block mr-2" />
          Card View
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            viewMode === 'table'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          List View
        </button>
      </div>

      {/* Team Members Display */}
      {team.length > 0 ? (
        <>
          {viewMode === 'cards' ? (
            // Card View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isAdmin={isAdmin}
                  isCurrentUser={member.id === user?.id}
                />
              ))}
            </div>
          ) : (
            // Table View
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                      {isAdmin && (
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((member, idx) => (
                      <tr
                        key={member.id}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                          idx === team.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-10 w-10 rounded-full"
                            />
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {member.name}
                              </span>
                              {member.id === user?.id && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">You</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`mailto:${member.email}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {member.email}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              roleColors[member.role] || roleColors.member
                            }`}
                          >
                            <Shield className="h-3 w-3" />
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {member.department}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-sm font-medium ${
                              statusColors[member.status] || statusColors.offline
                            }`}
                          >
                            <span className="h-2 w-2 rounded-full bg-current" />
                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            {member.id !== user?.id && (
                              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm">
                                Manage
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">No team members</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
            Invite team members to collaborate on projects
          </p>
        </div>
      )}

      {/* Team Stats */}
      {team.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{team.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Members</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {team.filter(m => m.status === 'active').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {team.filter(m => m.role === 'admin').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Admins</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {team.filter(m => m.role === 'manager').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Managers</p>
          </div>
        </div>
      )}
    </div>
  )
}
