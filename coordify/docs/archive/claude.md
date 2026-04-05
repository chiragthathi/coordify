# ProjectHub – Enterprise Project Management Tool (Frontend-first)

## Overview
A professional, enterprise-grade project management tool with rich UI, mock data, top navigation, and a comprehensive feature set. Frontend-only first, with mock data layer that can be swapped for a real backend later.

## Tech Stack (Frontend)
- React + Vite
- java-script
- Tailwind CSS + shadcn/ui
- context (state management)
- React Router
- Recharts (charts)
- dnd-kit (kanban drag and drop)
- Dark/Light mode
- Mock data in src/data (replaceable with API later)

## Layout & Navigation
- Top nav: logo, Dashboard, Projects, Team, Notifications, Settings
- Search bar, notification bell with unread count
- User avatar dropdown
- Mobile hamburger menu
- Protected routes using Auth context

## Auth (Mock)
- Login, Signup, Forgot password
- Mock auth context (localStorage)
- Role-based UI (Admin, Manager, Member, Viewer)

## Core Pages
- Dashboard (stats, charts, activity feed, My Tasks)
- Projects (card grid + project detail)
- Kanban board (To Do, In Progress, In Review, Done)
- List/Table view
- Team
- Notifications
- Settings

## Reusable Components
- StatusBadge
- PriorityBadge
- AvatarGroup
- EmptyState
- PageHeader
- StatCard
- DataTable

## Types
Shared jS types:
- User
- Project
- Task
- Comment
- Notification

## Mock Data
Located in src/data/*
Should be easy to replace with API later.

## Backend (Later)
Microservices architecture:
- Auth Service
- Project Service
- Task Service
- Notification Service
- User Service
- API Gateway
- JWT auth
