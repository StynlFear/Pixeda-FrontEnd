import { toast } from "@/hooks/use-toast"

export interface ApiError {
  message: string
  status: number
  data?: any
}

export function handleApiError(error: any): ApiError {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || error.response.data?.error || 'An error occurred'
    return {
      message,
      status: error.response.status,
      data: error.response.data
    }
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error. Please check your connection.',
      status: 0
    }
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0
    }
  }
}

export function showApiError(error: any) {
  const apiError = handleApiError(error)
  toast({
    title: "Error",
    description: apiError.message,
    variant: "destructive"
  })
}
