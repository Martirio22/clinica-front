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
  CFormInput,
  CFormLabel,
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
} from '@coreui/react'

import { appointmentService } from '../../../services/appointmentService'
import { appointmentStatusService } from '../../../services/appointmentStatusService'
import { patientService } from '../../../services/patientService'
import { doctorService } from '../../../services/doctorService'
import { specialtyService } from '../../../services/specialtyService'
import { attendanceAuthorizationService } from '../../../services/attendanceAuthorizationService'

const initialAuthorizationForm = {
  appointmentId: '',
  reason: '',
  observation: '',
}

const AutorizacionAtencion = () => {
  const navigate = useNavigate()

  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [estados, setEstados] = useState([])
  const [autorizaciones, setAutorizaciones] = useState([])

  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().slice(0, 10))
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [soloPendientes, setSoloPendientes] = useState(true)

  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [authorizationForm, setAuthorizationForm] = useState(initialAuthorizationForm)

  const [visibleAutorizar, setVisibleAutorizar] = useState(false)
  const [visibleDetalle, setVisibleDetalle] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarPacientes = async () => {
    try {
      const data = await patientService.listar()
      setPacientes(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los pacientes.')
    }
  }

  const cargarMedicos = async () => {
    try {
      const data = await doctorService.listar()
      setMedicos(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los médicos.')
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

  const cargarAutorizaciones = async () => {
    try {
      const data = await attendanceAuthorizationService.listar()

      console.log('AUTORIZACIONES CARGADAS:', data)

      setAutorizaciones(data || [])
    } catch (err) {
      console.error(err)
      setAutorizaciones([])
    }
  }

  const cargarCitasDelDia = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await appointmentService.listarConFiltros({
        startDate: `${fechaFiltro}T00:00:00`,
        endDate: `${fechaFiltro}T23:59:59`,
      })

      setCitas(data || [])
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudieron cargar las citas del día.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPacientes()
    cargarMedicos()
    cargarEspecialidades()
    cargarEstados()
  }, [])

  useEffect(() => {
    cargarCitasDelDia()
    cargarAutorizaciones()
  }, [fechaFiltro])

  const obtenerPaciente = (patientId) => {
    return pacientes.find((patient) => patient.id === patientId)
  }

  const obtenerNombrePaciente = (patientId) => {
    const patient = obtenerPaciente(patientId)

    if (!patient) return '-'

    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
  }

  const obtenerMedico = (doctorId) => {
    return medicos.find((doctor) => doctor.id === doctorId)
  }

  const obtenerNombreMedico = (doctorId) => {
    const doctor = obtenerMedico(doctorId)

    if (!doctor) return '-'

    if (doctor.user) {
      return `${doctor.user.firstName || ''} ${doctor.user.lastName || ''}`.trim()
    }

    if (doctor.professionalRegistry) {
      return `Médico ${doctor.professionalRegistry}`
    }

    return doctor.name || doctor.userId || '-'
  }

  const obtenerEspecialidad = (specialtyId) => {
    return especialidades.find((specialty) => specialty.id === specialtyId)
  }

  const obtenerNombreEspecialidad = (specialtyId) => {
    const specialty = obtenerEspecialidad(specialtyId)
    return specialty?.name || '-'
  }

  const obtenerEstado = (statusId) => {
    return estados.find((status) => status.id === statusId)
  }

  const obtenerCodigoEstado = (statusId) => {
    const status = obtenerEstado(statusId)
    return String(status?.code || '').toUpperCase()
  }

  const obtenerNombreEstado = (statusId) => {
    const status = obtenerEstado(statusId)
    return status?.name || status?.code || '-'
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

  const buscarEstadoPorCodigo = (code) => {
    return estados.find((status) => String(status.code || '').toUpperCase() === code)
  }

  const tieneAutorizacion = (appointmentId) => {
    return autorizaciones.some((authorization) => {
      const mismaCita = authorization.appointmentId === appointmentId

      const estaAutorizada =
        authorization.isAuthorized === true ||
        authorization.isAuthorized === 'true' ||
        authorization.isAuthorized === 1

      return mismaCita && estaAutorizada && authorization.isActive !== false
    })
  }

  const esPendienteAutorizacion = (cita) => {
    const code = obtenerCodigoEstado(cita.statusId)

    if (tieneAutorizacion(cita.id)) return false

    return ['RESERVADA', 'CONFIRMADA'].includes(code)
  }

  const formatearFechaHora = (value) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return String(value).replace('T', ' ')
    }

    return date.toLocaleString()
  }

  const citasFiltradas = useMemo(() => {
    const texto = String(busquedaPaciente || '').toLowerCase().trim()

    return citas.filter((cita) => {
      const paciente = obtenerPaciente(cita.patientId)

      const nombre = `${paciente?.firstName || ''} ${paciente?.lastName || ''}`.toLowerCase()
      const identificacion = String(paciente?.identification || '').toLowerCase()
      const whatsapp = String(paciente?.whatsappPhone || '').toLowerCase()

      const cumplePaciente =
        !texto ||
        nombre.includes(texto) ||
        identificacion.includes(texto) ||
        whatsapp.includes(texto)

      const cumplePendiente = !soloPendientes || esPendienteAutorizacion(cita)

      return cumplePaciente && cumplePendiente
    })
  }, [citas, busquedaPaciente, soloPendientes, pacientes, estados, autorizaciones])

  const buscarCita = async () => {
    await cargarCitasDelDia()
    await cargarAutorizaciones()
  }

  const abrirAutorizar = (cita) => {
    setSelectedAppointment(cita)
    setAuthorizationForm({
      appointmentId: cita.id,
      reason: '',
      observation: '',
    })
    setModalError('')
    setVisibleAutorizar(true)
  }

  const cerrarAutorizar = () => {
    setVisibleAutorizar(false)
    setSelectedAppointment(null)
    setAuthorizationForm(initialAuthorizationForm)
    setModalError('')
  }

  const handleAuthorizationChange = (e) => {
    const { name, value } = e.target

    setAuthorizationForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const marcarEnEspera = async (cita) => {
    const estadoEnEspera = buscarEstadoPorCodigo('EN_ESPERA')

    if (!estadoEnEspera) {
      setError('No existe el estado EN_ESPERA. Debes crearlo en Estados de Cita.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await appointmentService.actualizar(cita.id, {
        statusId: estadoEnEspera.id,
      })

      setSuccess('Paciente marcado en espera correctamente.')
      await cargarCitasDelDia()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo marcar la cita en espera.')
    } finally {
      setLoading(false)
    }
  }

  const autorizarAtencion = async () => {
    try {
      if (!String(authorizationForm.reason || '').trim()) {
        setModalError('Debe ingresar el motivo de autorización.')
        return
      }

      if (!selectedAppointment) {
        setModalError('No existe una cita seleccionada.')
        return
      }

      setSaving(true)
      setModalError('')
      setError('')
      setSuccess('')

      const payload = {
        appointmentId: selectedAppointment.id,
        reason: String(authorizationForm.reason || '').trim(),
        observation: String(authorizationForm.observation || '').trim() || null,
      }

      await attendanceAuthorizationService.crear(payload)

      setSuccess('Atención autorizada correctamente.')
      cerrarAutorizar()

      await cargarAutorizaciones()
      await cargarCitasDelDia()
    } catch (err) {
      console.error(err)

      const message = err?.data?.message || err?.message || 'No se pudo autorizar la atención.'

      setModalError(message)

      if (err?.status === 409 || err?.data?.status === 409) {
        await cargarAutorizaciones()
        await cargarCitasDelDia()
      }
    } finally {
      setSaving(false)
    }
  }

  const verPaciente = (cita) => {
    navigate(`/pacientes/perfil-paciente/${cita.patientId}`)
  }

  const verCita = (cita) => {
    setSelectedAppointment(cita)
    setVisibleDetalle(true)
  }

  const cerrarDetalle = () => {
    setVisibleDetalle(false)
    setSelectedAppointment(null)
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Autorización de Atención</strong>

          <CButton color="primary" onClick={buscarCita}>
            Buscar cita
          </CButton>
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

          <CRow className="mb-3 g-3">
            <CCol md={3}>
              <CFormLabel>Fecha</CFormLabel>
              <CFormInput
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
              />
            </CCol>

            <CCol md={5}>
              <CFormLabel>Buscar cita por paciente</CFormLabel>
              <CFormInput
                value={busquedaPaciente}
                onChange={(e) => setBusquedaPaciente(e.target.value)}
                placeholder="Nombre, identificación o WhatsApp"
              />
            </CCol>

            <CCol md={4} className="d-flex align-items-end">
              <CButton
                color={soloPendientes ? 'warning' : 'secondary'}
                variant="outline"
                className="w-100"
                onClick={() => setSoloPendientes((prev) => !prev)}
              >
                {soloPendientes ? 'Mostrando pendientes de autorización' : 'Mostrar solo pendientes'}
              </CButton>
            </CCol>
          </CRow>

          {loading ? (
            <div className="text-center my-4">
              <CSpinner color="primary" />
            </div>
          ) : (
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Hora</CTableHeaderCell>
                  <CTableHeaderCell>Paciente</CTableHeaderCell>
                  <CTableHeaderCell>Médico</CTableHeaderCell>
                  <CTableHeaderCell>Especialidad</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell>Autorización</CTableHeaderCell>
                  <CTableHeaderCell>Motivo</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {citasFiltradas.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center">
                      No existen citas pendientes de autorización para los filtros seleccionados.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  citasFiltradas.map((cita, index) => (
                    <CTableRow key={cita.id}>
                      <CTableHeaderCell>{index + 1}</CTableHeaderCell>

                      <CTableDataCell>{formatearFechaHora(cita.startDate)}</CTableDataCell>

                      <CTableDataCell>
                        <div>{obtenerNombrePaciente(cita.patientId)}</div>
                        <small className="text-body-secondary">
                          {obtenerPaciente(cita.patientId)?.identification || ''}
                        </small>
                      </CTableDataCell>

                      <CTableDataCell>{obtenerNombreMedico(cita.doctorId)}</CTableDataCell>

                      <CTableDataCell>{obtenerNombreEspecialidad(cita.specialtyId)}</CTableDataCell>

                      <CTableDataCell>
                        <CBadge color={obtenerColorEstado(cita.statusId)}>
                          {obtenerNombreEstado(cita.statusId)}
                        </CBadge>
                      </CTableDataCell>

                      <CTableDataCell>
                        {tieneAutorizacion(cita.id) ? (
                          <CBadge color="success">Autorizada</CBadge>
                        ) : (
                          <CBadge color="warning">Pendiente</CBadge>
                        )}
                      </CTableDataCell>

                      <CTableDataCell>{cita.reason || '-'}</CTableDataCell>

                      <CTableDataCell className="text-end">
                        <CButton
                          color="info"
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => verCita(cita)}
                        >
                          Ver cita
                        </CButton>

                        {/* <CButton
                          color="secondary"
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => verPaciente(cita)}
                        >
                          Ver paciente
                        </CButton> */}

                        <CButton
                          color="warning"
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => marcarEnEspera(cita)}
                        >
                          Marcar en espera
                        </CButton>

                        <CButton
                          color="success"
                          variant="outline"
                          size="sm"
                          className="mb-1"
                          disabled={tieneAutorizacion(cita.id)}
                          onClick={() => abrirAutorizar(cita)}
                        >
                          Autorizar atención
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={visibleAutorizar} onClose={cerrarAutorizar} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>Autorizar atención</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          {selectedAppointment && (
            <CAlert color="info">
              <strong>Paciente:</strong> {obtenerNombrePaciente(selectedAppointment.patientId)} <br />
              <strong>Cita:</strong> {formatearFechaHora(selectedAppointment.startDate)} <br />
              <strong>Médico:</strong> {obtenerNombreMedico(selectedAppointment.doctorId)}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={12}>
              <CFormLabel>Motivo de autorización</CFormLabel>
              <CFormInput
                name="reason"
                value={authorizationForm.reason}
                onChange={handleAuthorizationChange}
                placeholder="Ej: Paciente llegó a la clínica y se valida atención"
              />
            </CCol>

            <CCol md={12}>
              <CFormLabel>Observación</CFormLabel>
              <CFormTextarea
                rows={4}
                name="observation"
                value={authorizationForm.observation}
                onChange={handleAuthorizationChange}
                placeholder="Ej: Paciente presenta documentos, pago validado, etc."
              />
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarAutorizar}>
            Cancelar
          </CButton>

          <CButton color="success" onClick={autorizarAtencion} disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Autorizando...
              </>
            ) : (
              'Autorizar atención'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={visibleDetalle} onClose={cerrarDetalle} size="lg">
        <CModalHeader>
          <CModalTitle>Detalle de cita</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {selectedAppointment && (
            <>
              <p>
                <strong>Paciente:</strong> {obtenerNombrePaciente(selectedAppointment.patientId)}
              </p>
              <p>
                <strong>Médico:</strong> {obtenerNombreMedico(selectedAppointment.doctorId)}
              </p>
              <p>
                <strong>Especialidad:</strong>{' '}
                {obtenerNombreEspecialidad(selectedAppointment.specialtyId)}
              </p>
              <p>
                <strong>Fecha:</strong> {formatearFechaHora(selectedAppointment.startDate)}
              </p>
              <p>
                <strong>Estado:</strong> {obtenerNombreEstado(selectedAppointment.statusId)}
              </p>
              <p>
                <strong>Motivo:</strong> {selectedAppointment.reason || '-'}
              </p>
              <p>
                <strong>Observación:</strong> {selectedAppointment.observation || '-'}
              </p>
            </>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarDetalle}>
            Cerrar
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default AutorizacionAtencion
