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

const AutorizacionAtencionAsistente = () => {
  const navigate = useNavigate()

  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [estados, setEstados] = useState([])

  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().slice(0, 10))
  const [busquedaPaciente, setBusquedaPaciente] = useState('')

  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [authorizationForm, setAuthorizationForm] = useState(initialAuthorizationForm)

  const [visibleAutorizar, setVisibleAutorizar] = useState(false)
  const [visibleDetalle, setVisibleDetalle] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const [page, setPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(5)

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

  const cargarCitas = async () => {
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
      setError(err?.data?.message || err?.message || 'No se pudieron cargar las citas.')
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
    cargarCitas()
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

  const citaEstaConfirmada = (cita) => {
    return obtenerCodigoEstado(cita.statusId) === 'CONFIRMADA'
  }

  const citaEstaEnEspera = (cita) => {
    return obtenerCodigoEstado(cita.statusId) === 'EN_ESPERA'
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
      const patient = obtenerPaciente(cita.patientId)

      const nombre = `${patient?.firstName || ''} ${patient?.lastName || ''}`.toLowerCase()
      const identification = String(patient?.identification || '').toLowerCase()
      const whatsapp = String(patient?.whatsappPhone || '').toLowerCase()

      if (!texto) return true

      return (
        nombre.includes(texto) ||
        identification.includes(texto) ||
        whatsapp.includes(texto)
      )
    })
  }, [citas, pacientes, busquedaPaciente])

  const from = page * itemsPerPage
  const to = Math.min((page + 1) * itemsPerPage, citasFiltradas.length)
  const totalPages = Math.ceil(citasFiltradas.length / itemsPerPage)

  useEffect(() => {
    setPage(0)
  }, [busquedaPaciente, fechaFiltro])

  const buscarCita = async () => {
    await cargarCitas()
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

      setSuccess('Cita marcada en espera correctamente.')
      await cargarCitas()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo marcar la cita en espera.')
    } finally {
      setLoading(false)
    }
  }

  const autorizarAtencion = async () => {
    try {
      if (!selectedAppointment) {
        setModalError('No existe una cita seleccionada.')
        return
      }

      if (!String(authorizationForm.reason || '').trim()) {
        setModalError('Debe ingresar el motivo de autorización.')
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

      await marcarEnEspera(selectedAppointment)

      setSuccess('Atención autorizada correctamente.')
      cerrarAutorizar()
      await cargarCitas()
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo autorizar la atención.')
    } finally {
      setSaving(false)
    }
  }

  // const verPaciente = (cita) => {
  //   navigate(`/pacientes/perfil-paciente/${cita.patientId}`)
  // }

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

            <CCol md={6}>
              <CFormLabel>Buscar cita del paciente</CFormLabel>
              <CFormInput
                value={busquedaPaciente}
                onChange={(e) => setBusquedaPaciente(e.target.value)}
                placeholder="Nombre, identificación o WhatsApp"
              />
            </CCol>

            <CCol md={3} className="d-flex align-items-end">
              <CButton color="primary" variant="outline" className="w-100" onClick={buscarCita}>
                Buscar cita
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
                  <CTableHeaderCell>Fecha</CTableHeaderCell>
                  <CTableHeaderCell>Paciente</CTableHeaderCell>
                  <CTableHeaderCell>Médico</CTableHeaderCell>
                  <CTableHeaderCell>Especialidad</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell>Confirmada</CTableHeaderCell>
                  <CTableHeaderCell>Motivo</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {citasFiltradas.length === 0 ? (
                  <CTableRow><CTableDataCell colSpan={9} className="text-center">No existen citas registradas.</CTableDataCell></CTableRow>
                ) : (
                  citasFiltradas.slice(from, to).map((cita, index) => (
                    <CTableRow key={cita.id}>
                      <CTableHeaderCell>{from + index + 1}</CTableHeaderCell>

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
                        {citaEstaConfirmada(cita) ? (
                          <CBadge color="success">Sí</CBadge>
                        ) : (
                          <CBadge color="secondary">No</CBadge>
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
                          disabled={citaEstaEnEspera(cita)}
                          onClick={() => marcarEnEspera(cita)}
                        >
                          Marcar en espera
                        </CButton>

                        <CButton
                          color="success"
                          variant="outline"
                          size="sm"
                          className="mb-1"
                          onClick={() => abrirAutorizar(cita)}
                        >
                          Autorizar
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
          {citasFiltradas.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <CFormSelect 
                size="sm" 
                style={{ width: '150px' }} 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(0); }}
              >
                <option value={5}>5 por pág</option>
                <option value={10}>10 por pág</option>
                <option value={20}>20 por pág</option>
              </CFormSelect>

              <div>
                <CButton color="secondary" variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="me-2">Anterior</CButton>
                <span className="mx-2">Pág {page + 1} de {totalPages || 1}</span>
                <CButton color="secondary" variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Siguiente</CButton>
              </div>
            </div>
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
            <CAlert color={citaEstaConfirmada(selectedAppointment) ? 'success' : 'warning'}>
              <strong>Paciente:</strong> {obtenerNombrePaciente(selectedAppointment.patientId)}
              <br />
              <strong>Cita:</strong> {formatearFechaHora(selectedAppointment.startDate)}
              <br />
              <strong>Estado:</strong> {obtenerNombreEstado(selectedAppointment.statusId)}
              <br />
              <strong>Confirmada:</strong>{' '}
              {citaEstaConfirmada(selectedAppointment) ? 'Sí' : 'No'}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={12}>
              <CFormLabel>Motivo</CFormLabel>
              <CFormInput
                name="reason"
                value={authorizationForm.reason}
                onChange={handleAuthorizationChange}
                placeholder="Ej: Validando la entidad"
              />
            </CCol>

            <CCol md={12}>
              <CFormLabel>Observación</CFormLabel>
              <CFormTextarea
                rows={4}
                name="observation"
                value={authorizationForm.observation}
                onChange={handleAuthorizationChange}
                placeholder="Ej: de prueba"
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
              'Autorizar'
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
                <strong>Confirmada:</strong>{' '}
                {citaEstaConfirmada(selectedAppointment) ? 'Sí' : 'No'}
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

export default AutorizacionAtencionAsistente
