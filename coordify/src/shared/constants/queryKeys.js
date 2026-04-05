export const queryKeys = {
  projects: {
    all: ['projects'],
    list: ({ page = 1, limit = 10, filters = {} } = {}) => ['projects', { page, limit, filters }],
    detail: (projectId) => ['projects', projectId],
  },
  tasks: {
    all: ['tasks'],
    list: ({ page = 1, limit = 25, filters = {} } = {}) => ['tasks', { page, limit, filters }],
    detail: (taskId) => ['tasks', taskId],
  },
}
