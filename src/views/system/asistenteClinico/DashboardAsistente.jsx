import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'

import { chatSessionService } from '../../../services/chatSessionService'
import { appointmentService } from '../../../services/appointmentService'
import { attendanceAuthorizationService } from '../../../services/attendanceAuthorizationService'
import { patientService } from '../../../services/patientService'

const DashboardAsistente = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [chats, setChats] = useState([])
  const [citasHoy, setCitasHoy] = useState([])
  const [autorizaciones, setAutorizaciones] = useState([])
  const [pacientes, setPacientes] = useState([])

  const assistantIdActual =
    localStorage.getItem('assistantId') ||
    localStorage.getItem('clinicalAssistantId') ||
    localStorage.getItem('asistenteId') ||
    ''

  const getTodayRange = () => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const end = new Date()
    end.setHours(23, 59, 59, 999)

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }
  }

  const cargarDashboard = async () => {
    try {
      setLoading(true)
      setError(null)

      const todayRange = getTodayRange()

      const [chatsData, citasData, autorizacionesData, pacientesData] = await Promise.all([
        chatSessionService.listar(),
        appointmentService.listarConFiltros(todayRange),
        attendanceAuthorizationService.listar(),
        patientService.listar(),
      ])

      setChats(chatsData || [])
      setCitasHoy(citasData || [])
      setAutorizaciones(autorizacionesData || [])
      setPacientes(pacientesData || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al cargar el dashboard del asistente')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDashboard()
  }, [])

  const chatsEsperando = useMemo(() => {
    return chats.filter((chat) => {
      const code = chat.status?.code || chat.statusCode || ''
      const name = chat.status?.name || chat.statusName || ''

      return (
        chat.handledByBot === false ||
        code === 'ESPERANDO_ASISTENTE' ||
        code === 'PENDIENTE_HUMANO' ||
        code === 'HUMANO_PENDIENTE' ||
        name.toLowerCase().includes('esperando')
      ) && !chat.assignedAssistantId
    })
  }, [chats])

  const misChatsActivos = useMemo(() => {
    return chats.filter((chat) => {
      const code = chat.status?.code || chat.statusCode || ''
      const name = chat.status?.name || chat.statusName || ''

      const asignadoAMi =
        assistantIdActual &&
        chat.assignedAssistantId &&
        chat.assignedAssistantId === assistantIdActual

      const estaActivo =
        !chat.closeDate &&
        code !== 'CERRADO' &&
        code !== 'FINALIZADO' &&
        !name.toLowerCase().includes('cerrado') &&
        !name.toLowerCase().includes('finalizado')

      return asignadoAMi && estaActivo
    })
  }, [chats, assistantIdActual])

  const citasPendientesAutorizacion = useMemo(() => {
    return citasHoy.filter((cita) => {
      const autorizacion = autorizaciones.find((item) => item.appointmentId === cita.id)

      return !autorizacion || autorizacion.isAuthorized !== true
    })
  }, [citasHoy, autorizaciones])

  const pacientesPendientes = useMemo(() => {
    return pacientes.filter((paciente) => {
      return paciente.isActive === true
    })
  }, [pacientes])

  const formatFechaHora = (dateValue) => {
    if (!dateValue) return '-'

    return new Date(dateValue).toLocaleString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getNombrePacienteCita = (cita) => {
    if (cita?.patient) {
      return `${cita.patient.firstName || ''} ${cita.patient.lastName || ''}`.trim()
    }

    return cita?.patientName || 'Paciente'
  }

  const getNombreChat = (chat) => {
    return chat.patientWhatsappName || chat.patient?.firstName || 'Contacto WhatsApp'
  }

  const getNumeroChat = (chat) => {
    return chat.patientWhatsappNumber || '-'
  }

  const irBandejaChats = () => {
    navigate('/asistente-clinico/dashboard')
  }

  const verCitasHoy = () => {
    navigate('/agenda/calendario-citas')
  }

  const autorizarAtencion = () => {
    navigate('/asistente-clinico/autorizacion-atencion')
  }

  const crearCita = () => {
    navigate('/agenda/crear-cita-medica')
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner />
        <div className="mt-2">Cargando dashboard del asistente...</div>
      </div>
    )
  }

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h5 className="mb-0">Dashboard Asistente</h5>
            <small className="text-body-secondary">
              Resumen de chats, citas, autorizaciones y pacientes pendientes
            </small>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <CButton color="primary" onClick={irBandejaChats}>
              Ir a bandeja de chats
            </CButton>

            <CButton color="info" variant="outline" onClick={verCitasHoy}>
              Ver citas de hoy
            </CButton>

            <CButton color="success" variant="outline" onClick={() => autorizarAtencion()}>
              Autorizar atención
            </CButton>

            <CButton color="warning" variant="outline" onClick={crearCita}>
              Crear cita
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError(null)}>
              {error}
            </CAlert>
          )}

          <CRow>
            <CCol xs={12} md={6} xl={3} className="mb-3">
              <CCard className="h-100">
                <CCardBody>
                  <div className="text-body-secondary">Chats esperando</div>
                  <h2 className="mb-0">{chatsEsperando.length}</h2>
                  <CBadge color="warning" className="mt-2">
                    Pendientes
                  </CBadge>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} md={6} xl={3} className="mb-3">
              <CCard className="h-100">
                <CCardBody>
                  <div className="text-body-secondary">Mis chats activos</div>
                  <h2 className="mb-0">{misChatsActivos.length}</h2>
                  <CBadge color="success" className="mt-2">
                    En atención
                  </CBadge>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} md={6} xl={3} className="mb-3">
              <CCard className="h-100">
                <CCardBody>
                  <div className="text-body-secondary">Citas creadas hoy</div>
                  <h2 className="mb-0">{citasHoy.length}</h2>
                  <CBadge color="info" className="mt-2">
                    Hoy
                  </CBadge>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} md={6} xl={3} className="mb-3">
              <CCard className="h-100">
                <CCardBody>
                  <div className="text-body-secondary">Pendientes autorización</div>
                  <h2 className="mb-0">{citasPendientesAutorizacion.length}</h2>
                  <CBadge color="danger" className="mt-2">
                    Requieren revisión
                  </CBadge>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CRow>
        <CCol lg={6} className="mb-3">
          <CCard className="h-100">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Chats esperando</strong>
              <CButton size="sm" color="primary" variant="outline" onClick={irBandejaChats}>
                Ir a bandeja
              </CButton>
            </CCardHeader>

            <CCardBody>
              {chatsEsperando.length === 0 ? (
                <div className="text-body-secondary">No hay chats esperando atención.</div>
              ) : (
                <CTable responsive hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Paciente</CTableHeaderCell>
                      <CTableHeaderCell>WhatsApp</CTableHeaderCell>
                      <CTableHeaderCell>Inicio</CTableHeaderCell>
                      <CTableHeaderCell>Estado</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {chatsEsperando.slice(0, 5).map((chat) => (
                      <CTableRow key={chat.id}>
                        <CTableDataCell>{getNombreChat(chat)}</CTableDataCell>
                        <CTableDataCell>{getNumeroChat(chat)}</CTableDataCell>
                        <CTableDataCell>{formatFechaHora(chat.startDate)}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="warning">
                            {chat.status?.name || 'Esperando'}
                          </CBadge>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={6} className="mb-3">
          <CCard className="h-100">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Citas pendientes de autorización</strong>
              <CButton size="sm" color="success" variant="outline" onClick={() => autorizarAtencion()}>
                Autorizar atención
              </CButton>
            </CCardHeader>

            <CCardBody>
              {citasPendientesAutorizacion.length === 0 ? (
                <div className="text-body-secondary">No hay citas pendientes de autorización.</div>
              ) : (
                <CTable responsive hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Paciente</CTableHeaderCell>
                      <CTableHeaderCell>Fecha</CTableHeaderCell>
                      <CTableHeaderCell>Motivo</CTableHeaderCell>
                      <CTableHeaderCell>Acción</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {citasPendientesAutorizacion.slice(0, 5).map((cita) => (
                      <CTableRow key={cita.id}>
                        <CTableDataCell>{getNombrePacienteCita(cita)}</CTableDataCell>
                        <CTableDataCell>{formatFechaHora(cita.startDate)}</CTableDataCell>
                        <CTableDataCell>{cita.reason || '-'}</CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            size="sm"
                            color="success"
                            variant="outline"
                            onClick={() => autorizarAtencion()}
                          >
                            Autorizar
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={6} className="mb-3">
          <CCard className="h-100">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Citas creadas hoy</strong>
              <CButton size="sm" color="info" variant="outline" onClick={verCitasHoy}>
                Ver citas de hoy
              </CButton>
            </CCardHeader>

            <CCardBody>
              {citasHoy.length === 0 ? (
                <div className="text-body-secondary">No hay citas creadas para hoy.</div>
              ) : (
                <CTable responsive hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Paciente</CTableHeaderCell>
                      <CTableHeaderCell>Horario</CTableHeaderCell>
                      <CTableHeaderCell>Estado</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {citasHoy.slice(0, 5).map((cita) => (
                      <CTableRow key={cita.id}>
                        <CTableDataCell>{getNombrePacienteCita(cita)}</CTableDataCell>
                        <CTableDataCell>{formatFechaHora(cita.startDate)}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="info">
                            {cita.status?.name || cita.statusName || 'Cita'}
                          </CBadge>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={6} className="mb-3">
          <CCard className="h-100">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Pacientes pendientes</strong>
              <CButton size="sm" color="warning" variant="outline" onClick={crearCita}>
                Crear cita
              </CButton>
            </CCardHeader>

            <CCardBody>
              {pacientesPendientes.length === 0 ? (
                <div className="text-body-secondary">No hay pacientes pendientes.</div>
              ) : (
                <CTable responsive hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Paciente</CTableHeaderCell>
                      <CTableHeaderCell>Identificación</CTableHeaderCell>
                      <CTableHeaderCell>WhatsApp</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {pacientesPendientes.slice(0, 5).map((paciente) => (
                      <CTableRow key={paciente.id}>
                        <CTableDataCell>
                          {`${paciente.firstName || ''} ${paciente.lastName || ''}`.trim()}
                        </CTableDataCell>
                        <CTableDataCell>{paciente.identification || '-'}</CTableDataCell>
                        <CTableDataCell>{paciente.whatsappPhone || '-'}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default DashboardAsistente
