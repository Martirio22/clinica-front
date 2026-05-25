import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux' // 1. Importamos useSelector para leer el rol

// 2. Importamos la función dinámica en lugar de la variable estática vieja
import { getAppRoutes } from '../routes'

import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

const AppBreadcrumb = () => {
  const currentLocation = useLocation().pathname

  // 3. Obtenemos las rutas correctas para el rol que inició sesión
  const authUser = useSelector((state) => state.auth?.user || state.user || null)
  
  const currentRoutes = useMemo(() => {
    if (!authUser || !authUser.roles) {
      return []
    }
    const activeRoles = Array.isArray(authUser.roles) ? authUser.roles : [authUser.roles]
    return getAppRoutes(activeRoles)
  }, [authUser])

  const getRouteName = (pathname, routesList) => {
    const currentRoute = routesList.find((route) => route.path === pathname)
    return currentRoute ? currentRoute.name : false
  }

  const getBreadcrumbs = (location) => {
    const breadcrumbs = []
    location.split('/').reduce((prev, curr, index, array) => {
      const currentPathname = `${prev}/${curr}`
      const routeName = getRouteName(currentPathname, currentRoutes) // Usamos las rutas dinámicas
      routeName &&
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
          active: index + 1 === array.length ? true : false,
        })
      return currentPathname
    })
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(currentLocation)

  return (
    <CBreadcrumb className="my-0">
      <CBreadcrumbItem href="/">Home</CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => {
        return (
          <CBreadcrumbItem
            {...(breadcrumb.active ? { active: true } : { href: breadcrumb.pathname })}
            key={index}
          >
            {breadcrumb.name}
          </CBreadcrumbItem>
        )
      })}
    </CBreadcrumb>
  )
}

export default React.memo(AppBreadcrumb)