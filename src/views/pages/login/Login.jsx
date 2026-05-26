import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { authService } from '../../../services/authService'

const Login = () => {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Ingrese usuario y contraseña')
      return
    }

    try {
      setLoading(true)

      console.log('Datos enviados al login:', {
        usernameOrEmail: username,
        username: username,
        password: password,
      })

      const data = await authService.login({
        username: username.trim(),
        usernameOrEmail: username.trim(),
        password,
      })

      console.log('Usuario logueado exitosamente:', data.user)

      // 1. Extraemos los roles de forma segura
      const roles = data.user?.roles ? (Array.isArray(data.user.roles) ? data.user.roles : [data.user.roles]) : []

      // 2. Evaluamos los roles para decidir el destino
      if (roles.includes('MEDICO')) {
        console.log('Redirigiendo al entorno de MÉDICO...')
        navigate('/medico/dashboard', { replace: true })
      } 
      else if (roles.includes('ASISTENTE')) {
        console.log('Redirigiendo al entorno de ASISTENTE...')
        // Nota: Asegúrate de que coincida con la ruta exacta configurada en tus routes.js
        navigate('/asistente-clinico/dashboard', { replace: true }) 
      } 
      else if (roles.includes('ENFERMERO')) {
        console.log('Redirigiendo al entorno de ENFERMERO...')
        navigate('/enfermero/paciente-del-dia', { replace: true })
      }
      else if (roles.includes('ADMIN')) {
        console.log('Redirigiendo al entorno de ADMINISTRADOR...')
        navigate('/dashboard', { replace: true })
      } 
      else {
        // Fallback por si tiene un rol no mapeado
        console.log('Rol desconocido, redirigiendo a la ruta base.')
        navigate('/dashboard', { replace: true })
      }

    } catch (err) {
      console.error('Error en login:', err)
      setError(err.message || 'Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleLogin}>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>

                    {error && (
                      <CAlert color="danger" className="py-2">
                        {error}
                      </CAlert>
                    )}

                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Username"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </CInputGroup>

                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </CInputGroup>

                    <CRow>
                      <CCol xs={6}>
                        <CButton
                          color="primary"
                          className="px-4"
                          type="submit"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              Ingresando...
                            </>
                          ) : (
                            'Login'
                          )}
                        </CButton>
                      </CCol>

                      <CCol xs={6} className="text-right">
                        <CButton color="link" className="px-0" type="button">
                          Forgot password?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>

              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Sign up</h2>
                    <p>
                      Registra nuevos usuarios para acceder al sistema de la clínica.
                    </p>
                    <Link to="/register">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        Register Now!
                      </CButton>
                    </Link>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login