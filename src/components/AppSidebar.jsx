import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'

import { AppSidebarNav } from './AppSidebarNav'

import { logo } from 'src/assets/brand/logo'
import { sygnet } from 'src/assets/brand/sygnet'

import { cilCalendar, cilDescription, cilNotes, cilSpeedometer, cilPeople } from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)

  // Intentamos leer de Redux
  const reduxUser = useSelector((state) => state.auth?.user || state.user || null)

  const filteredMenuItems = useMemo(() => {
    let roles = []
    
    // 1. Intentar leer del Redux dinámico
    if (reduxUser && reduxUser.roles) {
      roles = Array.isArray(reduxUser.roles) ? reduxUser.roles : [reduxUser.roles]
    } 
    // 2. Si Redux está vacío (por un F5), recupera automáticamente del almacenamiento del navegador
    else {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          roles = parsedUser.roles ? (Array.isArray(parsedUser.roles) ? parsedUser.roles : [parsedUser.roles]) : []
        } catch (e) {
          console.error("Error al leer el usuario del almacenamiento:", e)
        }
      }
    }

    console.log("=== SIDEBAR RENDERIZANDO CON ROLES ===", roles)

    const isAdmin = roles.includes('ADMIN')
    const isMedico = roles.includes('MEDICO')
    const isAsistente = roles.includes('ASISTENTE')

    const menu = [
      {
        component: CNavItem,
        name: 'Dashboard',
        to: '/dashboard',
        icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
      }
    ]

    if (isAdmin) {
      menu.push(
        { component: CNavTitle, name: 'Administración' },
        {
          component: CNavGroup,
          name: 'Admin de Usuarios',
          to: '/administracion/admin-usuarios',
          icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
          items: [
            { component: CNavItem, name: 'Usuarios', to: '/administracion/admin-usuarios/usuarios' },
            { component: CNavItem, name: 'Roles', to: '/administracion/admin-usuarios/roles' },
          ],
        },
        { component: CNavTitle, name: 'Clínica' },
        {
          component: CNavGroup,
          name: 'Gestión Clínica',
          to: '/clinica',
          icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
          items: [
            { component: CNavItem, name: 'Sucursales', to: '/clinica/sucursales' },
            { component: CNavItem, name: 'Consultorios', to: '/clinica/consultorios' },
            { component: CNavItem, name: 'Especialidades', to: '/clinica/especialidades' },
            { component: CNavItem, name: 'Médicos', to: '/clinica/medicos' },
            { component: CNavItem, name: 'Asistentes Clínicos', to: '/clinica/asistentes-clinicos' },
          ],
        }
      )
    }

    menu.push(
      { component: CNavTitle, name: 'Pacientes' },
      {
        component: CNavGroup,
        name: 'Gestión de Pacientes',
        to: '/pacientes',
        icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
        items: [
          { component: CNavItem, name: 'Pacientes', to: '/pacientes/pacientes' },
        ],
      }
    )

    const agendaItems = []
    if (isAdmin || isMedico) {
      agendaItems.push(
        { component: CNavItem, name: 'Horarios Médicos', to: '/agenda/horarios-medicos' },
        { component: CNavItem, name: 'Bloqueo de Agenda', to: '/agenda/bloqueo-agenda' }
      )
    }
    if (isAdmin || isAsistente) {
      agendaItems.push(
        { component: CNavItem, name: 'Calendario General de Citas', to: '/agenda/calendario-citas' },
        { component: CNavItem, name: 'Crear Cita Médica', to: '/agenda/crear-cita-medica' }
      )
    }
    if (isAdmin) {
      agendaItems.push(
        { component: CNavItem, name: 'Tipos de Bloqueo', to: '/agenda/tipos-bloqueo' },
        { component: CNavItem, name: 'Estados de Cita', to: '/agenda/estados-cita' }
      )
    }

    if (agendaItems.length > 0) {
      menu.push({
        component: CNavGroup,
        name: 'Agenda',
        to: '/agenda',
        icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
        items: agendaItems,
      })
    }

    if (isAdmin || isAsistente) {
      menu.push(
        { component: CNavTitle, name: 'Autorizaciones' },
        {
          component: CNavGroup,
          name: 'Atención',
          to: '/autorizaciones',
          icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
          items: [
            { component: CNavItem, name: 'Autorización de Atención', to: '/autorizaciones/autorizacion-atencion' },
          ],
        }
      )
    }

    if (isMedico) {
      menu.push(
        { component: CNavTitle, name: 'Pantalla del Médico' },
        {
          component: CNavGroup,
          name: 'Médico',
          to: '/medico',
          icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
          items: [
            { component: CNavItem, name: 'Dashboard del Médico', to: '/medico/dashboard' },
            { component: CNavItem, name: 'Mi Calendario', to: '/medico/mi-calendario' },
            { component: CNavItem, name: 'Atención Médica', to: '/medico/atencion-medica' },
            { component: CNavItem, name: 'Recetas Médicas', to: '/medico/recetas-medicas' },
          ],
        }
      )
    }

    if (isAsistente || isAdmin) {
      const asistenteItems = []
      if (isAsistente) {
        asistenteItems.push(
          { component: CNavItem, name: 'Dashboard Asistente', to: '/asistente-clinico/dashboard' },
          { component: CNavItem, name: 'Autorización de Atención', to: '/asistente-clinico/autorizacion-atencion' }
        )
      }
      asistenteItems.push({ component: CNavItem, name: 'Bandeja de Chats', to: '/asistente-clinico/bandeja-chats' })

      menu.push(
        { component: CNavTitle, name: 'Asistente Clínico' },
        {
          component: CNavGroup,
          name: 'Asistente',
          to: '/asistente-clinico',
          icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
          items: asistenteItems,
        }
      )
    }

    return menu
  }, [reduxUser])

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/">
          <CIcon customClassName="sidebar-brand-full" icon={logo} height={32} />
          <CIcon customClassName="sidebar-brand-narrow" icon={sygnet} height={32} />
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>

      <AppSidebarNav items={filteredMenuItems} />
      
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)