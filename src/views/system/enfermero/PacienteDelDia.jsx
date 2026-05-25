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
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'

import { appointmentService } from '../../../services/appointmentService'
import { patientService } from '../../../services/patientService'
import { doctorService } from '../../../services/doctorService'
import { specialtyService } from '../../../services/specialtyService'
import { appointmentStatusService } from '../../../services/appointmentStatusService'

const PacienteDelDia = () => {
  const navigate = useNavigate()

  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [estados, setEstados] = useState([])

  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().slice(0, 10))
  const [busqueda, setBusqueda] = useState('')

  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [visibleDetalle, setVisibleDetalle] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      setError(err?.data?.message || err?.message || 'No se pudieron cargar los pacientes del día.')
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

  const formatearFechaHora = (value) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return String(value).replace('T', ' ')
    }

    return date.toLocaleString()
  }

  const formatearHora = (value) => {
    if (!value) return '-'

    const raw = String(value)

    if (raw.includes('T')) return raw.slice(11, 16)
    if (raw.includes(' ')) return raw.slice(11, 16)

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return raw

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const citasFiltradas = useMemo(() => {
    const texto = String(busqueda || '').toLowerCase().trim()

    if (!texto) return citas

    return citas.filter((cita) => {
      const patient = obtenerPaciente(cita.patientId)

      const nombre = `${patient?.firstName || ''} ${patient?.lastName || ''}`.toLowerCase()
      const identification = String(patient?.identification || '').toLowerCase()
      const whatsapp = String(patient?.whatsappPhone || '').toLowerCase()
      const medico = obtenerNombreMedico(cita.doctorId).toLowerCase()
      const especialidad = obtenerNombreEspecialidad(cita.specialtyId).toLowerCase()
      const estado = obtenerNombreEstado(cita.statusId).toLowerCase()

      return (
        nombre.includes(texto) ||
        identification.includes(texto) ||
        whatsapp.includes(texto) ||
        medico.includes(texto) ||
        especialidad.includes(texto) ||
        estado.includes(texto)
      )
    })
  }, [citas, pacientes, medicos, especialidades, estados, busqueda])

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
          <strong>Paciente del Día</strong>

          <CButton color="primary" variant="outline" onClick={cargarCitasDelDia}>
            Actualizar
          </CButton>
        </CCardHeader>

        <CCardBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError('')}>
              {error}
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
              <CFormLabel>Buscar paciente</CFormLabel>
              <CFormInput
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por paciente, identificación, WhatsApp, médico o estado"
              />
            </CCol>

            <CCol md={3} className="d-flex align-items-end">
              <CButton color="primary" className="w-100" onClick={cargarCitasDelDia}>
                Buscar
              </CButton>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={4}>
              <CCard className="text-center">
                <CCardBody>
                  <div className="text-body-secondary">Pacientes del día</div>
                  <h2 className="mb-0">{citas.length}</h2>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={4}>
              <CCard className="text-center">
                <CCardBody>
                  <div className="text-body-secondary">En espera</div>
                  <h2 className="mb-0">
                    {citas.filter((cita) => obtenerCodigoEstado(cita.statusId) === 'EN_ESPERA').length}
                  </h2>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={4}>
              <CCard className="text-center">
                <CCardBody>
                  <div className="text-body-secondary">Confirmadas</div>
                  <h2 className="mb-0">
                    {citas.filter((cita) => obtenerCodigoEstado(cita.statusId) === 'CONFIRMADA').length}
                  </h2>
                </CCardBody>
              </CCard>
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
                  <CTableHeaderCell>WhatsApp</CTableHeaderCell>
                  <CTableHeaderCell>Médico</CTableHeaderCell>
                  <CTableHeaderCell>Especialidad</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell>Motivo</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {citasFiltradas.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center">
                      No existen pacientes registrados para el día seleccionado.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  citasFiltradas.map((cita, index) => {
                    const patient = obtenerPaciente(cita.patientId)

                    return (
                      <CTableRow key={cita.id}>
                        <CTableHeaderCell>{index + 1}</CTableHeaderCell>

                        <CTableDataCell>{formatearHora(cita.startDate)}</CTableDataCell>

                        <CTableDataCell>
                          <div>{obtenerNombrePaciente(cita.patientId)}</div>
                          <small className="text-body-secondary">
                            {patient?.identification || ''}
                          </small>
                        </CTableDataCell>

                        <CTableDataCell>{patient?.whatsappPhone || '-'}</CTableDataCell>

                        <CTableDataCell>{obtenerNombreMedico(cita.doctorId)}</CTableDataCell>

                        <CTableDataCell>{obtenerNombreEspecialidad(cita.specialtyId)}</CTableDataCell>

                        <CTableDataCell>
                          <CBadge color={obtenerColorEstado(cita.statusId)}>
                            {obtenerNombreEstado(cita.statusId)}
                          </CBadge>
                        </CTableDataCell>

                        <CTableDataCell>{cita.reason || '-'}</CTableDataCell>

                        <CTableDataCell className="text-end">
                          <CButton
                            color="secondary"
                            variant="outline"
                            size="sm"
                            className="me-2"
                            onClick={() => verPaciente(cita)}
                          >
                            Ver paciente
                          </CButton>

                          <CButton
                            color="info"
                            variant="outline"
                            size="sm"
                            onClick={() => verCita(cita)}
                          >
                            Ver cita
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

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
                <strong>Identificación:</strong>{' '}
                {obtenerPaciente(selectedAppointment.patientId)?.identification || '-'}
              </p>

              <p>
                <strong>WhatsApp:</strong>{' '}
                {obtenerPaciente(selectedAppointment.patientId)?.whatsappPhone || '-'}
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
                <strong>Origen:</strong> {selectedAppointment.origin || '-'}
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

export default PacienteDelDia
