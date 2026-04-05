import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/constants/queryKeys'
import { projectService } from '../api/projectService'

const getProjects = async ({ page = 1, limit = 10, filters = {}, signal } = {}) => {
  const response = await projectService.list({ page, limit, filters }, { signal })
  return response?.data || []
}

export const useProjects = ({ page = 1, limit = 10, filters = {}, queryScope = {}, queryOptions = {} } = {}) => {
  return useQuery({
    ...queryOptions,
    queryKey: [...queryKeys.projects.list({ page, limit, filters }), queryScope],
    queryFn: ({ signal }) => getProjects({ page, limit, filters, signal }),
  })
}

export const useInfiniteProjects = ({ limit = 10, filters = {} } = {}) => {
  return useInfiniteQuery({
    queryKey: ['projects', 'infinite', { limit, filters }],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      return projectService.list({ page: pageParam, limit, filters }, { signal })
    },
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta || {}
      return meta.hasNextPage ? meta.page + 1 : undefined
    },
  })
}

export const prefetchProjects = (queryClient, { page = 1, limit = 10, filters = {} } = {}) => {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.projects.list({ page, limit, filters }),
    queryFn: ({ signal }) => getProjects({ page, limit, filters, signal }),
  })
}
