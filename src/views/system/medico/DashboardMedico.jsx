import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CWidgetStatsA,
} from '@coreui/react'

import { appointmentService } from '../../../services/appointmentService'
import { appointmentStatusService } from '../../../services/appointmentStatusService'
import { doctorService } from '../../../services/doctorService'
import { patientService } from '../../../services/patientService'
import { specialtyService } from '../../../services/specialtyService'
import { medicalAttentionService } from '../../../services/medicalAttentionService'
import { medicalPrescriptionService } from '../../../services/medicalPrescriptionService'

const DashboardMedico = () => {
  const navigate = useNavigate()

  const [citasHoy, setCitasHoy] = useState([])
  const [proximasCitas, setProximasCitas] = useState([])
  const [medicos, setMedicos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [estados, setEstados] = useState([])
  const [atenciones, setAtenciones] = useState([])
  const [recetas, setRecetas] = useState([])

  const [doctorId, setDoctorId] = useState('')
  const [nombreMedicoActivo, setNombreMedicoActivo] = useState('')

  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [reasonConsultation, setReasonConsultation] = useState('')
  const [visibleIniciarAtencion, setVisibleIniciarAtencion] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const hoy = new Date().toISOString().slice(0, 10)

  // === DETECCIÓN AUTOMÁTICA DEL MÉDICO LOGUEADO ===
  const vincularMedicoLogueado = (listaMedicos) => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (storedUser) {
      try {
        const loggedUser = JSON.parse(storedUser)
        
        // Buscamos en la lista de médicos cuál coincide con el ID de usuario del login
        const medicoAsociado = listaMedicos.find(
          (doc) => doc.userId === loggedUser.id || doc.user?.id === loggedUser.id
        )

        if (medicoAsociado) {
          console.log("=== DASHBOARD: Vinculado al médico ===", medicoAsociado)
          setDoctorId(medicoAsociado.id)
          
          const nombre = `${loggedUser.firstName || ''} ${loggedUser.lastName || ''}`.trim()
          setNombreMedicoActivo(nombre || `Registro: ${medicoAsociado.professionalRegistry}`)
        } else {
          // Fallback por si eres ADMIN haciendo pruebas
          console.warn("No se encontró un perfil de médico para este usuario.")
          if (listaMedicos.length > 0) setDoctorId(listaMedicos[0].id)
        }
      } catch (e) {
        console.error("Error al procesar el usuario logueado", e)
      }
    }
  }

  const cargarMedicos = async () => {
    try {
      const data = await doctorService.listar()
      setMedicos(data || [])
      // Vinculamos de forma automática pasando la lista limpia
      vincularMedicoLogueado(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los médicos.')
    }
  }

  const cargarPacientes = async () => {
    try {
      const data = await patientService.listar()
      setPacientes(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los pacientes.')
    }
  }

  const cargarEspecialidades = async () => {
    try {
      const data = await specialtyService.listar()
      setEspecialidades(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar las especialidades.')
    }
  }

  const cargarEstados = async () => {
    try {
      const data = await appointmentStatusService.listar()
      setEstados(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los estados de cita.')
    }
  }

  const cargarAtenciones = async () => {
    try {
      const data = await medicalAttentionService.listar()
      setAtenciones(data || [])
    } catch (err) {
      console.error(err)
      setAtenciones([])
    }
  }

  const cargarRecetas = async () => {
    try {
      const data = await medicalPrescriptionService.listar()
      setRecetas(data || [])
    } catch (err) {
      console.error(err)
      setRecetas([])
    }
  }

  const cargarCitas = async () => {
    // Si no se ha determinado el doctorId, no consultamos todavía para evitar traer citas de otros
    if (!doctorId) return

    try {
      setLoading(true)
      setError('')

      const filtrosHoy = {
        startDate: `${hoy}T00:00:00`,
        endDate: `${hoy}T23:59:59`,
        doctorId: doctorId
      }

      const dataHoy = await appointmentService.listarConFiltros(filtrosHoy)

      const fechaFinProximas = new Date()
      fechaFinProximas.setDate(fechaFinProximas.getDate() + 7)

      const filtrosProximas = {
        startDate: `${hoy}T00:00:00`,
        endDate: `${fechaFinProximas.toISOString().slice(0, 10)}T23:59:59`,
        doctorId: doctorId
      }

      const dataProximas = await appointmentService.listarConFiltros(filtrosProximas)

      setCitasHoy(dataHoy || [])
      setProximasCitas(dataProximas || [])
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudieron cargar las citas.')
    } finally {
      setLoading(false)
    }
  }

  const cargarTodo = async () => {
    await Promise.all([
      cargarMedicos(),
      cargarPacientes(),
      cargarEspecialidades(),
      cargarEstados(),
      cargarAtenciones(),
      cargarRecetas(),
    ])
  }

  useEffect(() => {
    cargarTodo()
  }, [])

  useEffect(() => {
    cargarCitas()
  }, [doctorId])

  const obtenerPaciente = (patientId) => {
    return pacientes.find((patient) => patient.id === patientId)
  }

  const obtenerNombrePaciente = (patientId) => {
    const patient = obtenerPaciente(patientId)
    if (!patient) return '-'
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
  }

  const obtenerNombreEspecialidad = (specialtyId) => {
    const specialty = especialidades.find((item) => item.id === specialtyId)
    return specialty?.name || '-'
  }

  const obtenerEstado = (statusId) => {
    return estados.find((estado) => estado.id === statusId)
  }

  const obtenerCodigoEstado = (statusId) => {
    const estado = obtenerEstado(statusId)
    return String(estado?.code || '').toUpperCase()
  }

  const obtenerNombreEstado = (statusId) => {
    const estado = obtenerEstado(statusId)
    return estado?.name || estado?.code || '-'
  }

  const obtenerColorEstado = (statusId) => {
    const code = obtenerCodigoEstado(statusId)
    if (code === 'RESERVADA') return 'info'
    if (code === 'CONFIRMADA') return 'success'
    if (code === 'EN_ESPERA') return 'warning'
    if (code === 'CANCELADA') return 'danger'
    if (code === 'ATENDIDA' || code === 'COMPLETADA') return 'primary'
    if (code === 'NO_ASISTIO') return 'dark'
    return 'secondary'
  }

 const formatearFechaHora = (value, soloHora = false) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    const opciones = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true 
    }

    if (soloHora) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    
    return date.toLocaleString('es-ES', opciones).replace(',', '')
  }

  const obtenerAtencionPorCita = (appointmentId) => {
    return atenciones.find((attention) => attention.appointmentId === appointmentId)
  }

  const tieneAtencion = (appointmentId) => {
    return Boolean(obtenerAtencionPorCita(appointmentId))
  }

  const atencionesDelDoctor = useMemo(() => {
    if (!doctorId) return []
    const citasIdsDoctor = new Set(
      [...citasHoy, ...proximasCitas].map((cita) => cita.id)
    )
    return atenciones.filter((attention) => citasIdsDoctor.has(attention.appointmentId))
  }, [atenciones, citasHoy, proximasCitas, doctorId])

  const atencionesIniciadas = useMemo(() => {
    return atencionesDelDoctor.filter((attention) => {
      return !attention.endDate && !attention.finishedAt && attention.isActive !== false
    })
  }, [atencionesDelDoctor])

  const atencionesFinalizadas = useMemo(() => {
    return atencionesDelDoctor.filter((attention) => {
      return Boolean(attention.endDate || attention.finishedAt || attention.finalizedAt)
    })
  }, [atencionesDelDoctor])

  const recetasDelDoctor = useMemo(() => {
    const attentionIds = new Set(atencionesDelDoctor.map((attention) => attention.id))
    return recetas.filter((prescription) => attentionIds.has(prescription.medicalAttentionId))
  }, [recetas, atencionesDelDoctor])

  const pacientesEnEspera = useMemo(() => {
    return citasHoy.filter((cita) => obtenerCodigoEstado(cita.statusId) === 'EN_ESPERA')
  }, [citasHoy, estados])

  const citasPendientesHoy = useMemo(() => {
    return citasHoy.filter((cita) => {
      const code = obtenerCodigoEstado(cita.statusId)
      return ['RESERVADA', 'CONFIRMADA', 'EN_ESPERA'].includes(code)
    })
  }, [citasHoy, estados])

  const irMiCalendario = () => navigate('/medico/mi-calendario')
  const crearBloqueo = () => navigate(`/agenda/bloqueo-agenda?doctorId=${doctorId}`)
  const verPaciente = (cita) => navigate(`/pacientes/perfil-paciente/${cita.patientId}`)

  const abrirModalIniciarAtencion = (cita) => {
    setSelectedAppointment(cita)
    setReasonConsultation(cita.reason || '')
    setModalError('')
    setVisibleIniciarAtencion(true)
  }

  const cerrarModalIniciarAtencion = () => {
    setVisibleIniciarAtencion(false)
    setSelectedAppointment(null)
    setReasonConsultation('')
    setModalError('')
  }

  const iniciarAtencion = async () => {
    try {
      if (!selectedAppointment) {
        setModalError('No existe una cita seleccionada.')
        return
      }
      if (!String(reasonConsultation || '').trim()) {
        setModalError('Debe ingresar el motivo de consulta.')
        return
      }

      setSaving(true)
      setModalError('')
      setError('')
      setSuccess('')

      const payload = {
        appointmentId: selectedAppointment.id,
        reasonConsultation: String(reasonConsultation || '').trim(),
      }

      await medicalAttentionService.iniciar(payload)

      setSuccess('Atención médica iniciada correctamente.')
      cerrarModalIniciarAtencion()
      await cargarAtenciones()
      await cargarCitas()
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo iniciar la atención.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Dashboard Médico</strong>
            {nombreMedicoActivo && (
              <span className="text-muted ms-2">| Dr(a). {nombreMedicoActivo}</span>
            )}
          </div>

          <div>
            <CButton color="info" variant="outline" className="me-2" onClick={irMiCalendario}>
              Ir a mi calendario
            </CButton>
            <CButton color="warning" variant="outline" onClick={crearBloqueo}>
              Crear bloqueo
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError('')}>
              {error}
            </CAlert>
          )}

          {success && (
            <CAlert color="success" dismissible onClose={() => setSuccess('')}>
              {success}
            </CAlert>
          )}

          {/* === ELIMINADO EL SELECTOR MANUAL DE MÉDICOS POR SEGURIDAD === */}

          <CRow className="g-3 mb-4">
            <CCol md={4}>
              <CWidgetStatsA color="primary" value={String(citasHoy.length)} title="Citas de hoy" />
            </CCol>
            <CCol md={4}>
              <CWidgetStatsA color="warning" value={String(pacientesEnEspera.length)} title="Pacientes en espera" />
            </CCol>
            <CCol md={4}>
              <CWidgetStatsA color="info" value={String(proximasCitas.length)} title="Próximas citas" />
            </CCol>
            <CCol md={4}>
              <CWidgetStatsA color="secondary" value={String(atencionesIniciadas.length)} title="Atenciones iniciadas" />
            </CCol>
            <CCol md={4}>
              <CWidgetStatsA color="success" value={String(atencionesFinalizadas.length)} title="Atenciones finalizadas" />
            </CCol>
            <CCol md={4}>
              <CWidgetStatsA color="dark" value={String(recetasDelDoctor.length)} title="Recetas emitidas" />
            </CCol>
          </CRow>

          {/* === SECCIÓN DE TABLAS (Mantiene la misma estructura limpia) === */}
          <CCard className="mb-4">
            <CCardHeader><strong>Citas de hoy</strong></CCardHeader>
            <CCardBody>
              {loading ? (
                <div className="text-center my-4"><CSpinner color="primary" /></div>
              ) : (
                <CTable hover responsive align="middle">
                  <CTableHead color="light">
                    <CTableRow>
                      <CTableHeaderCell>#</CTableHeaderCell>
                      <CTableHeaderCell>Hora</CTableHeaderCell>
                      <CTableHeaderCell>Paciente</CTableHeaderCell>
                      <CTableHeaderCell>Especialidad</CTableHeaderCell>
                      <CTableHeaderCell>Estado</CTableHeaderCell>
                      <CTableHeaderCell>Atención</CTableHeaderCell>
                      <CTableHeaderCell>Motivo</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {citasPendientesHoy.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={8} className="text-center">No existen citas pendientes para hoy.</CTableDataCell>
                      </CTableRow>
                    ) : (
                      citasPendientesHoy.map((cita, index) => (
                        <CTableRow key={cita.id}>
                          <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                          <CTableDataCell>{formatearFechaHora(cita.startDate)}</CTableDataCell>
                          <CTableDataCell>
                            <div>{obtenerNombrePaciente(cita.patientId)}</div>
                            <small className="text-body-secondary">{obtenerPaciente(cita.patientId)?.identification || ''}</small>
                          </CTableDataCell>
                          <CTableDataCell>{obtenerNombreEspecialidad(cita.specialtyId)}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={obtenerColorEstado(cita.statusId)}>{obtenerNombreEstado(cita.statusId)}</CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={tieneAtencion(cita.id) ? 'success' : 'secondary'}>
                              {tieneAtencion(cita.id) ? 'Iniciada' : 'Sin iniciar'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>{cita.reason || '-'}</CTableDataCell>
                          <CTableDataCell className="text-end">
                            <CButton color="secondary" variant="outline" size="sm" className="me-2 mb-1" onClick={() => verPaciente(cita)}>Ver paciente</CButton>
                            <CButton color="success" variant="outline" size="sm" className="mb-1" disabled={tieneAtencion(cita.id)} onClick={() => abrirModalIniciarAtencion(cita)}>Iniciar atención</CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>

          <CCard className="mb-4">
            <CCardHeader><strong>Pacientes en espera</strong></CCardHeader>
            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>Hora</CTableHeaderCell>
                    <CTableHeaderCell>Paciente</CTableHeaderCell>
                    <CTableHeaderCell>Especialidad</CTableHeaderCell>
                    <CTableHeaderCell>Motivo</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {pacientesEnEspera.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={6} className="text-center">No existen pacientes en espera.</CTableDataCell>
                    </CTableRow>
                  ) : (
                    pacientesEnEspera.map((cita, index) => (
                      <CTableRow key={cita.id}>
                        <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                        <CTableDataCell>{formatearFechaHora(cita.startDate)}</CTableDataCell>
                        <CTableDataCell>{obtenerNombrePaciente(cita.patientId)}</CTableDataCell>
                        <CTableDataCell>{obtenerNombreEspecialidad(cita.specialtyId)}</CTableDataCell>
                        <CTableDataCell>{cita.reason || '-'}</CTableDataCell>
                        <CTableDataCell className="text-end">
                          <CButton color="secondary" variant="outline" size="sm" className="me-2" onClick={() => verPaciente(cita)}>Ver paciente</CButton>
                          <CButton color="success" variant="outline" size="sm" disabled={tieneAtencion(cita.id)} onClick={() => abrirModalIniciarAtencion(cita)}>Iniciar atención</CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>

          <CCard>
            <CCardHeader><strong>Próximas citas</strong></CCardHeader>
            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>Fecha</CTableHeaderCell>
                    <CTableHeaderCell>Paciente</CTableHeaderCell>
                    <CTableHeaderCell>Especialidad</CTableHeaderCell>
                    <CTableHeaderCell>Estado</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {proximasCitas.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={6} className="text-center">No existen próximas citas registradas.</CTableDataCell>
                    </CTableRow>
                  ) : (
                    proximasCitas.map((cita, index) => (
                      <CTableRow key={cita.id}>
                        <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                        <CTableDataCell>{formatearFechaHora(cita.startDate)}</CTableDataCell>
                        <CTableDataCell>{obtenerNombrePaciente(cita.patientId)}</CTableDataCell>
                        <CTableDataCell>{obtenerNombreEspecialidad(cita.specialtyId)}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={obtenerColorEstado(cita.statusId)}>{obtenerNombreEstado(cita.statusId)}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <CButton color="secondary" variant="outline" size="sm" onClick={() => verPaciente(cita)}>Ver paciente</CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCardBody>
      </CCard>

      <CModal visible={visibleIniciarAtencion} onClose={cerrarModalIniciarAtencion} backdrop="static">
        <CModalHeader><CModalTitle>Iniciar atención médica</CModalTitle></CModalHeader>
        <CModalBody>
          {modalError && <CAlert color="danger" dismissible onClose={() => setModalError('')}>{modalError}</CAlert>}
          {selectedAppointment && (
            <CAlert color="info">
              <strong>Paciente:</strong> {obtenerNombrePaciente(selectedAppointment.patientId)} <br />
              <strong>Hora:</strong> {formatearFechaHora(selectedAppointment.startDate)} <br />
              <strong>Especialidad:</strong> {obtenerNombreEspecialidad(selectedAppointment.specialtyId)}
            </CAlert>
          )}
          <CFormLabel>Motivo de consulta</CFormLabel>
          <CFormTextarea rows={4} value={reasonConsultation} onChange={(e) => setReasonConsultation(e.target.value)} placeholder="Ej: Paciente refiere dolor lumbar crónico..." />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModalIniciarAtencion}>Cancelar</CButton>
          <CButton color="success" onClick={iniciarAtencion} disabled={saving}>
            {saving ? <><CSpinner size="sm" className="me-2" />Iniciando...</> : 'Iniciar atención'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default DashboardMedico