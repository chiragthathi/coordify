import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Bell,
  Settings,
  LogOut,
  Moon,
  Sun,
  Home,
  FolderOpen,
  Users,
  LogIn,
  Search,
  MessageSquare,
  LayoutGrid,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { queryClient } from '../app/query/queryClient'
import { prefetchProjects } from '../features/projects/hooks/useProjects'
import { prefetchTasks } from '../features/tasks/hooks/useTasks'
import { notificationService } from '../services/api'

export const TopNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const profileMenuRef = useRef(null)
  const profileButtonRef = useRef(null)
  const settingsLinkRef = useRef(null)
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const profileAvatar = useMemo(
    () => user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || user?.name || 'user'}`,
    [user?.avatar, user?.email, user?.name],
  )

  useEffect(() => {
    let isMounted = true

    const loadUnreadCount = async () => {
      if (!user?.id) {
        if (isMounted) setUnreadCount(0)
        return
      }

      try {
        const response = await notificationService.list({ userId: user.id, unreadOnly: true })
        const unreadItems = Array.isArray(response?.data) ? response.data : []
        if (isMounted) setUnreadCount(unreadItems.length)
      } catch {
        if (isMounted) setUnreadCount(0)
      }
    }

    loadUnreadCount()

    const intervalId = setInterval(loadUnreadCount, 10000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [user?.id])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return

    setIsMenuOpen(false)
    navigate(`/projects?search=${encodeURIComponent(query)}`)
  }

  const navLinks = [
    { label: 'Dashboard', href: '/', icon: Home },
    { label: 'Projects', href: '/projects', icon: FolderOpen, onHoverPrefetch: () => prefetchProjects(queryClient) },
    { label: 'Kanban', href: '/kanban', icon: LayoutGrid, onHoverPrefetch: () => prefetchTasks(queryClient) },
    { label: 'Team', href: '/team', icon: Users },
    { label: 'Notifications', href: '/notifications', icon: MessageSquare },
    { label: 'Settings', href: '/settings', icon: Settings },
  ]

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        setIsProfileOpen(false)
      }
    }

    const onClickOutside = (event) => {
      if (
        isProfileOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClickOutside)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [isProfileOpen])

  useEffect(() => {
    if (isProfileOpen) {
      settingsLinkRef.current?.focus()
    }
  }, [isProfileOpen])

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">
              Coordify
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onMouseEnter={link.onHoverPrefetch}
                onFocus={link.onHoverPrefetch}
                className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <link.icon className="h-4 w-4 mr-2" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Center search bar - hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects, tasks..."
                  aria-label="Search projects and tasks"
                  className="w-full px-4 py-2 pl-10 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </form>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Toggle theme"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {/* Notifications */}
            {user && (
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Notifications"
              >
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User menu or login */}
            {user ? (
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  aria-label="Open user menu"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  title={user.name}
                >
                  <img
                    src={profileAvatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.name}
                  </span>
                </button>

                {/* Dropdown menu */}
                {isProfileOpen && (
                  <div ref={profileMenuRef} role="menu" className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      ref={settingsLinkRef}
                      to="/settings"
                      aria-label="Open settings"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      aria-label="Logout"
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <LogIn className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile navigation and search */}
        {isMenuOpen && (
          <div className="lg:hidden pb-4 space-y-2">
            {/* Mobile search */}
            <div className="px-3 pb-2">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    aria-label="Search projects and tasks"
                    className="w-full px-4 py-2 pl-10 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </form>
            </div>

            {/* Mobile nav links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onMouseEnter={link.onHoverPrefetch}
                onFocus={link.onHoverPrefetch}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

