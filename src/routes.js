/**
 * Application Routes Configuration
 *
 * Defines all protected routes in the application using React lazy loading
 * for code splitting and performance optimization.
 *
 * Each route object contains:
 * - path: URL path for the route
 * - name: Human-readable name for breadcrumbs
 * - element: Lazy-loaded React component
 * - exact: (optional) Requires exact path match
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
import PacienteDelDia from './views/system/enfermero/PacienteDelDia'
import LineasWhatsapp from './views/system/whatsappBot/LineasWhatsapp'
import MenusBot from './views/system/whatsappBot/MenusBot'
import OpcionesMenuBot from './views/system/whatsappBot/OpcionesMenuBot'
import IntencionesIA from './views/system/whatsappBot/IntencionesIA'
import EventosIA from './views/system/whatsappBot/EventosIA'

// Dashboard
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Colors = React.lazy(() => import('./views/theme/colors/Colors'))
const Typography = React.lazy(() => import('./views/theme/typography/Typography'))

// Base
const Accordion = React.lazy(() => import('./views/base/accordion/Accordion'))
const Breadcrumbs = React.lazy(() => import('./views/base/breadcrumbs/Breadcrumbs'))
const Cards = React.lazy(() => import('./views/base/cards/Cards'))
const Carousels = React.lazy(() => import('./views/base/carousels/Carousels'))
const Chip = React.lazy(() => import('./views/base/chip/Chip'))
const Collapses = React.lazy(() => import('./views/base/collapses/Collapses'))
const ListGroups = React.lazy(() => import('./views/base/list-groups/ListGroups'))
const Navs = React.lazy(() => import('./views/base/navs/Navs'))
const Paginations = React.lazy(() => import('./views/base/paginations/Paginations'))
const Placeholders = React.lazy(() => import('./views/base/placeholders/Placeholders'))
const Popovers = React.lazy(() => import('./views/base/popovers/Popovers'))
const Progress = React.lazy(() => import('./views/base/progress/Progress'))
const Spinners = React.lazy(() => import('./views/base/spinners/Spinners'))
const Tabs = React.lazy(() => import('./views/base/tabs/Tabs'))
const Tables = React.lazy(() => import('./views/base/tables/Tables'))
const Tooltips = React.lazy(() => import('./views/base/tooltips/Tooltips'))

// Buttons
const Buttons = React.lazy(() => import('./views/buttons/buttons/Buttons'))
const ButtonGroups = React.lazy(() => import('./views/buttons/button-groups/ButtonGroups'))
const Dropdowns = React.lazy(() => import('./views/buttons/dropdowns/Dropdowns'))

//Forms
const ChecksRadios = React.lazy(() => import('./views/forms/checks-radios/ChecksRadios'))
const ChipInput = React.lazy(() => import('./views/forms/chip-input/ChipInput'))
const FloatingLabels = React.lazy(() => import('./views/forms/floating-labels/FloatingLabels'))
const FormControl = React.lazy(() => import('./views/forms/form-control/FormControl'))
const InputGroup = React.lazy(() => import('./views/forms/input-group/InputGroup'))
const Layout = React.lazy(() => import('./views/forms/layout/Layout'))
const Range = React.lazy(() => import('./views/forms/range/Range'))
const Select = React.lazy(() => import('./views/forms/select/Select'))
const Validation = React.lazy(() => import('./views/forms/validation/Validation'))

const Charts = React.lazy(() => import('./views/charts/Charts'))

// Icons
const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))
const Flags = React.lazy(() => import('./views/icons/flags/Flags'))
const Brands = React.lazy(() => import('./views/icons/brands/Brands'))

// Notifications
const Alerts = React.lazy(() => import('./views/notifications/alerts/Alerts'))
const Badges = React.lazy(() => import('./views/notifications/badges/Badges'))
const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))
const Toasts = React.lazy(() => import('./views/notifications/toasts/Toasts'))

const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

/**
 * Array of route configuration objects
 *
 * @type {Array<Object>}
 * @property {string} path - URL path pattern
 * @property {string} name - Display name for breadcrumbs and navigation
 * @property {React.LazyExoticComponent} element - Lazy-loaded component
 * @property {boolean} [exact] - Whether to match path exactly
 *
 * @example
 * // Route renders when URL matches '/dashboard'
 * { path: '/dashboard', name: 'Dashboard', element: Dashboard }
 *
 * @example
 * // Route with exact match required
 * { path: '/base', name: 'Base', element: Cards, exact: true }
 */
export const routes = [
  { path: '/', exact: true, name: 'Home' },
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

  { path: '/pacientes', name: 'Pacientes', exact: true },
  { path: '/pacientes/pacientes', name: 'Pacientes', element: Pacientes },
  { path: '/pacientes/perfil-paciente/:id', name: 'Perfil Paciente', element: PerfilPaciente },

  { path: '/agenda', name: 'Pantalla de Agenda', exact: true },
  { path: '/agenda/horarios-medicos', name: 'Horarios Médicos', element: HorariosMedicos },
  { path: '/agenda/bloqueo-agenda', name: 'Bloqueo de Agenda', element: BloqueoAgenda },
  { path: '/agenda/tipos-bloqueo', name: 'Tipos de Bloqueo', element: TiposBloqueo },
  { path: '/agenda/calendario-citas', name: 'Calendario General de Citas', element: CalendarioCitas },
  { path: '/agenda/crear-cita-medica', name: 'Crear Cita Médica', element: CrearCitaMedica },
  { path: '/agenda/estados-cita', name: 'Estados de Cita', element: EstadosCita },

  { path: '/autorizaciones', name: 'Autorizaciones', exact: true },
  {
    path: '/autorizaciones/autorizacion-atencion',
    name: 'Autorización de Atención',
    element: AutorizacionAtencion,
  },

  { path: '/medico', name: 'Pantalla del Médico', exact: true },
  {
    path: '/medico/dashboard',
    name: 'Dashboard del Médico',
    element: DashboardMedico,
  },
  {
    path: '/medico/mi-calendario',
    name: 'Mi Calendario',
    element: MiCalendario,
  },
  {
    path: '/medico/atencion-medica',
    name: 'Atención Médica',
    element: AtencionMedica,
  },
  {
    path: '/medico/atencion-medica/:appointmentId',
    name: 'Atención Médica',
    element: AtencionMedica,
  },
  {
    path: '/medico/recetas-medicas',
    name: 'Recetas Médicas',
    element: RecetasMedicas,
  },

  { path: '/asistente-clinico', name: 'Asistente Clínico', exact: true },
  {
    path: '/asistente-clinico/dashboard',
    name: 'Dashboard Asistente',
    element: DashboardAsistente,
  },
  {
    path: '/asistente-clinico/bandeja-chats',
    name: 'Bandeja de Chats',
    element: BandejaChats,
  },
  {
    path: '/asistente-clinico/chat-en-vivo/:sessionId',
    name: 'Chat en Vivo',
    element: ChatEnVivo,
  },
  {
    path: '/asistente-clinico/autorizacion-atencion',
    name: 'Autorización de Atención',
    element: AutorizacionAtencionAsistente,
  },

  { path: '/enfermero', name: 'Pantalla Enfermero', exact: true },
  {
    path: '/enfermero/paciente-del-dia',
    name: 'Paciente del Día',
    element: PacienteDelDia,
  },

  { path: '/whatsapp-bot', name: 'Pantallas de WhatsApp / Bot', exact: true },
  {
    path: '/whatsapp-bot/lineas-whatsapp',
    name: 'Líneas WhatsApp',
    element: LineasWhatsapp,
  },
  {
    path: '/whatsapp-bot/menus-bot',
    name: 'Menús del Bot',
    element: MenusBot,
  },
  {
    path: '/whatsapp-bot/menus-bot/:menuId/opciones',
    name: 'Opciones del Menú',
    element: OpcionesMenuBot,
  },
  {
    path: '/whatsapp-bot/intenciones-ia',
    name: 'Intenciones IA',
    element: IntencionesIA,
  },
  {
    path: '/whatsapp-bot/eventos-ia',
    name: 'Eventos IA',
    element: EventosIA,
  },










  { path: '/theme', name: 'Theme', element: Colors, exact: true },
  { path: '/theme/colors', name: 'Colors', element: Colors },
  { path: '/theme/typography', name: 'Typography', element: Typography },
  { path: '/base', name: 'Base', element: Cards, exact: true },
  { path: '/base/accordion', name: 'Accordion', element: Accordion },
  { path: '/base/breadcrumbs', name: 'Breadcrumbs', element: Breadcrumbs },
  { path: '/base/cards', name: 'Cards', element: Cards },
  { path: '/base/carousels', name: 'Carousel', element: Carousels },
  { path: '/base/chip', name: 'Chip', element: Chip },
  { path: '/base/collapses', name: 'Collapse', element: Collapses },
  { path: '/base/list-groups', name: 'List Groups', element: ListGroups },
  { path: '/base/navs', name: 'Navs', element: Navs },
  { path: '/base/paginations', name: 'Paginations', element: Paginations },
  { path: '/base/placeholders', name: 'Placeholders', element: Placeholders },
  { path: '/base/popovers', name: 'Popovers', element: Popovers },
  { path: '/base/progress', name: 'Progress', element: Progress },
  { path: '/base/spinners', name: 'Spinners', element: Spinners },
  { path: '/base/tabs', name: 'Tabs', element: Tabs },
  { path: '/base/tables', name: 'Tables', element: Tables },
  { path: '/base/tooltips', name: 'Tooltips', element: Tooltips },
  { path: '/buttons', name: 'Buttons', element: Buttons, exact: true },
  { path: '/buttons/buttons', name: 'Buttons', element: Buttons },
  { path: '/buttons/dropdowns', name: 'Dropdowns', element: Dropdowns },
  { path: '/buttons/button-groups', name: 'Button Groups', element: ButtonGroups },
  { path: '/charts', name: 'Charts', element: Charts },
  { path: '/forms', name: 'Forms', element: FormControl, exact: true },
  { path: '/forms/form-control', name: 'Form Control', element: FormControl },
  { path: '/forms/select', name: 'Select', element: Select },
  { path: '/forms/checks-radios', name: 'Checks & Radios', element: ChecksRadios },
  { path: '/forms/chip-input', name: 'Chip Input', element: ChipInput },
  { path: '/forms/range', name: 'Range', element: Range },
  { path: '/forms/input-group', name: 'Input Group', element: InputGroup },
  { path: '/forms/floating-labels', name: 'Floating Labels', element: FloatingLabels },
  { path: '/forms/layout', name: 'Layout', element: Layout },
  { path: '/forms/validation', name: 'Validation', element: Validation },
  { path: '/icons', exact: true, name: 'Icons', element: CoreUIIcons },
  { path: '/icons/coreui-icons', name: 'CoreUI Icons', element: CoreUIIcons },
  { path: '/icons/flags', name: 'Flags', element: Flags },
  { path: '/icons/brands', name: 'Brands', element: Brands },
  { path: '/notifications', name: 'Notifications', element: Alerts, exact: true },
  { path: '/notifications/alerts', name: 'Alerts', element: Alerts },
  { path: '/notifications/badges', name: 'Badges', element: Badges },
  { path: '/notifications/modals', name: 'Modals', element: Modals },
  { path: '/notifications/toasts', name: 'Toasts', element: Toasts },
  { path: '/widgets', name: 'Widgets', element: Widgets },
]

export default routes
