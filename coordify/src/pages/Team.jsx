import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Users, Mail, Shield, Trash2, Edit2, MoreVertical } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { teamService } from '../services/api'
import { useProjects } from '../features/projects/hooks/useProjects'
import { AiConfirmDialog, AiMessageToast } from '../components/AiFeedback'

const normalizeIdentityToken = (value) => String(value || '').trim().toLowerCase()

const getMemberIdentityTokens = (member = {}) => {
  return [member.id, member.userId, member.authUserId, member.memberId, member.email]
    .map(normalizeIdentityToken)
    .filter(Boolean)
}

const getProjectMembershipTokens = (project = {}) => {
  return [
    ...(Array.isArray(project.memberIds) ? project.memberIds : []),
    ...(Array.isArray(project.memberEmails) ? project.memberEmails : []),
    project.owner,
  ]
    .map(normalizeIdentityToken)
    .filter(Boolean)
}

const getUserIdentityTokens = (user = {}) => {
  return [user.id, user.userId, user.authUserId, user.memberId, user.email]
    .map(normalizeIdentityToken)
    .filter(Boolean)
}

const roleColors = {
  admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700',
  manager: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
  member: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700',
  viewer: 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-600',
}

const statusColors = {
  active: 'text-green-600 dark:text-green-400',
  invited: 'text-yellow-600 dark:text-yellow-400',
  requested: 'text-yellow-600 dark:text-yellow-400',
  away: 'text-yellow-600 dark:text-yellow-400',
  offline: 'text-gray-600 dark:text-gray-400',
}

const getMemberStatusLabel = (status) => {
  if (status === 'active') return 'Joined'
  if (status === 'requested' || status === 'invited') return 'Requested'
  if (!status) return 'Offline'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const MemberCard = ({ member, canManageMembers, isCurrentUser, onEditRole, onRemoveMember, isProcessing }) => {
  const [showMenu, setShowMenu] = useState(false)
  const avatar = member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email || member.name || member.id}`

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <img src={avatar} alt={member.name} className="h-12 w-12 rounded-full ring-2 ring-gray-200 dark:ring-gray-700" />
            {member.status === 'active' && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{member.name}</h3>
              {isCurrentUser && (
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                  You
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{member.role}</p>
          </div>
        </div>

        {canManageMembers && !isCurrentUser && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onEditRole(member)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 rounded-t-lg"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Role
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onRemoveMember(member)
                  }}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg border-t border-gray-200 dark:border-gray-600 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Member
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <a href={`mailto:${member.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">
            {member.email}
          </a>
        </div>

        {(member.createdAt || member.invitedAt) && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{member.status === 'active' ? 'Joined' : 'Requested'}:</span>{' '}
            {new Date((member.status === 'active' ? member.createdAt : member.invitedAt) || member.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
            roleColors[member.role] || roleColors.member
          }`}
        >
          <Shield className="h-3 w-3" />
          {(member.role || 'member').charAt(0).toUpperCase() + (member.role || 'member').slice(1)}
        </span>

        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 ${
            statusColors[member.status] || statusColors.offline
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {getMemberStatusLabel(member.status)}
        </span>
      </div>
    </div>
  )
}

export const Team = () => {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState('cards')
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState(null)
  const [processingUserId, setProcessingUserId] = useState(null)
  const [roleEditorMember, setRoleEditorMember] = useState(null)
  const [pendingRole, setPendingRole] = useState('member')
  const [removeMemberCandidate, setRemoveMemberCandidate] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [acceptingInvite, setAcceptingInvite] = useState(false)
  const { data: projectsData } = useProjects({ page: 1, limit: 300 })

  const projects = useMemo(() => {
    if (Array.isArray(projectsData)) return projectsData
    if (Array.isArray(projectsData?.items)) return projectsData.items
    if (Array.isArray(projectsData?.projects)) return projectsData.projects
    return []
  }, [projectsData])

  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager'
  const canInviteMembers = user?.role === 'admin' || user?.role === 'manager'
  const canManageMembers = isAdmin || isManager

  const loadTeam = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await teamService.getMembers({})
      setTeam(Array.isArray(response?.data) ? response.data : [])
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [])

  const handleInviteMember = async () => {
    const email = inviteEmail.trim()
    if (!email) {
      setActionMessage({ type: 'error', text: 'Enter an email address to invite.' })
      return
    }

    try {
      await teamService.inviteMember(email, inviteRole)
      setActionMessage({ type: 'success', text: `Invite sent to ${email}.` })
      setInviteEmail('')
      await loadTeam()
    } catch (inviteError) {
      setActionMessage({ type: 'error', text: inviteError?.message || 'Failed to invite member' })
    }
  }

  const handleEditRole = async (member) => {
    setRoleEditorMember(member)
    setPendingRole(member.role || 'member')
  }

  const confirmRoleEdit = async () => {
    if (!roleEditorMember) return

    const normalizedRole = pendingRole.trim().toLowerCase()
    if (!['admin', 'manager', 'member', 'viewer'].includes(normalizedRole)) {
      setActionMessage({ type: 'error', text: 'Invalid role. Use admin, manager, member, or viewer.' })
      return
    }

    try {
      setProcessingUserId(roleEditorMember.id)
      await teamService.updateRole(roleEditorMember.id, normalizedRole)
      setActionMessage({ type: 'success', text: `${roleEditorMember.name} role updated to ${normalizedRole}.` })
      setRoleEditorMember(null)
      await loadTeam()
    } catch (roleError) {
      setActionMessage({ type: 'error', text: roleError?.message || 'Failed to update role' })
    } finally {
      setProcessingUserId(null)
    }
  }

  const handleRemoveMember = async (member) => {
    setRemoveMemberCandidate(member)
  }

  const confirmRemoveMember = async () => {
    if (!removeMemberCandidate) return

    try {
      setProcessingUserId(removeMemberCandidate.id)
      await teamService.removeMember(removeMemberCandidate.id)
      setActionMessage({ type: 'success', text: `${removeMemberCandidate.name} removed from team.` })
      setRemoveMemberCandidate(null)
      await loadTeam()
    } catch (removeError) {
      setActionMessage({ type: 'error', text: removeError?.message || 'Failed to remove member' })
    } finally {
      setProcessingUserId(null)
    }
  }

  const stats = useMemo(() => {
    const visibleTeam = ['member', 'viewer'].includes(user?.role)
      ? team.filter((member) => {
        const userTokens = new Set(getUserIdentityTokens(user))
        const sharedMemberTokens = new Set()

        if (userTokens.size === 0) {
          return false
        }

        projects.forEach((project) => {
          const projectTokens = getProjectMembershipTokens(project)
          const isMyProject = projectTokens.some((token) => userTokens.has(token))
          if (!isMyProject) return

          projectTokens.forEach((token) => sharedMemberTokens.add(token))
        })

        getUserIdentityTokens(user).forEach((token) => sharedMemberTokens.add(token))
        return getMemberIdentityTokens(member).some((token) => sharedMemberTokens.has(token))
      })
      : team

    return {
      total: visibleTeam.length,
      active: visibleTeam.filter((member) => member.status === 'active').length,
      admins: visibleTeam.filter((member) => member.role === 'admin').length,
      managers: visibleTeam.filter((member) => member.role === 'manager').length,
    }
  }, [projects, team, user?.id, user?.role])

  const visibleTeam = useMemo(() => {
    if (!['member', 'viewer'].includes(user?.role)) return team

    const userTokens = new Set(getUserIdentityTokens(user))
    const sharedMemberTokens = new Set()

    if (userTokens.size === 0) {
      return []
    }

    projects.forEach((project) => {
      const projectTokens = getProjectMembershipTokens(project)
      const isMyProject = projectTokens.some((token) => userTokens.has(token))
      if (!isMyProject) return

      projectTokens.forEach((token) => sharedMemberTokens.add(token))
    })

    getUserIdentityTokens(user).forEach((token) => sharedMemberTokens.add(token))
    return team.filter((member) => getMemberIdentityTokens(member).some((token) => sharedMemberTokens.has(token)))
  }, [projects, team, user?.id, user?.role])

  const pendingMyInvitation = useMemo(() => {
    const email = String(user?.email || '').toLowerCase()
    if (!email) return null

    return team.find((member) => {
      const memberEmail = String(member.email || '').toLowerCase()
      return memberEmail === email && (member.status === 'requested' || member.status === 'invited')
    }) || null
  }, [team, user?.email])

  const handleAcceptMyInvitation = async () => {
    if (!user?.email) return

    try {
      setAcceptingInvite(true)
      await teamService.acceptInvitationByEmail(user.email)
      setActionMessage({ type: 'success', text: 'Invitation accepted. You are now joined to the team.' })
      await loadTeam()
    } catch (acceptError) {
      setActionMessage({ type: 'error', text: acceptError?.message || 'Failed to accept invitation' })
    } finally {
      setAcceptingInvite(false)
    }
  }

  return (
    <div className="space-y-8">
      <AiMessageToast
        isOpen={Boolean(actionMessage)}
        tone={actionMessage?.type === 'success' ? 'success' : 'error'}
        message={actionMessage?.text}
        onClose={() => setActionMessage(null)}
      />

      <AiConfirmDialog
        isOpen={Boolean(roleEditorMember)}
        title="Update team role"
        message={roleEditorMember ? `Choose a new role for ${roleEditorMember.name}.` : ''}
        confirmText="Apply Role"
        onCancel={() => setRoleEditorMember(null)}
        onConfirm={confirmRoleEdit}
        busy={Boolean(roleEditorMember && processingUserId === roleEditorMember.id)}
        tone="info"
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
        <select
          value={pendingRole}
          onChange={(event) => setPendingRole(event.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </AiConfirmDialog>

      <AiConfirmDialog
        isOpen={Boolean(removeMemberCandidate)}
        title="Remove team member"
        message={removeMemberCandidate ? `Do you want to remove ${removeMemberCandidate.name} from this team?` : ''}
        confirmText="Remove"
        onCancel={() => setRemoveMemberCandidate(null)}
        onConfirm={confirmRemoveMember}
        busy={Boolean(removeMemberCandidate && processingUserId === removeMemberCandidate.id)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your team members and their roles</p>
        </div>

        <div className="flex items-center gap-2">
          {canInviteMembers && (
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="member@email.com"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                onClick={handleInviteMember}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
              <Plus className="h-4 w-4" />
              Invite Member
              </button>
            </div>
          )}
        </div>
      </div>

      {pendingMyInvitation && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-300">Team Invitation Pending</h3>
            <p className="text-sm text-amber-800 dark:text-amber-400 mt-1">
              You were invited as <span className="font-semibold capitalize">{pendingMyInvitation.role || 'member'}</span>.
            </p>
          </div>
          <button
            onClick={handleAcceptMyInvitation}
            disabled={acceptingInvite}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed transition font-medium"
          >
            {acceptingInvite ? 'Accepting...' : 'Accept Invitation'}
          </button>
        </div>
      )}

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

      {!isAdmin && canInviteMembers && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">Manager Controls</h3>
            <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
              As a manager, you can invite members by email.
            </p>
          </div>
        </div>
      )}

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

      {loading && <div className="text-center py-12 text-gray-600 dark:text-gray-400">Loading team members...</div>}
      {!loading && error && <div className="text-center py-12 text-red-600 dark:text-red-400">{error}</div>}

      {!loading && !error && (visibleTeam.length > 0 ? (
        <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleTeam.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  canManageMembers={canManageMembers}
                  isCurrentUser={member.id === user?.id}
                  onEditRole={handleEditRole}
                  onRemoveMember={handleRemoveMember}
                  isProcessing={processingUserId === member.id}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Member</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                      {canManageMembers && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTeam.map((member, idx) => (
                      <tr
                        key={member.id}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                          idx === visibleTeam.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email || member.name || member.id}`}
                              alt={member.name}
                              className="h-10 w-10 rounded-full"
                            />
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
                              {member.id === user?.id && <div className="text-xs text-blue-600 dark:text-blue-400">You</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a href={`mailto:${member.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
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
                            {(member.role || 'member').charAt(0).toUpperCase() + (member.role || 'member').slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-sm font-medium ${
                              statusColors[member.status] || statusColors.offline
                            }`}
                          >
                            <span className="h-2 w-2 rounded-full bg-current" />
                            {getMemberStatusLabel(member.status)}
                          </span>
                        </td>
                        {canManageMembers && (
                          <td className="px-6 py-4">
                            {member.id === user?.id ? (
                              <span className="text-xs text-gray-500 dark:text-gray-400">Current user</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditRole(member)}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded dark:bg-blue-900/30 dark:text-blue-300"
                                >
                                  Edit Role
                                </button>
                                <button
                                  onClick={() => handleRemoveMember(member)}
                                  disabled={processingUserId === member.id}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded dark:bg-red-900/30 dark:text-red-300 disabled:opacity-60"
                                >
                                  Remove
                                </button>
                              </div>
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
        </div>
      ))}

      {!loading && !error && visibleTeam.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Members</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.admins}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Admins</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.managers}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Managers</p>
          </div>
        </div>
      )}
    </div>
  )
}
