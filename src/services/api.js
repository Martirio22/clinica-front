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
  let token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json().catch(() => null)

    // 1. Si la respuesta es un error 401 (No autorizado / Token Expirado)
    // Evitamos entrar en bucle infinito si la petición que falló ya era la de refrescar el token
    if (response.status === 401 && endpoint !== '/security/auth/refresh-token') {
      try {
        // Intentamos renovar el Access Token en segundo plano
        const refreshData = await authService.refreshToken()
        
        if (refreshData?.accessToken) {
          // Si obtuvimos el nuevo token exitosamente, actualizamos la cabecera
          headers.Authorization = `Bearer ${refreshData.accessToken}`
          
          // Repetimos la petición original que había fallado, ahora con el token fresco
          const retryResponse = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
          })
          
          const retryData = await retryResponse.json().catch(() => null)
          
          if (!retryResponse.ok) {
            throw {
              status: retryResponse.status,
              message: retryData?.message || retryData?.error || 'Error tras reintento',
              data: retryData,
            }
          }
          
          return retryData
        }
      } catch (refreshError) {
        // Si falló el refresco (el Refresh Token expiró o fue invalidado en el backend),
        // limpiamos todo rastro y forzamos el login inmediatamente.
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/#/login'
        throw refreshError
      }
    }

    // 2. Si la respuesta no fue OK (cualquier otro error que no sea 401)
    if (!response.ok) {
      throw {
        status: response.status,
        message: data?.message || data?.error || 'Error en la petición',
        data,
      }
    }

    return data

  } catch (error) {
    // Si el error capturado es el del redireccionamiento o ya formateado, lo relanzamos
    if (error.status) throw error;
    
    throw {
      status: 500,
      message: error.message || 'Error de conexión de red',
      data: null
    }
  }
}
