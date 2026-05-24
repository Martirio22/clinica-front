import React, { useEffect, useMemo, useState } from 'react'
import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
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
  CBadge,
  CAlert,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'

import { appointmentService } from '../../../services/appointmentService'
import { attendanceAuthorizationService } from '../../../services/attendanceAuthorizationService'
import { medicalAttentionService } from '../../../services/medicalAttentionService'
import { scheduleBlockService } from '../../../services/scheduleBlockService'
import { scheduleBlockTypeService } from '../../../services/scheduleBlockTypeService'
import { attentionStatusService } from '../../../services/attentionStatusService'

const MiCalendario = () => {
  const navigate = useNavigate()

  const [vista, setVista] = useState('day')
  const [fechaActual, setFechaActual] = useState(new Date())

  const [citas, setCitas] = useState([])
  const [bloqueos, setBloqueos] = useState([])
  const [tiposBloqueo, setTiposBloqueo] = useState([])
  const [estadosAtencion, setEstadosAtencion] = useState([])

  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)

  const [modalCita, setModalCita] = useState(false)
  const [citaSeleccionada, setCitaSeleccionada] = useState(null)
  const [autorizacionCita, setAutorizacionCita] = useState(null)

  const [modalBloqueo, setModalBloqueo] = useState(false)
  const [formBloqueo, setFormBloqueo] = useState({
    doctorId: '',
    blockingTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  })

  const doctorIdActual =
    localStorage.getItem('doctorId') ||
    localStorage.getItem('currentDoctorId') ||
    localStorage.getItem('medicoId') ||
    ''

  const formatDateInput = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hour}:${minutes}`
  }

  const obtenerRangoVista = () => {
    const fecha = new Date(fechaActual)

    if (vista === 'day') {
      const start = new Date(fecha)
      start.setHours(0, 0, 0, 0)

      const end = new Date(fecha)
      end.setHours(23, 59, 59, 999)

      return { start, end }
    }

    if (vista === 'week') {
      const day = fecha.getDay()
      const diff = day === 0 ? -6 : 1 - day

      const start = new Date(fecha)
      start.setDate(fecha.getDate() + diff)
      start.setHours(0, 0, 0, 0)

      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)

      return { start, end }
    }

    const start = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
    start.setHours(0, 0, 0, 0)

    const end = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }

  const rangoVista = useMemo(() => obtenerRangoVista(), [fechaActual, vista])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)
      setMensaje(null)

      const filters = {
        startDate: rangoVista.start.toISOString(),
        endDate: rangoVista.end.toISOString(),
      }

      if (doctorIdActual) {
        filters.doctorId = doctorIdActual
      }

      const [citasData, tiposData, estadosData] = await Promise.all([
        appointmentService.listarConFiltros(filters),
        scheduleBlockTypeService.listar(),
        attentionStatusService.listar(),
      ])

      setCitas(citasData || [])
      setTiposBloqueo(tiposData || [])
      setEstadosAtencion(estadosData || [])

      if (doctorIdActual) {
        const bloqueosData = await scheduleBlockService.listarPorDoctor(doctorIdActual)
        setBloqueos(bloqueosData || [])
      } else {
        setBloqueos([])
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al cargar el calendario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [vista, fechaActual])

  const cambiarFecha = (direction) => {
    const nuevaFecha = new Date(fechaActual)

    if (vista === 'day') {
      nuevaFecha.setDate(nuevaFecha.getDate() + direction)
    }

    if (vista === 'week') {
      nuevaFecha.setDate(nuevaFecha.getDate() + direction * 7)
    }

    if (vista === 'month') {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + direction)
    }

    setFechaActual(nuevaFecha)
  }

  const irHoy = () => {
    setFechaActual(new Date())
  }

  const abrirDetalleCita = async (cita) => {
    try {
      setCitaSeleccionada(cita)
      setAutorizacionCita(null)
      setModalCita(true)

      const autorizaciones = await attendanceAuthorizationService.listarConFiltros({
        appointmentId: cita.id,
      })

      const autorizacion = Array.isArray(autorizaciones) ? autorizaciones[0] : null
      setAutorizacionCita(autorizacion || null)
    } catch (err) {
      console.error(err)
      setAutorizacionCita(null)
    }
  }

  const iniciarAtencion = async (cita = citaSeleccionada) => {
    if (!cita) return

    try {
      setLoading(true)
      setError(null)
      setMensaje(null)

      const estadoInicial =
        estadosAtencion.find((x) => x.code === 'EN_CURSO') ||
        estadosAtencion.find((x) => x.code === 'INICIADA') ||
        estadosAtencion.find((x) => x.code === 'ABIERTA') ||
        estadosAtencion.find((x) => x.isActive) ||
        estadosAtencion[0]

      if (!estadoInicial) {
        setError('No existe un estado de atención disponible para iniciar la atención')
        return
      }

      await medicalAttentionService.iniciar({
        appointmentId: cita.id,
        patientId: cita.patientId,
        doctorId: cita.doctorId,
        statusAttentionId: estadoInicial.id,
        reasonConsultation: cita.reason || '',
        observations: 'Atención iniciada desde Mi Calendario',
      })

      setMensaje('Atención iniciada correctamente')
      setModalCita(false)
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo iniciar la atención')
    } finally {
      setLoading(false)
    }
  }

  const abrirModalBloqueo = (cita = null) => {
    const inicio = cita?.startDate ? new Date(cita.startDate) : new Date()
    const fin = cita?.endDate ? new Date(cita.endDate) : new Date(inicio.getTime() + 30 * 60000)

    setFormBloqueo({
      doctorId: cita?.doctorId || doctorIdActual || '',
      blockingTypeId: '',
      startDate: formatDateTimeLocal(inicio),
      endDate: formatDateTimeLocal(fin),
      reason: '',
    })

    setModalBloqueo(true)
  }

  const guardarBloqueo = async () => {
    try {
      setLoading(true)
      setError(null)
      setMensaje(null)

      if (!formBloqueo.doctorId) {
        setError('Debe seleccionar o tener asignado un médico')
        return
      }

      if (!formBloqueo.blockingTypeId) {
        setError('Debe seleccionar un tipo de bloqueo')
        return
      }

      await scheduleBlockService.crear({
        doctorId: formBloqueo.doctorId,
        blockingTypeId: formBloqueo.blockingTypeId,
        startDate: formBloqueo.startDate,
        endDate: formBloqueo.endDate,
        reason: formBloqueo.reason,
      })

      setMensaje('Bloqueo creado correctamente')
      setModalBloqueo(false)
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo crear el bloqueo')
    } finally {
      setLoading(false)
    }
  }

  const registrarAusencia = async (cita) => {
    try {
      setLoading(true)
      setError(null)
      setMensaje(null)

      const tipoAusencia =
        tiposBloqueo.find((x) => x.code === 'AUSENCIA') ||
        tiposBloqueo.find((x) => x.code === 'NO_ASISTE') ||
        tiposBloqueo.find((x) => x.name?.toLowerCase().includes('ausencia'))

      if (!tipoAusencia) {
        setError('No existe un tipo de bloqueo con código AUSENCIA o nombre Ausencia')
        return
      }

      await scheduleBlockService.crear({
        doctorId: cita.doctorId,
        blockingTypeId: tipoAusencia.id,
        startDate: cita.startDate,
        endDate: cita.endDate,
        reason: `Ausencia registrada para la cita ${cita.id}`,
      })

      setMensaje('Ausencia registrada correctamente')
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo registrar la ausencia')
    } finally {
      setLoading(false)
    }
  }

  const cancelarBloqueo = async (bloqueoId) => {
    const confirmar = window.confirm('¿Seguro que deseas cancelar este bloqueo?')
    if (!confirmar) return

    try {
      setLoading(true)
      setError(null)
      setMensaje(null)

      await scheduleBlockService.eliminar(bloqueoId)

      setMensaje('Bloqueo cancelado correctamente')
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo cancelar el bloqueo')
    } finally {
      setLoading(false)
    }
  }

  const verPaciente = (patientId) => {
    if (!patientId) return

    navigate(`/pacientes/perfil/${patientId}`)
  }

  const getNombrePaciente = (cita) => {
    if (cita?.patient) {
      return `${cita.patient.firstName || ''} ${cita.patient.lastName || ''}`.trim()
    }

    return cita?.patientName || 'Paciente'
  }

  const getNombreDoctor = (cita) => {
    if (cita?.doctor?.user) {
      return `${cita.doctor.user.firstName || ''} ${cita.doctor.user.lastName || ''}`.trim()
    }

    if (cita?.doctorName) return cita.doctorName

    return 'Médico'
  }

  const getNombreEstado = (cita) => {
    return cita?.status?.name || cita?.statusName || 'Sin estado'
  }

  const formatHora = (dateValue) => {
    if (!dateValue) return '-'

    const date = new Date(dateValue)

    return date.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFecha = (dateValue) => {
    if (!dateValue) return '-'

    const date = new Date(dateValue)

    return date.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const citasDelDia = (date) => {
    const fecha = formatDateInput(date)

    return citas.filter((cita) => {
      const citaFecha = formatDateInput(new Date(cita.startDate))
      return citaFecha === fecha
    })
  }

  const bloqueosDelDia = (date) => {
    const fecha = formatDateInput(date)

    return bloqueos.filter((bloqueo) => {
      const bloqueoFecha = formatDateInput(new Date(bloqueo.startDate))
      return bloqueoFecha === fecha
    })
  }

  const diasSemana = useMemo(() => {
    const start = new Date(rangoVista.start)

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }, [rangoVista])

  const diasMes = useMemo(() => {
    const year = fechaActual.getFullYear()
    const month = fechaActual.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const start = new Date(firstDay)
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diff)

    const totalDays = 42

    return Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return {
        date,
        currentMonth: date.getMonth() === month,
      }
    })
  }, [fechaActual])

  const renderCitaCard = (cita) => (
    <div key={cita.id} className="border rounded p-2 mb-2 bg-white">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <strong>{formatHora(cita.startDate)} - {formatHora(cita.endDate)}</strong>
          <div>{getNombrePaciente(cita)}</div>
          <small className="text-body-secondary">{cita.reason || 'Sin motivo registrado'}</small>
        </div>

        <CBadge color="info">{getNombreEstado(cita)}</CBadge>
      </div>

      <div className="d-flex flex-wrap gap-2 mt-2">
        <CButton size="sm" color="primary" variant="outline" onClick={() => abrirDetalleCita(cita)}>
          Ver cita
        </CButton>

        <CButton
          size="sm"
          color="success"
          variant="outline"
          onClick={() => navigate(`/medico/atencion-medica/${cita.id}`)}
        >
          Iniciar atención
        </CButton>

        <CButton size="sm" color="warning" variant="outline" onClick={() => abrirModalBloqueo(cita)}>
          Bloquear horario
        </CButton>

        <CButton size="sm" color="danger" variant="outline" onClick={() => registrarAusencia(cita)}>
          Registrar ausencia
        </CButton>

        <CButton size="sm" color="secondary" variant="outline" onClick={() => verPaciente(cita.patientId)}>
          Ver paciente
        </CButton>
      </div>
    </div>
  )

  const renderBloqueoCard = (bloqueo) => (
    <div key={bloqueo.id} className="border rounded p-2 mb-2 bg-light">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <strong>{formatHora(bloqueo.startDate)} - {formatHora(bloqueo.endDate)}</strong>
          <div>{bloqueo.blockingType?.name || bloqueo.blockingTypeName || 'Bloqueo'}</div>
          <small className="text-body-secondary">{bloqueo.reason || 'Sin motivo'}</small>
        </div>

        <CButton size="sm" color="danger" variant="outline" onClick={() => cancelarBloqueo(bloqueo.id)}>
          Cancelar bloqueo
        </CButton>
      </div>
    </div>
  )

  const renderVistaDia = () => {
    const citasDia = citasDelDia(fechaActual)
    const bloqueosDia = bloqueosDelDia(fechaActual)

    return (
      <CCard>
        <CCardHeader>
          <strong>{fechaActual.toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
        </CCardHeader>
        <CCardBody>
          {citasDia.length === 0 && bloqueosDia.length === 0 && (
            <div className="text-body-secondary">No hay citas ni bloqueos para este día.</div>
          )}

          {bloqueosDia.length > 0 && (
            <>
              <h6>Bloqueos</h6>
              {bloqueosDia.map(renderBloqueoCard)}
            </>
          )}

          {citasDia.length > 0 && (
            <>
              <h6 className="mt-3">Citas</h6>
              {citasDia.map(renderCitaCard)}
            </>
          )}
        </CCardBody>
      </CCard>
    )
  }

  const renderVistaSemana = () => (
    <CRow>
      {diasSemana.map((dia) => {
        const citasDia = citasDelDia(dia)
        const bloqueosDia = bloqueosDelDia(dia)

        return (
          <CCol xs={12} md={6} xl={4} className="mb-3" key={dia.toISOString()}>
            <CCard className="h-100">
              <CCardHeader>
                <strong>{dia.toLocaleDateString('es-EC', { weekday: 'long' })}</strong>
                <div className="small text-body-secondary">{formatFecha(dia)}</div>
              </CCardHeader>
              <CCardBody>
                {citasDia.length === 0 && bloqueosDia.length === 0 && (
                  <div className="text-body-secondary small">Sin registros</div>
                )}

                {bloqueosDia.map(renderBloqueoCard)}
                {citasDia.map(renderCitaCard)}
              </CCardBody>
            </CCard>
          </CCol>
        )
      })}
    </CRow>
  )

  const renderVistaMes = () => (
    <div className="border rounded overflow-hidden">
      <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
          <div key={dia} className="p-2 border bg-light text-center fw-bold">
            {dia}
          </div>
        ))}

        {diasMes.map(({ date, currentMonth }) => {
          const citasDia = citasDelDia(date)
          const bloqueosDia = bloqueosDelDia(date)

          return (
            <div
              key={date.toISOString()}
              className={`p-2 border ${currentMonth ? 'bg-white' : 'bg-light text-body-secondary'}`}
              style={{ minHeight: 130 }}
            >
              <div className="d-flex justify-content-between">
                <strong>{date.getDate()}</strong>

                {(citasDia.length > 0 || bloqueosDia.length > 0) && (
                  <CBadge color="primary">
                    {citasDia.length + bloqueosDia.length}
                  </CBadge>
                )}
              </div>

              <div className="mt-2">
                {bloqueosDia.slice(0, 2).map((bloqueo) => (
                  <div key={bloqueo.id} className="small text-warning">
                    {formatHora(bloqueo.startDate)} Bloqueo
                  </div>
                ))}

                {citasDia.slice(0, 3).map((cita) => (
                  <button
                    key={cita.id}
                    type="button"
                    className="btn btn-link btn-sm p-0 d-block text-start"
                    onClick={() => abrirDetalleCita(cita)}
                  >
                    {formatHora(cita.startDate)} {getNombrePaciente(cita)}
                  </button>
                ))}

                {citasDia.length + bloqueosDia.length > 3 && (
                  <small className="text-body-secondary">
                    +{citasDia.length + bloqueosDia.length - 3} más
                  </small>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h5 className="mb-0">Mi Calendario</h5>
            <small className="text-body-secondary">Citas, autorizaciones, bloqueos y atención médica</small>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <CButton color="secondary" variant="outline" onClick={() => cambiarFecha(-1)}>
              Anterior
            </CButton>

            <CButton color="secondary" variant="outline" onClick={irHoy}>
              Hoy
            </CButton>

            <CButton color="secondary" variant="outline" onClick={() => cambiarFecha(1)}>
              Siguiente
            </CButton>

            <CButton color="warning" onClick={() => abrirModalBloqueo()}>
              Bloquear horario
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError(null)}>
              {error}
            </CAlert>
          )}

          {mensaje && (
            <CAlert color="success" dismissible onClose={() => setMensaje(null)}>
              {mensaje}
            </CAlert>
          )}

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <CButtonGroup>
              <CButton color={vista === 'day' ? 'primary' : 'secondary'} variant={vista === 'day' ? undefined : 'outline'} onClick={() => setVista('day')}>
                Día
              </CButton>
              <CButton color={vista === 'week' ? 'primary' : 'secondary'} variant={vista === 'week' ? undefined : 'outline'} onClick={() => setVista('week')}>
                Semana
              </CButton>
              <CButton color={vista === 'month' ? 'primary' : 'secondary'} variant={vista === 'month' ? undefined : 'outline'} onClick={() => setVista('month')}>
                Mes
              </CButton>
            </CButtonGroup>

            <div className="fw-bold">
              {vista === 'month'
                ? fechaActual.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
                : `${formatFecha(rangoVista.start)} - ${formatFecha(rangoVista.end)}`}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <CSpinner />
              <div className="mt-2">Cargando calendario...</div>
            </div>
          ) : (
            <>
              {vista === 'day' && renderVistaDia()}
              {vista === 'week' && renderVistaSemana()}
              {vista === 'month' && renderVistaMes()}
            </>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={modalCita} onClose={() => setModalCita(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Detalle de cita</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {citaSeleccionada && (
            <>
              <CRow className="mb-3">
                <CCol md={6}>
                  <strong>Paciente:</strong>
                  <div>{getNombrePaciente(citaSeleccionada)}</div>
                </CCol>

                <CCol md={6}>
                  <strong>Médico:</strong>
                  <div>{getNombreDoctor(citaSeleccionada)}</div>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <strong>Fecha:</strong>
                  <div>{formatFecha(citaSeleccionada.startDate)}</div>
                </CCol>

                <CCol md={6}>
                  <strong>Horario:</strong>
                  <div>{formatHora(citaSeleccionada.startDate)} - {formatHora(citaSeleccionada.endDate)}</div>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <strong>Estado:</strong>
                  <div>
                    <CBadge color="info">{getNombreEstado(citaSeleccionada)}</CBadge>
                  </div>
                </CCol>

                <CCol md={6}>
                  <strong>Autorización:</strong>
                  <div>
                    {autorizacionCita?.isAuthorized ? (
                      <CBadge color="success">Paciente autorizado</CBadge>
                    ) : (
                      <CBadge color="warning">No autorizado / pendiente</CBadge>
                    )}
                  </div>
                </CCol>
              </CRow>

              <div className="mb-3">
                <strong>Motivo:</strong>
                <div>{citaSeleccionada.reason || 'Sin motivo registrado'}</div>
              </div>

              <div className="mb-3">
                <strong>Observación:</strong>
                <div>{citaSeleccionada.observation || 'Sin observaciones'}</div>
              </div>

              {autorizacionCita && (
                <div className="border rounded p-3 bg-light">
                  <strong>Detalle de autorización</strong>
                  <div>Motivo: {autorizacionCita.reason || '-'}</div>
                  <div>Observación: {autorizacionCita.observation || '-'}</div>
                  <div>Fecha: {autorizacionCita.authorizationDate ? formatFecha(autorizacionCita.authorizationDate) : '-'}</div>
                </div>
              )}
            </>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setModalCita(false)}>
            Cerrar
          </CButton>

          <CButton color="secondary" onClick={() => verPaciente(citaSeleccionada?.patientId)}>
            Ver paciente
          </CButton>

          <CButton color="warning" onClick={() => abrirModalBloqueo(citaSeleccionada)}>
            Bloquear horario
          </CButton>

          <CButton
            color="success"
            onClick={() => navigate(`/medico/atencion-medica/${citaSeleccionada.id}`)}
          >
            Iniciar atención
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={modalBloqueo} onClose={() => setModalBloqueo(false)}>
        <CModalHeader>
          <CModalTitle>Bloquear horario</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel>Médico</CFormLabel>
              <CFormInput
                value={formBloqueo.doctorId}
                onChange={(e) => setFormBloqueo({ ...formBloqueo, doctorId: e.target.value })}
                placeholder="ID del médico"
              />
            </div>

            <div className="mb-3">
              <CFormLabel>Tipo de bloqueo</CFormLabel>
              <CFormSelect
                value={formBloqueo.blockingTypeId}
                onChange={(e) => setFormBloqueo({ ...formBloqueo, blockingTypeId: e.target.value })}
              >
                <option value="">Seleccione...</option>
                {tiposBloqueo.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.name}
                  </option>
                ))}
              </CFormSelect>
            </div>

            <div className="mb-3">
              <CFormLabel>Fecha inicio</CFormLabel>
              <CFormInput
                type="datetime-local"
                value={formBloqueo.startDate}
                onChange={(e) => setFormBloqueo({ ...formBloqueo, startDate: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <CFormLabel>Fecha fin</CFormLabel>
              <CFormInput
                type="datetime-local"
                value={formBloqueo.endDate}
                onChange={(e) => setFormBloqueo({ ...formBloqueo, endDate: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <CFormLabel>Motivo</CFormLabel>
              <CFormTextarea
                rows={3}
                value={formBloqueo.reason}
                onChange={(e) => setFormBloqueo({ ...formBloqueo, reason: e.target.value })}
                placeholder="Motivo del bloqueo"
              />
            </div>
          </CForm>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setModalBloqueo(false)}>
            Cancelar
          </CButton>

          <CButton color="warning" onClick={guardarBloqueo}>
            Guardar bloqueo
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default MiCalendario
