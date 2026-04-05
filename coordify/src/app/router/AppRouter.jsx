import React, { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { PageLoader } from '../../shared/components/feedback/PageLoader'
import { ENABLE_NEW_DASHBOARD } from '../../shared/config/env'
import { useRouteAnalytics } from '../../shared/analytics/useRouteAnalytics'

const Dashboard = lazy(() => import('../../pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const NewDashboard = lazy(() => import('../../features/dashboard/pages/NewDashboard').then((m) => ({ default: m.NewDashboard })))
const Projects = lazy(() => import('../../pages/Projects').then((m) => ({ default: m.Projects })))
const ProjectDetail = lazy(() => import('../../pages/ProjectDetail').then((m) => ({ default: m.ProjectDetail })))
const KanbanPage = lazy(() => import('../../pages/KanbanPage').then((m) => ({ default: m.KanbanPage })))
const Team = lazy(() => import('../../pages/Team').then((m) => ({ default: m.Team })))
const Notifications = lazy(() => import('../../pages/Notifications').then((m) => ({ default: m.Notifications })))
const Settings = lazy(() => import('../../pages/Settings').then((m) => ({ default: m.Settings })))
const Login = lazy(() => import('../../pages/Login').then((m) => ({ default: m.Login })))
const Signup = lazy(() => import('../../pages/Signup').then((m) => ({ default: m.Signup })))
const ForgotPassword = lazy(() => import('../../pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const NotFound = lazy(() => import('../../pages/NotFound').then((m) => ({ default: m.NotFound })))

const withSuspense = (element) => (
  <Suspense fallback={<PageLoader />}>
    {element}
  </Suspense>
)

export const AppRouter = () => {
  useRouteAnalytics()

  return (
    <Routes>
      <Route path="/login" element={withSuspense(<Login />)} />
      <Route path="/signup" element={withSuspense(<Signup />)} />
      <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={withSuspense(ENABLE_NEW_DASHBOARD ? <NewDashboard /> : <Dashboard />)} />
        <Route path="projects" element={withSuspense(<Projects />)} />
        <Route path="projects/:projectId" element={withSuspense(<ProjectDetail />)} />
        <Route path="kanban" element={withSuspense(<KanbanPage />)} />
        <Route path="tasks/:taskId" element={withSuspense(<KanbanPage />)} />
        <Route path="team" element={withSuspense(<Team />)} />
        <Route path="notifications" element={withSuspense(<Notifications />)} />
        <Route path="settings" element={withSuspense(<Settings />)} />
      </Route>

      <Route path="*" element={withSuspense(<NotFound />)} />
    </Routes>
  )
}
