/**
 * Sidebar Navigation Configuration
 *
 * Defines the structure and content of the sidebar navigation menu based on user roles.
 *
 * @module _nav
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilCalendar,
  cilDescription,
  cilNotes,
  cilSpeedometer,
  cilPeople,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

/**
 * Genera la estructura del menú de navegación filtrada por roles de usuario.
 *
 * @param {Array<string>} userRoles - Arreglo de roles del usuario (ej: ['ADMIN'])
 * @returns {Array<Object>} Arreglo de componentes de menú para CoreUI
 */
export const getSidebarNav = (userRoles = []) => {
  const isAdmin = userRoles.includes('ADMIN')
  const isMedico = userRoles.includes('MEDICO')
  const isAsistente = userRoles.includes('ASISTENTE')
  const hasAnyRole = userRoles.length > 0

  const menu = []

  // ==========================================
  // DASHBOARD (Visible para todos los logueados)
  // ==========================================
  if (hasAnyRole) {
    menu.push({
      component: CNavItem,
      name: 'Dashboard',
      to: '/dashboard',
      icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    })
  }

  // ==========================================
  // SECCIÓN: ADMINISTRACIÓN Y CLÍNICA (ESTRICTO SOLO ADMIN)
  // ==========================================
  if (isAdmin) {
    menu.push(
      {
        component: CNavTitle,
        name: 'Administración',
      },
      {
        component: CNavGroup,
        name: 'Admin de Usuarios',
        to: '/administracion/admin-usuarios',
        icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
        items: [
          {
            component: CNavItem,
            name: 'Usuarios',
            to: '/administracion/admin-usuarios/usuarios',
          },
          {
            component: CNavItem,
            name: 'Roles',
            to: '/administracion/admin-usuarios/roles',
          },
        ],
      },
      {
        component: CNavTitle,
        name: 'Clínica',
      },
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

  // ==========================================
  // SECCIÓN: PACIENTES (ADMIN, MEDICO, ASISTENTE)
  // ==========================================
  if (hasAnyRole) {
    menu.push(
      {
        component: CNavTitle,
        name: 'Pacientes',
      },
      {
        component: CNavGroup,
        name: 'Gestión de Pacientes',
        to: '/pacientes',
        icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
        items: [
          {
            component: CNavItem,
            name: 'Pacientes',
            to: '/pacientes/pacientes',
          },
        ],
      }
    )
  }

  // ==========================================
  // SECCIÓN: AGENDA (Muestra sub-ítems según rol)
  // ==========================================
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
    menu.push(
      {
        component: CNavTitle,
        name: 'Pantalla de Agenda',
      },
      {
        component: CNavGroup,
        name: 'Agenda',
        to: '/agenda',
        icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
        items: agendaItems,
      }
    )
  }

  // ==========================================
  // SECCIÓN: AUTORIZACIONES (ADMIN y ASISTENTE)
  // ==========================================
  if (isAdmin || isAsistente) {
    menu.push(
      {
        component: CNavTitle,
        name: 'Autorizaciones',
      },
      {
        component: CNavGroup,
        name: 'Atención',
        to: '/autorizaciones',
        icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
        items: [
          {
            component: CNavItem,
            name: 'Autorización de Atención',
            to: '/autorizaciones/autorizacion-atencion',
          },
        ],
      }
    )
  }

  // ==========================================
  // SECCIÓN: PANTALLA DEL MÉDICO (Solo MEDICO)
  // ==========================================
  if (isMedico) {
    menu.push(
      {
        component: CNavTitle,
        name: 'Pantalla del Médico',
      },
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

  // ==========================================
  // SECCIÓN: ASISTENTE CLÍNICO (ASISTENTE u Opcional ADMIN)
  // ==========================================
  if (isAsistente || isAdmin) {
    menu.push(
      {
        component: CNavTitle,
        name: 'Asistente Clínico',
      },
      {
        component: CNavGroup,
        name: 'Asistente',
        to: '/asistente-clinico',
        icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
        items: [
          ...(isAsistente ? [
            { component: CNavItem, name: 'Dashboard Asistente', to: '/asistente-clinico/dashboard' },
            { component: CNavItem, name: 'Autorización de Atención', to: '/asistente-clinico/autorizacion-atencion' }
          ] : []),
          { component: CNavItem, name: 'Bandeja de Chats', to: '/asistente-clinico/bandeja-chats' }
        ],
      }
    )
  }

  return menu
}

export default getSidebarNav