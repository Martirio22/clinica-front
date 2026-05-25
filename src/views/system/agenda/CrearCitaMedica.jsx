import React, { useEffect, useMemo, useState } from 'react'
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
import { patientService } from '../../../services/patientService'
import { specialtyService } from '../../../services/specialtyService'
import { doctorService } from '../../../services/doctorService'
import { branchService } from '../../../services/branchService'
import { officeService } from '../../../services/officeService'

const initialPatientForm = {
  identificationType: 'CEDULA',
  identification: '',
  firstName: '',
  lastName: '',
  birthDate: '',
  gender: 'FEMENINO',
  email: '',
  whatsappPhone: '',
  address: '',
}

const initialAppointmentForm = {
  patientId: '',
  specialtyId: '',
  doctorId: '',
  branchId: '',
  officeId: '',
  fecha: '',
  startDate: '',
  endDate: '',
  reason: '',
  observation: '',
}

const CrearCitaMedica = () => {
  const [pacientes, setPacientes] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [medicos, setMedicos] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [consultorios, setConsultorios] = useState([])

  const [appointmentForm, setAppointmentForm] = useState(initialAppointmentForm)
  const [patientForm, setPatientForm] = useState(initialPatientForm)

  const [searchPaciente, setSearchPaciente] = useState('')
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)

  const [disponibilidad, setDisponibilidad] = useState(null)
  const [slotSeleccionado, setSlotSeleccionado] = useState(null)
  const [citaCreada, setCitaCreada] = useState(null)

  const [visiblePacienteModal, setVisiblePacienteModal] = useState(false)

  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalError, setModalError] = useState('')

  const [visibleConfirmacion, setVisibleConfirmacion] = useState(false)
  const [resumenConfirmacion, setResumenConfirmacion] = useState(null)

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

  const cargarMedicos = async () => {
    try {
      const data = await doctorService.listar()
      setMedicos(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los médicos.')
    }
  }

  const cargarSucursales = async () => {
    try {
      const data = await branchService.listar()
      setSucursales(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar las sucursales.')
    }
  }

  const cargarConsultorios = async () => {
    try {
      const data = await officeService.listar()
      setConsultorios(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los consultorios.')
    }
  }

  useEffect(() => {
    cargarPacientes()
    cargarEspecialidades()
    cargarMedicos()
    cargarSucursales()
    cargarConsultorios()
  }, [])

  const pacientesFiltrados = useMemo(() => {
    const texto = String(searchPaciente || '').toLowerCase().trim()

    if (!texto) return []

    return pacientes.filter((patient) => {
      const nombre = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase()
      const identification = String(patient.identification || '').toLowerCase()
      const whatsapp = String(patient.whatsappPhone || '').toLowerCase()
      const email = String(patient.email || '').toLowerCase()

      return (
        nombre.includes(texto) ||
        identification.includes(texto) ||
        whatsapp.includes(texto) ||
        email.includes(texto)
      )
    })
  }, [pacientes, searchPaciente])

  const medicosFiltrados = useMemo(() => {
    if (!appointmentForm.specialtyId) return medicos

    return medicos.filter((doctor) => doctor.specialtyId === appointmentForm.specialtyId)
  }, [medicos, appointmentForm.specialtyId])

  const obtenerNombrePaciente = (patient) => {
    if (!patient) return '-'
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
  }

  const obtenerNombreMedico = (doctorId) => {
    const doctor = medicos.find((item) => item.id === doctorId)

    if (!doctor) return '-'

    if (doctor.user) {
      return `${doctor.user.firstName || ''} ${doctor.user.lastName || ''}`.trim()
    }

    if (doctor.professionalRegistry) {
      return `Médico ${doctor.professionalRegistry}`
    }

    return doctor.name || doctor.userId || '-'
  }

  const obtenerNombreEspecialidad = (specialtyId) => {
    const specialty = especialidades.find((item) => item.id === specialtyId)
    return specialty?.name || '-'
  }

  const obtenerNombreSucursal = (branchId) => {
    const branch = sucursales.find((item) => item.id === branchId)
    return branch ? `${branch.name} - ${branch.city}` : '-'
  }

  const obtenerNombreConsultorio = (officeId) => {
    const office = consultorios.find((item) => item.id === officeId)
    return office ? `${office.code} - ${office.name}` : '-'
  }

  const convertirFechaBackend = (value) => {
    if (!value) return ''

    const fecha = String(value).trim().replace(' ', 'T')

    if (fecha.endsWith('-05:00')) return fecha
    if (fecha.includes('-05:00')) return fecha

    return `${fecha}-05:00`
  }

  const handleAppointmentChange = (e) => {
    const { name, value } = e.target

    setAppointmentForm((prev) => {
      const next = {
        ...prev,
        [name]: value,
      }

      if (name === 'specialtyId') {
        next.doctorId = ''
        next.branchId = ''
        next.officeId = ''
        next.startDate = ''
        next.endDate = ''
      }

      if (name === 'doctorId' || name === 'fecha') {
        next.branchId = ''
        next.officeId = ''
        next.startDate = ''
        next.endDate = ''
      }

      return next
    })

    if (name === 'specialtyId' || name === 'doctorId' || name === 'fecha') {
      setDisponibilidad(null)
      setSlotSeleccionado(null)
      setCitaCreada(null)
    }
  }

  const handlePatientChange = (e) => {
    const { name, value } = e.target

    setPatientForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const seleccionarPaciente = (patient) => {
    setPacienteSeleccionado(patient)

    setAppointmentForm((prev) => ({
      ...prev,
      patientId: patient.id,
    }))

    setSearchPaciente('')
    setSuccess(`Paciente seleccionado: ${obtenerNombrePaciente(patient)}`)
  }

  const abrirModalCrearPaciente = () => {
    setPatientForm(initialPatientForm)
    setModalError('')
    setVisiblePacienteModal(true)
  }

  const cerrarModalCrearPaciente = () => {
    setVisiblePacienteModal(false)
    setPatientForm(initialPatientForm)
    setModalError('')
  }

  const validarPacienteRapido = () => {
    if (!String(patientForm.identification || '').trim()) return 'La identificación es requerida.'
    if (!String(patientForm.firstName || '').trim()) return 'El nombre es requerido.'
    if (!String(patientForm.lastName || '').trim()) return 'El apellido es requerido.'
    if (!String(patientForm.whatsappPhone || '').trim()) return 'El WhatsApp es requerido.'

    return ''
  }

  const crearPacienteRapido = async () => {
    try {
      const mensajeValidacion = validarPacienteRapido()

      if (mensajeValidacion) {
        setModalError(mensajeValidacion)
        return
      }

      setSaving(true)
      setModalError('')

      const payload = {
        identificationType: String(patientForm.identificationType || '').trim(),
        identification: String(patientForm.identification || '').trim(),
        firstName: String(patientForm.firstName || '').trim(),
        lastName: String(patientForm.lastName || '').trim(),
        birthDate: String(patientForm.birthDate || '').trim() || null,
        gender: String(patientForm.gender || '').trim() || null,
        email: String(patientForm.email || '').trim() || null,
        whatsappPhone: String(patientForm.whatsappPhone || '').trim(),
        address: String(patientForm.address || '').trim() || null,
      }

      const patient = await patientService.crear(payload)

      await cargarPacientes()

      setPacienteSeleccionado(patient)

      setAppointmentForm((prev) => ({
        ...prev,
        patientId: patient.id,
      }))

      setSuccess('Paciente creado y seleccionado correctamente.')
      cerrarModalCrearPaciente()
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo crear el paciente.')
    } finally {
      setSaving(false)
    }
  }

  const consultarDisponibilidad = async () => {
    try {
      if (!appointmentForm.doctorId) {
        setError('Debe seleccionar un médico.')
        return
      }

      if (!appointmentForm.fecha) {
        setError('Debe seleccionar una fecha.')
        return
      }

      setLoadingDisponibilidad(true)
      setError('')
      setSuccess('')
      setDisponibilidad(null)
      setSlotSeleccionado(null)

      const data = await appointmentService.consultarDisponibilidad(
        appointmentForm.doctorId,
        appointmentForm.fecha,
      )

      setDisponibilidad(data)

      setAppointmentForm((prev) => ({
        ...prev,
        branchId: data.sucursalId || '',
        officeId: data.consultorioId || '',
        startDate: '',
        endDate: '',
      }))

      if (!data.slots || data.slots.length === 0) {
        setError('No existen horarios disponibles para el médico en esa fecha.')
      } else {
        setSuccess(`Se encontraron ${data.slots.length} horarios disponibles.`)
      }
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo consultar disponibilidad.')
    } finally {
      setLoadingDisponibilidad(false)
    }
  }

  const seleccionarSlot = (slot) => {
    setSlotSeleccionado(slot)

    setAppointmentForm((prev) => ({
      ...prev,
      startDate: String(slot.inicio || '').replace(' ', 'T'),
      endDate: String(slot.fin || '').replace(' ', 'T'),
      branchId: disponibilidad?.sucursalId || prev.branchId,
      officeId: disponibilidad?.consultorioId || prev.officeId,
    }))
  }

  const validarCita = () => {
    if (!String(appointmentForm.patientId || '').trim()) return 'Debe seleccionar un paciente.'
    if (!String(appointmentForm.specialtyId || '').trim()) return 'Debe seleccionar una especialidad.'
    if (!String(appointmentForm.doctorId || '').trim()) return 'Debe seleccionar un médico.'
    if (!String(appointmentForm.fecha || '').trim()) return 'Debe seleccionar una fecha.'
    if (!String(appointmentForm.startDate || '').trim()) return 'Debe seleccionar un horario disponible.'
    if (!String(appointmentForm.reason || '').trim()) return 'Debe ingresar el motivo de consulta.'

    return ''
  }

  const guardarCita = async () => {
    try {
      const mensajeValidacion = validarCita()

      if (mensajeValidacion) {
        setError(mensajeValidacion)
        return
      }

      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {
        patientId: String(appointmentForm.patientId || '').trim(),
        doctorId: String(appointmentForm.doctorId || '').trim(),
        startDate: convertirFechaBackend(appointmentForm.startDate),
        reason: String(appointmentForm.reason || '').trim(),
        observation: String(appointmentForm.observation || '').trim() || null,
      }

      console.log('Payload crear cita:', payload)

      const data = await appointmentService.crear(payload)

      const resumen = {
        cita: data,
        paciente: pacienteSeleccionado,
        pacienteNombre: obtenerNombrePaciente(pacienteSeleccionado),
        whatsappPhone: pacienteSeleccionado?.whatsappPhone || '',
        medico: obtenerNombreMedico(appointmentForm.doctorId),
        especialidad: obtenerNombreEspecialidad(appointmentForm.specialtyId),
        sucursal: obtenerNombreSucursal(appointmentForm.branchId),
        consultorio: obtenerNombreConsultorio(appointmentForm.officeId),
        horarioInicio: appointmentForm.startDate,
        horarioFin: appointmentForm.endDate,
        motivo: appointmentForm.reason,
        observacion: appointmentForm.observation,
      }

      setCitaCreada(data)
      setResumenConfirmacion(resumen)
      setVisibleConfirmacion(true)
      setSuccess('Cita médica creada correctamente.')
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo crear la cita médica.')
    } finally {
      setSaving(false)
    }
  }

  const enviarConfirmacionWhatsapp = (resumen = null) => {
    const info = resumen || resumenConfirmacion

    if (!info) {
      setError('No existe información de la cita para enviar confirmación.')
      return
    }

    const telefono = String(info.whatsappPhone || '').replace(/\D/g, '')

    if (!telefono) {
      setError('El paciente no tiene WhatsApp registrado.')
      return
    }

    const fecha = String(info.horarioInicio || '').replace('T', ' ')

    const mensaje = `Hola ${info.pacienteNombre}, confirmamos su cita médica para ${info.especialidad} con ${info.medico} el ${fecha}. Sucursal: ${info.sucursal}. Consultorio: ${info.consultorio}. Motivo: ${info.motivo}.`

    const numeroWhatsapp = telefono.startsWith('593') ? telefono : `593${telefono.replace(/^0/, '')}`

    window.open(`https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  const limpiarFormulario = () => {
    setAppointmentForm(initialAppointmentForm)
    setPacienteSeleccionado(null)
    setDisponibilidad(null)
    setSlotSeleccionado(null)
    setCitaCreada(null)
    setResumenConfirmacion(null)
    setVisibleConfirmacion(false)
    setSearchPaciente('')
    setError('')
    setSuccess('')
  }

  const crearNuevaCita = () => {
    limpiarFormulario()
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Crear Cita Médica</strong>

          <div>
            <CButton color="secondary" variant="outline" className="me-2" onClick={limpiarFormulario}>
              Limpiar
            </CButton>

            <CButton color="primary" onClick={guardarCita} disabled={saving}>
              {saving ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Guardando...
                </>
              ) : (
                'Guardar cita'
              )}
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

          <CRow className="g-4">
            <CCol md={12}>
              <CCard>
                <CCardHeader>
                  <strong>1. Paciente</strong>
                </CCardHeader>

                <CCardBody>
                  <CRow className="g-3">
                    <CCol md={8}>
                      <CFormLabel>Buscar paciente</CFormLabel>
                      <CFormInput
                        value={searchPaciente}
                        onChange={(e) => setSearchPaciente(e.target.value)}
                        placeholder="Buscar por nombre, identificación, WhatsApp o email"
                      />
                    </CCol>

                    <CCol md={2} className="d-flex align-items-end">
                      <CButton color="info" variant="outline" className="w-100">
                        Buscar paciente
                      </CButton>
                    </CCol>

                    <CCol md={2} className="d-flex align-items-end">
                      <CButton
                        color="primary"
                        variant="outline"
                        className="w-100"
                        onClick={abrirModalCrearPaciente}
                      >
                        Crear paciente rápido
                      </CButton>
                    </CCol>

                    {pacienteSeleccionado && (
                      <CCol md={12}>
                        <CAlert color="info">
                          <strong>Paciente seleccionado:</strong>{' '}
                          {obtenerNombrePaciente(pacienteSeleccionado)} |{' '}
                          {pacienteSeleccionado.identification} | WhatsApp:{' '}
                          {pacienteSeleccionado.whatsappPhone}
                        </CAlert>
                      </CCol>
                    )}

                    {pacientesFiltrados.length > 0 && (
                      <CCol md={12}>
                        <CTable hover responsive align="middle">
                          <CTableHead color="light">
                            <CTableRow>
                              <CTableHeaderCell>Paciente</CTableHeaderCell>
                              <CTableHeaderCell>Identificación</CTableHeaderCell>
                              <CTableHeaderCell>WhatsApp</CTableHeaderCell>
                              <CTableHeaderCell className="text-end">Acción</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>

                          <CTableBody>
                            {pacientesFiltrados.map((patient) => (
                              <CTableRow key={patient.id}>
                                <CTableDataCell>{obtenerNombrePaciente(patient)}</CTableDataCell>
                                <CTableDataCell>{patient.identification}</CTableDataCell>
                                <CTableDataCell>{patient.whatsappPhone}</CTableDataCell>
                                <CTableDataCell className="text-end">
                                  <CButton
                                    color="success"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => seleccionarPaciente(patient)}
                                  >
                                    Seleccionar
                                  </CButton>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                      </CCol>
                    )}
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={12}>
              <CCard>
                <CCardHeader>
                  <strong>2. Datos de la cita</strong>
                </CCardHeader>

                <CCardBody>
                  <CRow className="g-3">
                    <CCol md={4}>
                      <CFormLabel>Especialidad</CFormLabel>
                      <CFormSelect
                        name="specialtyId"
                        value={appointmentForm.specialtyId || ''}
                        onChange={handleAppointmentChange}
                      >
                        <option value="">Seleccione una especialidad</option>
                        {especialidades
                          .filter((specialty) => specialty.isActive !== false)
                          .map((specialty) => (
                            <option key={specialty.id} value={specialty.id}>
                              {specialty.name}
                            </option>
                          ))}
                      </CFormSelect>
                    </CCol>

                    <CCol md={4}>
                      <CFormLabel>Médico</CFormLabel>
                      <CFormSelect
                        name="doctorId"
                        value={appointmentForm.doctorId || ''}
                        onChange={handleAppointmentChange}
                      >
                        <option value="">Seleccione un médico</option>
                        {medicosFiltrados
                          .filter((doctor) => doctor.isActive !== false)
                          .map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>
                              {obtenerNombreMedico(doctor.id)}
                            </option>
                          ))}
                      </CFormSelect>
                    </CCol>

                    <CCol md={4}>
                      <CFormLabel>Fecha</CFormLabel>
                      <CFormInput
                        type="date"
                        name="fecha"
                        value={appointmentForm.fecha || ''}
                        onChange={handleAppointmentChange}
                      />
                    </CCol>

                    <CCol md={4}>
                      <CFormLabel>Sucursal</CFormLabel>
                      <CFormInput value={obtenerNombreSucursal(appointmentForm.branchId)} disabled />
                    </CCol>

                    <CCol md={4}>
                      <CFormLabel>Consultorio</CFormLabel>
                      <CFormInput value={obtenerNombreConsultorio(appointmentForm.officeId)} disabled />
                    </CCol>

                    <CCol md={4} className="d-flex align-items-end">
                      <CButton
                        color="info"
                        variant="outline"
                        className="w-100"
                        onClick={consultarDisponibilidad}
                        disabled={loadingDisponibilidad}
                      >
                        {loadingDisponibilidad ? (
                          <>
                            <CSpinner size="sm" className="me-2" />
                            Consultando...
                          </>
                        ) : (
                          'Consultar disponibilidad'
                        )}
                      </CButton>
                    </CCol>

                    <CCol md={12}>
                      <CFormLabel>Motivo de consulta</CFormLabel>
                      <CFormInput
                        name="reason"
                        value={appointmentForm.reason || ''}
                        onChange={handleAppointmentChange}
                        placeholder="Ej: Consulta de control anual"
                      />
                    </CCol>

                    <CCol md={12}>
                      <CFormLabel>Observaciones adicionales (Opcional)</CFormLabel>
                      <CFormTextarea
                        name="observation"
                        value={appointmentForm.observation || ''}
                        onChange={handleAppointmentChange}
                        rows={3}
                        maxLength={500}
                        placeholder="Ej: El paciente requiere asistencia en silla de ruedas / Traer exámenes previos"
                      />
                      <div className="text-end text-muted small">
                        {appointmentForm.observation?.length || 0}/500 caracteres
                      </div>
                    </CCol>
                    
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={12}>
              <CCard>
                <CCardHeader>
                  <strong>3. Horarios disponibles</strong>
                </CCardHeader>

                <CCardBody>
                  {!disponibilidad ? (
                    <CAlert color="info">
                      Selecciona médico y fecha, luego presiona Consultar disponibilidad.
                    </CAlert>
                  ) : disponibilidad.slots?.length === 0 ? (
                    <CAlert color="warning">No existen horarios disponibles.</CAlert>
                  ) : (
                    <CRow className="g-2">
                      {disponibilidad.slots.map((slot, index) => {
                        const activo = slotSeleccionado?.inicio === slot.inicio

                        return (
                          <CCol md={2} key={`${slot.inicio}-${index}`}>
                            <CButton
                              color={activo ? 'success' : 'secondary'}
                              variant={activo ? undefined : 'outline'}
                              className="w-100"
                              onClick={() => seleccionarSlot(slot)}
                            >
                              {String(slot.inicio).slice(11, 16)} - {String(slot.fin).slice(11, 16)}
                            </CButton>
                          </CCol>
                        )
                      })}
                    </CRow>
                  )}
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={12}>
              <CCard>
                <CCardHeader>
                  <strong>4. Resumen</strong>
                </CCardHeader>

                <CCardBody>
                  <p>
                    <strong>Paciente:</strong>{' '}
                    {pacienteSeleccionado ? obtenerNombrePaciente(pacienteSeleccionado) : '-'}
                  </p>
                  <p>
                    <strong>Especialidad:</strong> {obtenerNombreEspecialidad(appointmentForm.specialtyId)}
                  </p>
                  <p>
                    <strong>Médico:</strong> {obtenerNombreMedico(appointmentForm.doctorId)}
                  </p>
                  <p>
                    <strong>Sucursal:</strong> {obtenerNombreSucursal(appointmentForm.branchId)}
                  </p>
                  <p>
                    <strong>Consultorio:</strong> {obtenerNombreConsultorio(appointmentForm.officeId)}
                  </p>
                  <p>
                    <strong>Horario:</strong>{' '}
                    {slotSeleccionado ? `${slotSeleccionado.inicio} - ${slotSeleccionado.fin}` : '-'}
                  </p>
                  <p>
                    <strong>Motivo:</strong> {appointmentForm.reason || '-'}
                  </p>
                  <p>
                    <strong>Observación:</strong> {appointmentForm.observation || '-'}
                  </p>

                  {citaCreada && (
                    <CBadge color="success" className="mb-3">
                      Cita creada correctamente
                    </CBadge>
                  )}

                  <div className="mt-3">
                    <CButton color="primary" className="me-2" onClick={guardarCita} disabled={saving}>
                      Guardar cita
                    </CButton>

                    <CButton color="success" variant="outline" onClick={enviarConfirmacionWhatsapp}>
                      Enviar confirmación WhatsApp
                    </CButton>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CModal visible={visiblePacienteModal} onClose={cerrarModalCrearPaciente} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>Crear paciente rápido</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={4}>
              <CFormLabel>Tipo identificación</CFormLabel>
              <CFormSelect
                name="identificationType"
                value={patientForm.identificationType || ''}
                onChange={handlePatientChange}
              >
                <option value="CEDULA">Cédula</option>
                <option value="RUC">RUC</option>
                <option value="PASAPORTE">Pasaporte</option>
              </CFormSelect>
            </CCol>

            <CCol md={8}>
              <CFormLabel>Identificación</CFormLabel>
              <CFormInput
                name="identification"
                value={patientForm.identification || ''}
                onChange={handlePatientChange}
                placeholder="Ej: 1102457818"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Nombres</CFormLabel>
              <CFormInput
                name="firstName"
                value={patientForm.firstName || ''}
                onChange={handlePatientChange}
                placeholder="Ej: Valentina"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Apellidos</CFormLabel>
              <CFormInput
                name="lastName"
                value={patientForm.lastName || ''}
                onChange={handlePatientChange}
                placeholder="Ej: Carrion"
              />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Fecha nacimiento</CFormLabel>
              <CFormInput
                type="date"
                name="birthDate"
                value={patientForm.birthDate || ''}
                onChange={handlePatientChange}
              />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Género</CFormLabel>
              <CFormSelect name="gender" value={patientForm.gender || ''} onChange={handlePatientChange}>
                <option value="FEMENINO">Femenino</option>
                <option value="MASCULINO">Masculino</option>
                <option value="OTRO">Otro</option>
              </CFormSelect>
            </CCol>

            <CCol md={4}>
              <CFormLabel>WhatsApp</CFormLabel>
              <CFormInput
                name="whatsappPhone"
                value={patientForm.whatsappPhone || ''}
                onChange={handlePatientChange}
                placeholder="Ej: 0991123408"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Email</CFormLabel>
              <CFormInput
                type="email"
                name="email"
                value={patientForm.email || ''}
                onChange={handlePatientChange}
                placeholder="Ej: paciente@email.com"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Dirección</CFormLabel>
              <CFormInput
                name="address"
                value={patientForm.address || ''}
                onChange={handlePatientChange}
                placeholder="Ej: Quito, Ecuador"
              />
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModalCrearPaciente}>
            Cancelar
          </CButton>

          <CButton color="primary" onClick={crearPacienteRapido} disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              'Crear paciente'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={visibleConfirmacion} onClose={crearNuevaCita} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>Cita creada correctamente</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {resumenConfirmacion && (
            <>
              <CAlert color="success">
                La cita médica fue registrada exitosamente.
              </CAlert>

              <p>
                <strong>Paciente:</strong> {resumenConfirmacion.pacienteNombre}
              </p>

              <p>
                <strong>WhatsApp:</strong> {resumenConfirmacion.whatsappPhone || '-'}
              </p>

              <p>
                <strong>Especialidad:</strong> {resumenConfirmacion.especialidad}
              </p>

              <p>
                <strong>Médico:</strong> {resumenConfirmacion.medico}
              </p>

              <p>
                <strong>Sucursal:</strong> {resumenConfirmacion.sucursal}
              </p>

              <p>
                <strong>Consultorio:</strong> {resumenConfirmacion.consultorio}
              </p>

              <p>
                <strong>Horario:</strong>{' '}
                {String(resumenConfirmacion.horarioInicio || '').replace('T', ' ')}
                {' - '}
                {String(resumenConfirmacion.horarioFin || '').replace('T', ' ')}
              </p>

              <p>
                <strong>Motivo:</strong> {resumenConfirmacion.motivo || '-'}
              </p>
              <p>
                <strong>Observaciones:</strong> {resumenConfirmacion.observacion || '-'}
              </p>
            </>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={crearNuevaCita}>
            Crear nueva cita
          </CButton>

          <CButton
            color="success"
            onClick={() => enviarConfirmacionWhatsapp(resumenConfirmacion)}
          >
            Enviar confirmación WhatsApp
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default CrearCitaMedica
