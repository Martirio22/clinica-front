const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3977/api'

export const getToken = () => {
  return localStorage.getItem('accessToken')
}

export const setToken = (token) => {
  localStorage.setItem('accessToken', token)
}

export const removeToken = () => {
  localStorage.removeItem('accessToken')
}

export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw {
      status: response.status,
      message: data?.message || data?.error || 'Error en la petición',
      data,
    }
  }

  return data
}
