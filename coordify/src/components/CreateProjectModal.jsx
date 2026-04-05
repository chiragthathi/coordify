import React, { useEffect, useMemo, useState } from 'react'
import { X, Plus } from 'lucide-react'
import { teamService } from '../services/api'

export const CreateProjectModal = ({ isOpen, onClose, onCreateProject }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Product',
    priority: 'medium',
    visibility: 'private',
    dueDate: '',
    budget: '',
    memberIds: [],
  })
  const [loading, setLoading] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])
  const [selectedMemberId, setSelectedMemberId] = useState('')

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setMembersLoading(true)
        const response = await teamService.getMembers({})
        const members = Array.isArray(response?.data) ? response.data : []
        const activeMembers = members.filter((member) => member.status === 'active' || member.status === 'joined')
        setTeamMembers(activeMembers)
      } catch {
        setTeamMembers([])
      } finally {
        setMembersLoading(false)
      }
    }

    if (isOpen) {
      loadMembers()
    }
  }, [isOpen])

  const selectedMemberIds = useMemo(() => {
    return Array.isArray(formData.memberIds) ? formData.memberIds : []
  }, [formData.memberIds])

  const availableTeamMembers = useMemo(() => {
    return teamMembers.filter((member) => !selectedMemberIds.includes(member.id))
  }, [selectedMemberIds, teamMembers])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        ...(formData.dueDate ? { dueDate: formData.dueDate } : {}),
        ...(formData.budget !== '' ? { budget: Number(formData.budget) } : {}),
      }

      const result = await onCreateProject(payload)

      if (result?.success) {
        setFormData({
          name: '',
          description: '',
          category: 'Product',
          priority: 'medium',
          visibility: 'private',
          dueDate: '',
          budget: '',
          memberIds: [],
        })
        setSelectedMemberId('')
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleToggleMember = (memberId) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.memberIds) ? prev.memberIds : []
      const next = current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]

      return {
        ...prev,
        memberIds: next,
      }
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[88vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Project
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter project name"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter project description"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Product">Product</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibility
                </label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">Private</option>
                  <option value="internal">Internal</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timeline (Due Date)
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget
                </label>
                <input
                  type="number"
                  name="budget"
                  min="0"
                  step="1"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="Enter budget"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Project Members */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add Members
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    disabled={membersLoading || availableTeamMembers.length === 0}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select member</option>
                    {availableTeamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedMemberId) return
                      handleToggleMember(selectedMemberId)
                      setSelectedMemberId('')
                    }}
                    disabled={!selectedMemberId}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>

                {membersLoading && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">Loading team members...</p>
                )}

                {!membersLoading && teamMembers.length === 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">No active team members available</p>
                )}

                {selectedMemberIds.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 space-y-2 bg-white dark:bg-gray-700">
                    {selectedMemberIds.map((memberId) => {
                      const member = teamMembers.find((candidate) => candidate.id === memberId)
                      if (!member) return null

                      return (
                        <div key={member.id} className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-gray-50 dark:bg-gray-600">
                          <span className="text-sm text-gray-800 dark:text-gray-100">
                            {member.name} ({member.email})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleMember(member.id)}
                            className="text-xs text-red-600 dark:text-red-300 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
