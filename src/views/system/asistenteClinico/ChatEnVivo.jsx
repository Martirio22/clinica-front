import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

import { chatMessageService } from '../../../services/chatMessageService'
import { chatSessionService } from '../../../services/chatSessionService'
import { patientService } from '../../../services/patientService'
import { appointmentService } from '../../../services/appointmentService'
import { specialtyService } from '../../../services/specialtyService'
import { doctorService } from '../../../services/doctorService'
import { branchService } from '../../../services/branchService'
import { officeService } from '../../../services/officeService'
import { medicalPrescriptionService } from '../../../services/medicalPrescriptionService'

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
  specialtyId: '',
  doctorId: '',
  fecha: '',
  startDate: '',
  endDate: '',
  branchId: '',
  officeId: '',
  reason: '',
}

const initialCloseForm = {
  closeReason: '',
  conversationSummary: '',
}

const ChatEnVivo = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)

  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [specialties, setSpecialties] = useState([])
  const [doctors, setDoctors] = useState([])
  const [branches, setBranches] = useState([])
  const [offices, setOffices] = useState([])
  const [prescriptions, setPrescriptions] = useState([])

  const [newMessage, setNewMessage] = useState('')
  const [filterSender, setFilterSender] = useState('TODOS')

  const [patientForm, setPatientForm] = useState(initialPatientForm)
  const [appointmentForm, setAppointmentForm] = useState(initialAppointmentForm)
  const [closeForm, setCloseForm] = useState(initialCloseForm)

  const [availability, setAvailability] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)

  const [visiblePatientModal, setVisiblePatientModal] = useState(false)
  const [visibleAppointmentModal, setVisibleAppointmentModal] = useState(false)
  const [visibleAppointmentsModal, setVisibleAppointmentsModal] = useState(false)
  const [visiblePrescriptionsModal, setVisiblePrescriptionsModal] = useState(false)
  const [visibleCloseModal, setVisibleCloseModal] = useState(false)

  const [patientAppointments, setPatientAppointments] = useState([])

  const [loading, setLoading] = useState(false)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarSesion = async () => {
    try {
      const data = await chatSessionService.obtener(sessionId)
      setSession(data)
    } catch (err) {
      console.error(err)
      setSession(null)
    }
  }

  const cargarMensajes = async () => {
    try {
      const data = await chatMessageService.listarPorSession(sessionId)
      setMessages(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los mensajes del chat.')
    }
  }

  const cargarPacientes = async () => {
    try {
      const data = await patientService.listar()
      setPatients(data || [])
    } catch (err) {
      console.error(err)
      setPatients([])
    }
  }

  const cargarEspecialidades = async () => {
    try {
      const data = await specialtyService.listar()
      setSpecialties(data || [])
    } catch (err) {
      console.error(err)
      setSpecialties([])
    }
  }

  const cargarMedicos = async () => {
    try {
      const data = await doctorService.listar()
      setDoctors(data || [])
    } catch (err) {
      console.error(err)
      setDoctors([])
    }
  }

  const cargarSucursales = async () => {
    try {
      const data = await branchService.listar()
      setBranches(data || [])
    } catch (err) {
      console.error(err)
      setBranches([])
    }
  }

  const cargarConsultorios = async () => {
    try {
      const data = await officeService.listar()
      setOffices(data || [])
    } catch (err) {
      console.error(err)
      setOffices([])
    }
  }

  const cargarRecetas = async () => {
    try {
      const data = await medicalPrescriptionService.listar()
      setPrescriptions(data || [])
    } catch (err) {
      console.error(err)
      setPrescriptions([])
    }
  }

  const cargarTodo = async () => {
    try {
      setLoading(true)
      setError('')

      await Promise.all([
        cargarSesion(),
        cargarMensajes(),
        cargarPacientes(),
        cargarEspecialidades(),
        cargarMedicos(),
        cargarSucursales(),
        cargarConsultorios(),
        cargarRecetas(),
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarTodo()
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!session || patients.length === 0) return

    const patientId = session.patientId || session.patient?.id

    if (patientId) {
      const found = patients.find((patient) => patient.id === patientId)
      if (found) {
        setSelectedPatient(found)
        return
      }
    }

    const phone =
      session.whatsappPhone ||
      session.phone ||
      session.patientPhone ||
      session.contactPhone ||
      session.from

    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '')

      const found = patients.find((patient) => {
        const patientPhone = String(patient.whatsappPhone || '').replace(/\D/g, '')
        return patientPhone && cleanPhone.includes(patientPhone.replace(/^0/, ''))
      })

      if (found) {
        setSelectedPatient(found)
      }
    }
  }, [session, patients])

  const normalizeSender = (message) => {
    const raw = String(
      message.senderType ||
      message.sender ||
      message.fromType ||
      message.role ||
      message.authorType ||
      '',
    ).toUpperCase()

    if (raw.includes('PATIENT') || raw.includes('PACIENTE') || raw.includes('USER')) return 'PACIENTE'
    if (raw.includes('BOT')) return 'BOT'
    if (raw.includes('ASSISTANT') || raw.includes('ASISTENTE') || raw.includes('AGENT')) {
      return 'ASISTENTE'
    }

    if (message.isFromBot) return 'BOT'
    if (message.isFromAssistant) return 'ASISTENTE'
    if (message.fromMe) return 'ASISTENTE'

    return 'PACIENTE'
  }

  const obtenerTextoMensaje = (message) => {
    return (
      message.content ||
      message.text ||
      message.body ||
      message.message ||
      message.caption ||
      ''
    )
  }

  const obtenerFechaMensaje = (message) => {
    return message.createdAt || message.timestamp || message.sentAt || message.date || null
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

    return raw
  }

  const messagesFiltrados = useMemo(() => {
    if (filterSender === 'TODOS') return messages

    return messages.filter((message) => normalizeSender(message) === filterSender)
  }, [messages, filterSender])

  const medicosFiltrados = useMemo(() => {
    if (!appointmentForm.specialtyId) return doctors

    return doctors.filter((doctor) => doctor.specialtyId === appointmentForm.specialtyId)
  }, [doctors, appointmentForm.specialtyId])

  const recetasPaciente = useMemo(() => {
    if (!selectedPatient) return []

    return prescriptions.filter((prescription) => {
      const patientId =
        prescription.patientId ||
        prescription.patient?.id ||
        prescription.medicalAttention?.appointment?.patientId ||
        prescription.medicalAttention?.appointment?.patient?.id

      return patientId === selectedPatient.id
    })
  }, [prescriptions, selectedPatient])

  const obtenerNombrePaciente = (patient = selectedPatient) => {
    if (!patient) return '-'
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
  }

  const obtenerNombreMedico = (doctorId) => {
    const doctor = doctors.find((item) => item.id === doctorId)

    if (!doctor) return '-'

    if (doctor.user) {
      return `${doctor.user.firstName || ''} ${doctor.user.lastName || ''}`.trim()
    }

    if (doctor.professionalRegistry) return `Médico ${doctor.professionalRegistry}`

    return doctor.name || doctor.userId || '-'
  }

  const obtenerNombreEspecialidad = (specialtyId) => {
    const specialty = specialties.find((item) => item.id === specialtyId)
    return specialty?.name || '-'
  }

  const obtenerNombreSucursal = (branchId) => {
    const branch = branches.find((item) => item.id === branchId)
    return branch ? `${branch.name} - ${branch.city}` : '-'
  }

  const obtenerNombreConsultorio = (officeId) => {
    const office = offices.find((item) => item.id === officeId)
    return office ? `${office.code} - ${office.name}` : '-'
  }

  const convertirFechaBackend = (value) => {
    if (!value) return ''

    const fecha = String(value).trim().replace(' ', 'T')

    if (fecha.endsWith('-05:00')) return fecha
    if (fecha.includes('-05:00')) return fecha

    return `${fecha}-05:00`
  }

  const enviarMensaje = async () => {
    try {
      if (!String(newMessage || '').trim()) {
        setError('Debe escribir un mensaje.')
        return
      }

      setSending(true)
      setError('')
      setSuccess('')

      const payload = {
        chatSessionId: sessionId,
        senderType: 'ASISTENTE',
        content: String(newMessage || '').trim(),
        messageType: 'SALIENTE',
      }

      console.log('Payload enviar mensaje:', payload)

      const created = await chatMessageService.crear(payload)

      setMessages((prev) => [...prev, created])
      setNewMessage('')
      setSuccess('Mensaje enviado correctamente.')
      await cargarMensajes()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo enviar el mensaje.')
    } finally {
      setSending(false)
    }
  }

  const handlePatientChange = (e) => {
    const { name, value } = e.target

    setPatientForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const abrirCrearPaciente = () => {
    const phone =
      session?.whatsappPhone ||
      session?.phone ||
      session?.patientPhone ||
      session?.contactPhone ||
      session?.from ||
      ''

    setPatientForm({
      ...initialPatientForm,
      whatsappPhone: String(phone || '').replace(/\D/g, ''),
    })

    setModalError('')
    setVisiblePatientModal(true)
  }

  const cerrarCrearPaciente = () => {
    setVisiblePatientModal(false)
    setPatientForm(initialPatientForm)
    setModalError('')
  }

  const validarPaciente = () => {
    if (!String(patientForm.identification || '').trim()) return 'La identificación es requerida.'
    if (!String(patientForm.firstName || '').trim()) return 'El nombre es requerido.'
    if (!String(patientForm.lastName || '').trim()) return 'El apellido es requerido.'
    if (!String(patientForm.whatsappPhone || '').trim()) return 'El WhatsApp es requerido.'

    return ''
  }

  const crearPaciente = async () => {
    try {
      const validation = validarPaciente()

      if (validation) {
        setModalError(validation)
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

      setSelectedPatient(patient)
      setSuccess('Paciente creado correctamente.')
      cerrarCrearPaciente()
      await cargarPacientes()
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo crear el paciente.')
    } finally {
      setSaving(false)
    }
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
        next.startDate = ''
        next.endDate = ''
        next.branchId = ''
        next.officeId = ''
      }

      if (name === 'doctorId' || name === 'fecha') {
        next.startDate = ''
        next.endDate = ''
        next.branchId = ''
        next.officeId = ''
      }

      return next
    })

    if (name === 'specialtyId' || name === 'doctorId' || name === 'fecha') {
      setAvailability(null)
      setSelectedSlot(null)
    }
  }

  const abrirCrearCita = () => {
    if (!selectedPatient) {
      setError('Primero debes seleccionar o crear un paciente.')
      return
    }

    setAppointmentForm(initialAppointmentForm)
    setAvailability(null)
    setSelectedSlot(null)
    setModalError('')
    setVisibleAppointmentModal(true)
  }

  const cerrarCrearCita = () => {
    setVisibleAppointmentModal(false)
    setAppointmentForm(initialAppointmentForm)
    setAvailability(null)
    setSelectedSlot(null)
    setModalError('')
  }

  const consultarDisponibilidad = async () => {
    try {
      if (!appointmentForm.doctorId) {
        setModalError('Debe seleccionar un médico.')
        return
      }

      if (!appointmentForm.fecha) {
        setModalError('Debe seleccionar una fecha.')
        return
      }

      setLoadingAvailability(true)
      setModalError('')
      setAvailability(null)
      setSelectedSlot(null)

      const data = await appointmentService.consultarDisponibilidad(
        appointmentForm.doctorId,
        appointmentForm.fecha,
      )

      setAvailability(data)

      setAppointmentForm((prev) => ({
        ...prev,
        branchId: data.sucursalId || '',
        officeId: data.consultorioId || '',
        startDate: '',
        endDate: '',
      }))

      if (!data.slots || data.slots.length === 0) {
        setModalError('No existen horarios disponibles para el médico en esa fecha.')
      }
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo consultar disponibilidad.')
    } finally {
      setLoadingAvailability(false)
    }
  }

  const seleccionarSlot = (slot) => {
    setSelectedSlot(slot)

    setAppointmentForm((prev) => ({
      ...prev,
      startDate: String(slot.inicio || '').replace(' ', 'T'),
      endDate: String(slot.fin || '').replace(' ', 'T'),
      branchId: availability?.sucursalId || prev.branchId,
      officeId: availability?.consultorioId || prev.officeId,
    }))
  }

  const validarCita = () => {
    if (!selectedPatient?.id) return 'Debe seleccionar un paciente.'
    if (!String(appointmentForm.specialtyId || '').trim()) return 'Debe seleccionar una especialidad.'
    if (!String(appointmentForm.doctorId || '').trim()) return 'Debe seleccionar un médico.'
    if (!String(appointmentForm.fecha || '').trim()) return 'Debe seleccionar una fecha.'
    if (!String(appointmentForm.startDate || '').trim()) return 'Debe seleccionar un horario.'
    if (!String(appointmentForm.reason || '').trim()) return 'Debe ingresar el motivo de consulta.'

    return ''
  }

  const guardarCita = async () => {
    try {
      const validation = validarCita()

      if (validation) {
        setModalError(validation)
        return
      }

      setSaving(true)
      setModalError('')
      setSuccess('')

      const payload = {
        patientId: selectedPatient.id,
        doctorId: String(appointmentForm.doctorId || '').trim(),
        startDate: convertirFechaBackend(appointmentForm.startDate),
        reason: String(appointmentForm.reason || '').trim(),
      }

      const appointment = await appointmentService.crear(payload)

      setSuccess('Cita creada correctamente.')
      cerrarCrearCita()

      const confirmation = `Cita agendada correctamente para ${obtenerNombreEspecialidad(
        appointmentForm.specialtyId,
      )} con ${obtenerNombreMedico(appointmentForm.doctorId)} el ${appointmentForm.startDate.replace(
        'T',
        ' ',
      )}.`

      setNewMessage(confirmation)
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo crear la cita.')
    } finally {
      setSaving(false)
    }
  }

  const verCitasPaciente = async () => {
    try {
      if (!selectedPatient) {
        setError('No existe paciente seleccionado.')
        return
      }

      setLoading(true)
      setError('')

      const data = await appointmentService.listarConFiltros({
        patientId: selectedPatient.id,
      })

      setPatientAppointments(data || [])
      setVisibleAppointmentsModal(true)
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudieron cargar las citas del paciente.')
    } finally {
      setLoading(false)
    }
  }

  const verRecetasPaciente = () => {
    if (!selectedPatient) {
      setError('No existe paciente seleccionado.')
      return
    }

    setVisiblePrescriptionsModal(true)
  }

  const enviarRecetaWhatsapp = async (prescription) => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await medicalPrescriptionService.enviarWhatsapp(prescription.id)

      setSuccess('Receta enviada por WhatsApp correctamente.')
      await cargarRecetas()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo enviar la receta por WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  const transferirAlBot = async () => {
    setError('Todavía no existe el endpoint para transferir la conversación al bot.')
  }

  const abrirCerrarGestion = () => {
    setCloseForm(initialCloseForm)
    setModalError('')
    setVisibleCloseModal(true)
  }

  const cerrarCerrarGestion = () => {
    setVisibleCloseModal(false)
    setCloseForm(initialCloseForm)
    setModalError('')
  }

  const handleCloseChange = (e) => {
    const { name, value } = e.target

    setCloseForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const cerrarGestion = async () => {
    try {
      if (!String(closeForm.closeReason || '').trim()) {
        setModalError('Debe ingresar el motivo de cierre.')
        return
      }

      if (!String(closeForm.conversationSummary || '').trim()) {
        setModalError('Debe ingresar el resumen de conversación.')
        return
      }

      setSaving(true)
      setModalError('')
      setError('')
      setSuccess('')

      await chatSessionService.cerrar(sessionId, {
        closeReason: String(closeForm.closeReason || '').trim(),
        conversationSummary: String(closeForm.conversationSummary || '').trim(),
      })

      setSuccess('Gestión cerrada correctamente.')
      cerrarCerrarGestion()
      await cargarSesion()
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo cerrar la gestión.')
    } finally {
      setSaving(false)
    }
  }

  const verPaciente = () => {
    if (!selectedPatient) {
      setError('No existe paciente seleccionado.')
      return
    }

    navigate(`/pacientes/perfil-paciente/${selectedPatient.id}`)
  }

  const getSenderBadge = (sender) => {
    if (sender === 'PACIENTE') return 'info'
    if (sender === 'BOT') return 'secondary'
    if (sender === 'ASISTENTE') return 'success'
    return 'dark'
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Chat en Vivo</strong>
            <div className="small text-body-secondary">Sesión: {sessionId}</div>
          </div>

          <div>
            <CButton color="secondary" variant="outline" className="me-2" onClick={cargarTodo}>
              Actualizar
            </CButton>

            <CButton color="warning" variant="outline" className="me-2" onClick={transferirAlBot}>
              Transferir al bot
            </CButton>

            <CButton color="danger" variant="outline" onClick={abrirCerrarGestion}>
              Cerrar gestión
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

          <CRow className="g-3">
            <CCol md={8}>
              <CCard className="h-100">
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <strong>Conversación completa</strong>

                  <CFormSelect
                    value={filterSender}
                    onChange={(e) => setFilterSender(e.target.value)}
                    style={{ maxWidth: 220 }}
                  >
                    <option value="TODOS">Todos los mensajes</option>
                    <option value="PACIENTE">Paciente</option>
                    <option value="BOT">Bot</option>
                    <option value="ASISTENTE">Asistente</option>
                  </CFormSelect>
                </CCardHeader>

                <CCardBody>
                  {loading ? (
                    <div className="text-center my-4">
                      <CSpinner color="primary" />
                    </div>
                  ) : (
                    <div
                      style={{
                        height: '520px',
                        overflowY: 'auto',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                        padding: '12px',
                        background: '#fafafa',
                      }}
                    >
                      {messagesFiltrados.length === 0 ? (
                        <CAlert color="info">No existen mensajes para esta sesión.</CAlert>
                      ) : (
                        messagesFiltrados.map((message, index) => {
                          const sender = normalizeSender(message)
                          const isAssistant = sender === 'ASISTENTE'

                          return (
                            <div
                              key={message.id || index}
                              className={`d-flex mb-3 ${isAssistant ? 'justify-content-end' : 'justify-content-start'
                                }`}
                            >
                              <div
                                style={{
                                  maxWidth: '75%',
                                  background: isAssistant ? '#e8f5e9' : '#ffffff',
                                  border: '1px solid #ddd',
                                  borderRadius: '12px',
                                  padding: '10px 12px',
                                }}
                              >
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <CBadge color={getSenderBadge(sender)}>{sender}</CBadge>
                                  <small className="text-body-secondary ms-2">
                                    {formatearFechaHora(obtenerFechaMensaje(message))}
                                  </small>
                                </div>

                                <div style={{ whiteSpace: 'pre-wrap' }}>
                                  {obtenerTextoMensaje(message)}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}

                  <CRow className="g-2 mt-3">
                    <CCol md={10}>
                      <CFormTextarea
                        rows={2}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje para el paciente..."
                      />
                    </CCol>

                    <CCol md={2} className="d-flex align-items-end">
                      <CButton
                        color="primary"
                        className="w-100"
                        onClick={enviarMensaje}
                        disabled={sending}
                      >
                        {sending ? <CSpinner size="sm" /> : 'Enviar mensaje'}
                      </CButton>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={4}>
              <CCard className="mb-3">
                <CCardHeader>
                  <strong>Datos del paciente</strong>
                </CCardHeader>

                <CCardBody>
                  {selectedPatient ? (
                    <>
                      <p>
                        <strong>Paciente:</strong> {obtenerNombrePaciente()}
                      </p>
                      <p>
                        <strong>Identificación:</strong> {selectedPatient.identification || '-'}
                      </p>
                      <p>
                        <strong>WhatsApp:</strong> {selectedPatient.whatsappPhone || '-'}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedPatient.email || '-'}
                      </p>

                      <CButton
                        color="secondary"
                        variant="outline"
                        className="w-100 mb-2"
                        onClick={verPaciente}
                      >
                        Ver paciente
                      </CButton>
                    </>
                  ) : (
                    <>
                      <CAlert color="warning">
                        No se encontró paciente asociado a esta conversación.
                      </CAlert>

                      <CButton color="primary" className="w-100" onClick={abrirCrearPaciente}>
                        Crear paciente si no existe
                      </CButton>
                    </>
                  )}
                </CCardBody>
              </CCard>

              <CCard>
                <CCardHeader>
                  <strong>Acciones rápidas</strong>
                </CCardHeader>

                <CCardBody>
                  <CButton color="primary" variant="outline" className="w-100 mb-2" onClick={abrirCrearCita}>
                    Crear cita
                  </CButton>

                  <CButton color="info" variant="outline" className="w-100 mb-2" onClick={verCitasPaciente}>
                    Ver citas
                  </CButton>

                  <CButton color="success" variant="outline" className="w-100 mb-2" onClick={verRecetasPaciente}>
                    Ver recetas
                  </CButton>

                  <CButton color="warning" variant="outline" className="w-100 mb-2" onClick={transferirAlBot}>
                    Transferir al bot
                  </CButton>

                  <CButton color="danger" variant="outline" className="w-100" onClick={abrirCerrarGestion}>
                    Cerrar gestión
                  </CButton>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CModal visible={visiblePatientModal} onClose={cerrarCrearPaciente} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>Crear paciente</CModalTitle>
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
                value={patientForm.identificationType}
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
                value={patientForm.identification}
                onChange={handlePatientChange}
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Nombres</CFormLabel>
              <CFormInput name="firstName" value={patientForm.firstName} onChange={handlePatientChange} />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Apellidos</CFormLabel>
              <CFormInput name="lastName" value={patientForm.lastName} onChange={handlePatientChange} />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Fecha nacimiento</CFormLabel>
              <CFormInput
                type="date"
                name="birthDate"
                value={patientForm.birthDate}
                onChange={handlePatientChange}
              />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Género</CFormLabel>
              <CFormSelect name="gender" value={patientForm.gender} onChange={handlePatientChange}>
                <option value="FEMENINO">Femenino</option>
                <option value="MASCULINO">Masculino</option>
                <option value="OTRO">Otro</option>
              </CFormSelect>
            </CCol>

            <CCol md={4}>
              <CFormLabel>WhatsApp</CFormLabel>
              <CFormInput
                name="whatsappPhone"
                value={patientForm.whatsappPhone}
                onChange={handlePatientChange}
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Email</CFormLabel>
              <CFormInput name="email" value={patientForm.email} onChange={handlePatientChange} />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Dirección</CFormLabel>
              <CFormInput name="address" value={patientForm.address} onChange={handlePatientChange} />
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarCrearPaciente}>
            Cancelar
          </CButton>

          <CButton color="primary" onClick={crearPaciente} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : 'Crear paciente'}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={visibleAppointmentModal} onClose={cerrarCrearCita} backdrop="static" size="xl">
        <CModalHeader>
          <CModalTitle>Crear cita desde chat</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          {selectedPatient && (
            <CAlert color="info">
              <strong>Paciente:</strong> {obtenerNombrePaciente()}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={4}>
              <CFormLabel>Especialidad</CFormLabel>
              <CFormSelect
                name="specialtyId"
                value={appointmentForm.specialtyId}
                onChange={handleAppointmentChange}
              >
                <option value="">Seleccione una especialidad</option>
                {specialties
                  .filter((item) => item.isActive !== false)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </CFormSelect>
            </CCol>

            <CCol md={4}>
              <CFormLabel>Médico</CFormLabel>
              <CFormSelect name="doctorId" value={appointmentForm.doctorId} onChange={handleAppointmentChange}>
                <option value="">Seleccione un médico</option>
                {medicosFiltrados
                  .filter((item) => item.isActive !== false)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {obtenerNombreMedico(item.id)}
                    </option>
                  ))}
              </CFormSelect>
            </CCol>

            <CCol md={4}>
              <CFormLabel>Fecha</CFormLabel>
              <CFormInput
                type="date"
                name="fecha"
                value={appointmentForm.fecha}
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
                disabled={loadingAvailability}
              >
                {loadingAvailability ? <CSpinner size="sm" /> : 'Consultar disponibilidad'}
              </CButton>
            </CCol>

            <CCol md={12}>
              <CFormLabel>Motivo</CFormLabel>
              <CFormInput
                name="reason"
                value={appointmentForm.reason}
                onChange={handleAppointmentChange}
                placeholder="Ej: Consulta de control"
              />
            </CCol>

            <CCol md={12}>
              <strong>Horarios disponibles</strong>

              {!availability ? (
                <CAlert color="info" className="mt-2">
                  Selecciona médico y fecha, luego consulta disponibilidad.
                </CAlert>
              ) : availability.slots?.length === 0 ? (
                <CAlert color="warning" className="mt-2">
                  No existen horarios disponibles.
                </CAlert>
              ) : (
                <CRow className="g-2 mt-2">
                  {availability.slots.map((slot, index) => {
                    const active = selectedSlot?.inicio === slot.inicio

                    return (
                      <CCol md={2} key={`${slot.inicio}-${index}`}>
                        <CButton
                          color={active ? 'success' : 'secondary'}
                          variant={active ? undefined : 'outline'}
                          className="w-100"
                          onClick={() => seleccionarSlot(slot)}
                        >
                          {formatearHora(slot.inicio)} - {formatearHora(slot.fin)}
                        </CButton>
                      </CCol>
                    )
                  })}
                </CRow>
              )}
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarCrearCita}>
            Cancelar
          </CButton>

          <CButton color="primary" onClick={guardarCita} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : 'Guardar cita'}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={visibleAppointmentsModal} onClose={() => setVisibleAppointmentsModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Citas del paciente</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell>Médico</CTableHeaderCell>
                <CTableHeaderCell>Motivo</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {patientAppointments.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={4} className="text-center">
                    No existen citas registradas.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                patientAppointments.map((appointment, index) => (
                  <CTableRow key={appointment.id}>
                    <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                    <CTableDataCell>{formatearFechaHora(appointment.startDate)}</CTableDataCell>
                    <CTableDataCell>{obtenerNombreMedico(appointment.doctorId)}</CTableDataCell>
                    <CTableDataCell>{appointment.reason || '-'}</CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setVisibleAppointmentsModal(false)}>
            Cerrar
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={visiblePrescriptionsModal} onClose={() => setVisiblePrescriptionsModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Recetas del paciente</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Indicaciones</CTableHeaderCell>
                <CTableHeaderCell>Estado</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {recetasPaciente.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={4} className="text-center">
                    No existen recetas registradas para este paciente.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                recetasPaciente.map((prescription, index) => (
                  <CTableRow key={prescription.id}>
                    <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                    <CTableDataCell>{prescription.generalIndications || '-'}</CTableDataCell>
                    <CTableDataCell>
                      {prescription.sentWhatsappAt || prescription.isSent ? (
                        <CBadge color="success">Enviada</CBadge>
                      ) : (
                        <CBadge color="secondary">Pendiente</CBadge>
                      )}
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButton
                        color="success"
                        variant="outline"
                        size="sm"
                        onClick={() => enviarRecetaWhatsapp(prescription)}
                      >
                        Enviar por WhatsApp
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setVisiblePrescriptionsModal(false)}>
            Cerrar
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={visibleCloseModal} onClose={cerrarCerrarGestion} backdrop="static">
        <CModalHeader>
          <CModalTitle>Cerrar gestión de chat</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={12}>
              <CFormLabel>Motivo de cierre</CFormLabel>
              <CFormInput
                name="closeReason"
                value={closeForm.closeReason}
                onChange={handleCloseChange}
                placeholder="Ej: Gestión finalizada correctamente"
              />
            </CCol>

            <CCol md={12}>
              <CFormLabel>Resumen de conversación</CFormLabel>
              <CFormTextarea
                rows={5}
                name="conversationSummary"
                value={closeForm.conversationSummary}
                onChange={handleCloseChange}
                placeholder="Resumen de la gestión realizada..."
              />
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarCerrarGestion}>
            Cancelar
          </CButton>

          <CButton color="danger" onClick={cerrarGestion} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : 'Cerrar gestión'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default ChatEnVivo
