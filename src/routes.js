/**
 * Application Routes Configuration
 *
 * Defines all protected routes in the application based on user roles.
 *
 * @module routes
 */

import React from 'react'
import Usuarios from './views/system/administracion/Usuarios'
import Roles from './views/system/administracion/Roles'
import Sucursales from './views/system/clinica/Sucursales'
import Consultorios from './views/system/clinica/Consultorios'
import Especialidades from './views/system/clinica/Especialidades'
import Medicos from './views/system/clinica/Medicos'
import AsistentesClinicos from './views/system/clinica/AsistentesClinicos'
import Pacientes from './views/system/pacientes/Pacientes'
import PerfilPaciente from './views/system/pacientes/PerfilPaciente'
import HorariosMedicos from './views/system/agenda/HorariosMedicos'
import BloqueoAgenda from './views/system/agenda/BloqueoAgenda'
import TiposBloqueo from './views/system/agenda/TiposBloqueo'
import CalendarioCitas from './views/system/agenda/CalendarioCitas'
import CrearCitaMedica from './views/system/agenda/CrearCitaMedica'
import EstadosCita from './views/system/agenda/EstadosCita'
import AutorizacionAtencion from './views/system/autorizaciones/AutorizacionAtencion'
import DashboardMedico from './views/system/medico/DashboardMedico'
import MiCalendario from './views/system/medico/MiCalendario'
import AtencionMedica from './views/system/medico/AtencionMedica'
import RecetasMedicas from './views/system/medico/RecetasMedicas'
import DashboardAsistente from './views/system/asistenteClinico/DashboardAsistente'
import BandejaChats from './views/system/asistenteClinico/BandejaChats'
import ChatEnVivo from './views/system/asistenteClinico/ChatEnVivo'
import AutorizacionAtencionAsistente from './views/system/asistenteClinico/AutorizacionAtencionAsistente'

// Dashboard principal base
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))

/**
 * Genera las rutas permitidas en base a los roles del usuario logueado.
 * * @param {Array<string>} userRoles 
 * @returns {Array<Object>}
 */
export const getAppRoutes = (userRoles = []) => {
  const isAdmin = userRoles.includes('ADMIN')
  const isMedico = userRoles.includes('MEDICO')
  const isAsistente = userRoles.includes('ASISTENTE')
  const isEnfermero = userRoles.includes('ENFERMERO')
  const hasAnyRole = userRoles.length > 0

  const allowedRoutes = [
    { path: '/', exact: true, name: 'Home' }
  ]

  // Dashboard general accesible para cualquiera con un rol válido
  if (hasAnyRole) {
    allowedRoutes.push(
      
      { path: '/pacientes', name: 'Pacientes', exact: true },
      { path: '/pacientes/pacientes', name: 'Pacientes', element: Pacientes },
      { path: '/pacientes/perfil-paciente/:id', name: 'Perfil Paciente', element: PerfilPaciente }
    )
  }

  // Rutas exclusivas de ADMINISTRADOR
  if (isAdmin) {
    allowedRoutes.push(
      { path: '/dashboard', name: 'Dashboard', element: Dashboard },
      { path: '/administracion', name: 'Administración', exact: true },
      { path: '/administracion/admin-usuarios', name: 'Admin de Usuarios', exact: true },
      { path: '/administracion/admin-usuarios/usuarios', name: 'Usuarios', element: Usuarios },
      { path: '/administracion/admin-usuarios/roles', name: 'Roles', element: Roles },

      { path: '/clinica', name: 'Clínica', exact: true },
      { path: '/clinica/sucursales', name: 'Sucursales', element: Sucursales },
      { path: '/clinica/consultorios', name: 'Consultorios', element: Consultorios },
      { path: '/clinica/especialidades', name: 'Especialidades', element: Especialidades },
      { path: '/clinica/medicos', name: 'Médicos', element: Medicos },
      { path: '/clinica/asistentes-clinicos', name: 'Asistentes Clínicos', element: AsistentesClinicos },

      { path: '/agenda/tipos-bloqueo', name: 'Tipos de Bloqueo', element: TiposBloqueo },
      { path: '/agenda/estados-cita', name: 'Estados de Cita', element: EstadosCita }
    )
  }

  // Rutas compartidas o específicas de la Agenda
  if (isAdmin || isMedico) {
    allowedRoutes.push(
      { path: '/agenda', name: 'Pantalla de Agenda', exact: true },
      { path: '/agenda/horarios-medicos', name: 'Horarios Médicos', element: HorariosMedicos },
      { path: '/agenda/bloqueo-agenda', name: 'Bloqueo de Agenda', element: BloqueoAgenda }
    )
  }

  if (isAdmin || isAsistente) {
    allowedRoutes.push(
      { path: '/agenda/calendario-citas', name: 'Calendario General de Citas', element: CalendarioCitas },
      { path: '/agenda/crear-cita-medica', name: 'Crear Cita Médica', element: CrearCitaMedica },
      
      { path: '/autorizaciones', name: 'Autorizaciones', exact: true },
      { path: '/autorizaciones/autorizacion-atencion', name: 'Autorización de Atención', element: AutorizacionAtencion }
    )
  }

  // Rutas exclusivas de MÉDICO
  if (isMedico) {
    allowedRoutes.push(
      { path: '/medico', name: 'Pantalla del Médico', exact: true },
      { path: '/medico/dashboard', name: 'Dashboard del Médico', element: DashboardMedico },
      { path: '/medico/mi-calendario', name: 'Mi Calendario', element: MiCalendario },
      { path: '/medico/atencion-medica', name: 'Atención Médica', element: AtencionMedica },
      { path: '/medico/atencion-medica/:appointmentId', name: 'Atención Médica', element: AtencionMedica },
      { path: '/medico/recetas-medicas', name: 'Recetas Médicas', element: RecetasMedicas }
    )
  }

  // Rutas exclusivas de ASISTENTE
  if (isAsistente) {
    allowedRoutes.push(
      { path: '/asistente-clinico', name: 'Asistente Clínico', exact: true },
      { path: '/asistente-clinico/dashboard', name: 'Dashboard Asistente', element: DashboardAsistente },
      { path: '/asistente-clinico/autorizacion-atencion', name: 'Autorización de Atención', element: AutorizacionAtencionAsistente }
    )
  }

  if (isAsistente || isAdmin) {
    allowedRoutes.push(
      { path: '/asistente-clinico/bandeja-chats', name: 'Bandeja de Chats', element: BandejaChats },
      { path: '/asistente-clinico/chat-en-vivo/:sessionId', name: 'Chat en Vivo', element: ChatEnVivo }
    )
  }

  return allowedRoutes
}