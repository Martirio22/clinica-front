import React, { Suspense, useMemo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import { useSelector } from 'react-redux'

import { getAppRoutes } from '../routes'

const AppContent = () => {
  const reduxUser = useSelector((state) => state.auth?.user || state.user || null)

  const currentRoutes = useMemo(() => {
    let activeRoles = []

    // 1. Intentar leer del Redux dinámico
    if (reduxUser && reduxUser.roles) {
      activeRoles = Array.isArray(reduxUser.roles) ? reduxUser.roles : [reduxUser.roles]
    } 
    // 2. Si Redux se borró por un F5, recupera automáticamente del almacenamiento del navegador
    else {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          activeRoles = parsedUser.roles ? (Array.isArray(parsedUser.roles) ? parsedUser.roles : [parsedUser.roles]) : []
        } catch (e) {
          console.error("Error al recuperar rutas desde el almacenamiento:", e)
        }
      }
    }

    return getAppRoutes(activeRoles)
  }, [reduxUser])

  return (
    <CContainer className="px-4" lg>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {currentRoutes.map((route, idx) => {
            return (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={<route.element />}
                />
              )
            )
          })}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)