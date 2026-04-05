import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/constants/queryKeys'
import { taskService } from '../api/taskService'

const getTasks = async ({ page = 1, limit = 25, filters = {}, signal } = {}) => {
  const response = await taskService.list({ page, limit, filters }, { signal })
  return response?.data || []
}

export const useTasks = ({ page = 1, limit = 25, filters = {}, queryOptions = {} } = {}) => {
  return useQuery({
    ...queryOptions,
    queryKey: queryKeys.tasks.list({ page, limit, filters }),
    queryFn: ({ signal }) => getTasks({ page, limit, filters, signal }),
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, updates }) => taskService.update(taskId, updates),
    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })

      const previousTasks = queryClient.getQueryData(queryKeys.tasks.all)

      queryClient.setQueryData(queryKeys.tasks.all, (oldTasks = []) => {
        return oldTasks.map((task) =>
          task.id === taskId
            ? { ...task, ...updates }
            : task
        )
      })

      return { previousTasks }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.all, context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
    },
  })
}

export const prefetchTasks = (queryClient, { page = 1, limit = 25, filters = {} } = {}) => {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.tasks.list({ page, limit, filters }),
    queryFn: ({ signal }) => getTasks({ page, limit, filters, signal }),
  })
}
