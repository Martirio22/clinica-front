import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

      const data = await authService.login({
        username: username.trim(),
        usernameOrEmail: username.trim(),
        password,
      })

      const roles = data.user?.roles
        ? Array.isArray(data.user.roles)
          ? data.user.roles
          : [data.user.roles]
        : []

      // Verificamos si tiene al menos uno de los roles permitidos
      const rolesPermitidos = ['MEDICO', 'ASISTENTE', 'ENFERMERO', 'ADMIN']
      const tieneRol = roles.some(rol => rolesPermitidos.includes(rol))

      if (!tieneRol) {
        // Si no tiene rol, NO navegamos y mostramos un error
        setError('El usuario no tiene permisos asignados para acceder al sistema.')
        setLoading(false)
        return // Salimos de la función aquí
      }

      // Si sí tiene rol, procedemos con la navegación
      if (roles.includes('MEDICO')) {
        navigate('/medico/dashboard', { replace: true })
      } else if (roles.includes('ASISTENTE')) {
        navigate('/asistente-clinico/dashboard', { replace: true })
      } else if (roles.includes('ENFERMERO')) {
        navigate('/enfermero/paciente-del-dia', { replace: true })
      } else {
        // En caso de que sea ADMIN u otro rol configurado
        navigate('/dashboard', { replace: true })
      }

    } catch (err) {
      setError(err.message || 'Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f0ede8;
          background-image:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(180,160,130,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 80% 90%, rgba(100,120,100,0.10) 0%, transparent 70%);
          font-family: 'DM Sans', sans-serif;
          padding: 1rem;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 4px;
          box-shadow: 0 2px 40px rgba(60,50,40,0.10), 0 1px 4px rgba(60,50,40,0.07);
          overflow: hidden;
          position: relative;
        }

        .login-top-bar {
          height: 5px;
          background: linear-gradient(90deg, #4a7c59 0%, #7aab8a 50%, #c9b87a 100%);
        }

        .login-body {
          padding: 2.75rem 2.5rem 2.5rem;
        }

        .login-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #4a7c59;
          margin-bottom: 0.6rem;
        }

        .login-title {
          font-family: 'DM Serif Display', serif;
          font-size: 2.1rem;
          color: #2a2420;
          margin: 0 0 0.3rem;
          line-height: 1.1;
        }

        .login-subtitle {
          font-size: 0.85rem;
          color: #9a8f85;
          font-weight: 300;
          margin-bottom: 2rem;
        }

        .login-error {
          background: #fef3f2;
          border: 1px solid #fdc0bb;
          border-left: 3px solid #e05a4b;
          color: #8a2e24;
          font-size: 0.82rem;
          padding: 0.65rem 0.9rem;
          border-radius: 3px;
          margin-bottom: 1.4rem;
        }

        .field-group {
          margin-bottom: 1.2rem;
        }

        .field-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6b6058;
          margin-bottom: 0.45rem;
        }

        .field-input {
          width: 100%;
          padding: 0.75rem 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 400;
          color: #2a2420;
          background: #faf9f7;
          border: 1px solid #ddd8d0;
          border-radius: 3px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
          -webkit-appearance: none;
        }

        .field-input::placeholder {
          color: #c4bdb5;
        }

        .field-input:focus {
          border-color: #4a7c59;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(74,124,89,0.10);
        }

        .login-btn {
          width: 100%;
          padding: 0.85rem;
          margin-top: 0.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #fff;
          background: #4a7c59;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .login-btn:hover:not(:disabled) {
          background: #3a6347;
          box-shadow: 0 4px 16px rgba(74,124,89,0.25);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(1px);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          padding: 1rem 2.5rem 1.5rem;
          border-top: 1px solid #f0ece6;
          text-align: center;
          font-size: 0.75rem;
          color: #b8b0a8;
          letter-spacing: 0.03em;
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">
          <div className="login-top-bar" />

          <div className="login-body">
            <p className="login-eyebrow">Sistema Clínico</p>
            <h1 className="login-title">Bienvenido</h1>
            <p className="login-subtitle">Ingrese sus credenciales para continuar</p>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} noValidate>
              <div className="field-group">
                <label className="field-label" htmlFor="username">Usuario</label>
                <input
                  id="username"
                  className="field-input"
                  type="text"
                  placeholder="Ingrese su usuario"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  className="field-input"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>
          </div>

          <div className="login-footer">
            © {new Date().getFullYear()} — Sistema de Gestión Clínica
          </div>
        </div>
      </div>
    </>
  )
}

export default Login