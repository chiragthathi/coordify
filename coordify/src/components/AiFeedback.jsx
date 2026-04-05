import React from 'react'
import { Bot, Sparkles, AlertTriangle, CheckCircle2, XCircle, X } from 'lucide-react'

const toneStyles = {
  success: {
    card: 'border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-100',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600 dark:text-emerald-300',
  },
  error: {
    card: 'border-rose-200 bg-rose-50/95 text-rose-900 dark:border-rose-800 dark:bg-rose-900/35 dark:text-rose-100',
    icon: XCircle,
    iconColor: 'text-rose-600 dark:text-rose-300',
  },
  info: {
    card: 'border-blue-200 bg-blue-50/95 text-blue-900 dark:border-blue-800 dark:bg-blue-900/35 dark:text-blue-100',
    icon: Sparkles,
    iconColor: 'text-blue-600 dark:text-blue-300',
  },
  warning: {
    card: 'border-amber-200 bg-amber-50/95 text-amber-900 dark:border-amber-800 dark:bg-amber-900/35 dark:text-amber-100',
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-300',
  },
}

const getToneStyle = (tone) => toneStyles[tone] || toneStyles.info

export const AiMessageToast = ({
  isOpen,
  title = 'AI Assistant',
  message = '',
  tone = 'info',
  onClose,
}) => {
  if (!isOpen || !message) return null

  const style = getToneStyle(tone)
  const Icon = style.icon

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm px-4 sm:px-0">
      <div className={`rounded-xl border shadow-lg backdrop-blur-sm ${style.card}`}>
        <div className="flex items-start gap-3 p-4">
          <div className="h-9 w-9 rounded-lg bg-white/80 dark:bg-black/20 flex items-center justify-center">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{title}</p>
            <p className="text-sm mt-1 leading-5">{message}</p>
          </div>
          <Icon className={`h-5 w-5 mt-0.5 ${style.iconColor}`} />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close assistant message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export const AiConfirmDialog = ({
  isOpen,
  title,
  message,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'warning',
  onConfirm,
  onCancel,
  busy = false,
}) => {
  if (!isOpen) return null

  const style = getToneStyle(tone)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onCancel} aria-label="Close dialog" />
      <div className={`relative w-full max-w-md rounded-xl border shadow-xl ${style.card}`}>
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/80 dark:bg-black/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">AI Assistant</p>
              <h3 className="text-lg font-semibold mt-1">{title}</h3>
            </div>
          </div>
          <p className="text-sm mt-3 leading-6 opacity-90">{message}</p>
          {children ? <div className="mt-4">{children}</div> : null}
          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white/80 dark:bg-gray-800/80"
              disabled={busy}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={busy}
            >
              {busy ? 'Please wait...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
