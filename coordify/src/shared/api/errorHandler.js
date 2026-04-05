const DEFAULT_ERROR = {
  status: 500,
  code: 'UNKNOWN_ERROR',
  message: 'Something went wrong. Please try again.',
}

export const normalizeApiError = (error) => {
  const status = error?.response?.status || DEFAULT_ERROR.status
  const code = error?.response?.data?.code || error?.code || DEFAULT_ERROR.code
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    DEFAULT_ERROR.message

  return {
    status,
    code,
    message,
    raw: error,
  }
}
