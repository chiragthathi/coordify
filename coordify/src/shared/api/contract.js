export const successResponse = (data, meta = {}) => ({
  success: true,
  data,
  error: null,
  meta,
})

export const errorResponse = (error, meta = {}) => ({
  success: false,
  data: null,
  error,
  meta,
})
