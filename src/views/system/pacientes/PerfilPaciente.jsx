import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

// Servicios base
import { patientService } from '../../../services/patientService'
import { appointmentService } from '../../../services/appointmentService'

// Servicios clínicos
import { medicalAttentionService } from '../../../services/medicalAttentionService'
import { medicalPrescriptionService } from '../../../services/medicalPrescriptionService'

// Conversaciones
import { chatSessionService } from '../../../services/chatSessionService'

// Doctores
import { doctorService } from '../../../services/doctorService'

const PerfilPaciente = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Citas
  const [proximasCitas, setProximasCitas] = useState([])
  const [citasPasadas, setCitasPasadas] = useState([])

  // Historial clínico
  const [atencionesMedicas, setAtencionesMedicas] = useState([])
  const [recetas, setRecetas] = useState([])
  const [conversaciones, setConversaciones] = useState([])

  // Doctores
  const [doctores, setDoctores] = useState([])

  // =========================
  // Helpers
  // =========================
  const normalizarTexto = (value, fallback = '-') => {
    if (value === null || value === undefined) return fallback
    if (typeof value === 'object') return value.name || value.description || value.code || fallback
    const s = String(value).trim()
    return s ? s : fallback
  }

  const safeDate = (obj) => {
    return (
      obj?.date ||
      obj?.startDate ||
      obj?.createdAt ||
      obj?.createdAtUtc ||
      obj?.updatedAt ||
      obj?.registeredAt ||
      obj?.fecha ||
      '-'
    )
  }

  const formatDate = (dateValue) => {
  if (!dateValue || dateValue === '-') return '-'

  try {
    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) return dateValue

    return date.toLocaleString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateValue
  }
}

  // Detecta doctorId aunque venga con distinto nombre
  const extraerDoctorId = (obj) => {
    if (!obj || typeof obj !== 'object') return null

    const direct =
      obj.doctorId ||
      obj.doctor_id ||
      obj.medicoId ||
      obj.physicianId ||
      obj.attendedById ||
      obj.assignedDoctorId ||
      obj.idDoctor ||
      obj.userId ||
      obj.user_id

    if (direct) return String(direct)

    const keys = Object.keys(obj)
    for (const k of keys) {
      const lk = k.toLowerCase()
      if (
        (lk.includes('doctor') || lk.includes('medic') || lk.includes('physician') || lk.includes('user')) &&
        lk.includes('id')
      ) {
        const v = obj[k]
        if (v) return String(v)
      }
    }

    return null
  }

  // Construye nombre desde el objeto doctor que viene del doctorService
  const buildDoctorNameFromDoctorService = (doctorRow) => {
    if (!doctorRow) return ''
    const u = doctorRow.user
    const full = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : ''
    return full ? `Dr/a. ${full}` : ''
  }

  // =========================
  // ✅ Map doctores por ID (doctor.id y doctor.userId)
  // =========================
  const mapDoctoresById = useMemo(() => {
    const map = new Map()

    ;(doctores || []).forEach((d) => {
      const name = buildDoctorNameFromDoctorService(d)
      if (!name) return

      // Doctor table id
      if (d?.id) map.set(String(d.id), name)

      // User id del doctor (MUY importante para tu caso)
      if (d?.userId) map.set(String(d.userId), name)

      // Por si viene user.id
      if (d?.user?.id) map.set(String(d.user.id), name)
    })

    return map
  }, [doctores])

  const getDoctorName = (doctorId, rawObj = null) => {
  // 1. Buscar directo en el mapa
  if (doctorId && mapDoctoresById.has(String(doctorId))) {
    return mapDoctoresById.get(String(doctorId))
  }

  // 2. Buscar dentro del objeto embebido
  if (rawObj) {
    const doctorObj =
      rawObj.doctor ||
      rawObj.medico ||
      rawObj.physician ||
      rawObj.user ||
      rawObj.attendedBy

    // Caso doctor.user.firstName
    if (doctorObj?.user) {
      const full = `${doctorObj.user.firstName || ''} ${doctorObj.user.lastName || ''}`.trim()

      if (full) return `Dr/a. ${full}`
    }

    // Caso firstName directo
    const fullDirect = `${doctorObj?.firstName || ''} ${doctorObj?.lastName || ''}`.trim()

    if (fullDirect) return `Dr/a. ${fullDirect}`

    // Caso name/fullName
    if (doctorObj?.fullName) return doctorObj.fullName
    if (doctorObj?.name) return doctorObj.name
  }

  // 3. fallback
  if (doctorId) return `ID: ${doctorId}`

  return 'No asignado'
}

  // =========================
  // Cargas
  // =========================
  const cargarDoctores = async () => {
    try {
      const data = await doctorService.listar()
      setDoctores(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error cargando doctores:', e)
      setDoctores([])
    }
  }

  const cargarPaciente = async () => {
    const dataPaciente = await patientService.obtener(id)

    if (dataPaciente) {
      let estadoActivo = false
      if (typeof dataPaciente.isActive === 'object' && dataPaciente.isActive !== null) {
        estadoActivo =
          dataPaciente.isActive.code === 'ACTIVE' ||
          dataPaciente.isActive.isActive === true ||
          !!dataPaciente.isActive.name
      } else {
        estadoActivo = Boolean(dataPaciente.isActive)
      }

      let tipoId = dataPaciente.identificationType
      if (typeof tipoId === 'object' && tipoId !== null) {
        tipoId = tipoId.name || tipoId.code || '-'
      }

      setPaciente({
        ...dataPaciente,
        isActive: estadoActivo,
        identificationType: tipoId,
      })
    }
  }

  const cargarCitas = async () => {
    const dataCitas = await appointmentService.listarConFiltros({ patientId: id })

    if (!Array.isArray(dataCitas)) {
      setProximasCitas([])
      setCitasPasadas([])
      return
    }

    const ahora = new Date()

    // ✅ guardamos doctorId, NO el nombre
    const citasFormateadas = dataCitas.map((cita) => {
      let nombreEspecialidad = '-'
      if (cita.specialty) {
        nombreEspecialidad =
          typeof cita.specialty === 'object'
            ? cita.specialty.name || cita.specialty.description || '-'
            : cita.specialty
      } else if (cita.doctor?.specialty) {
        nombreEspecialidad =
          typeof cita.doctor.specialty === 'object'
            ? cita.doctor.specialty.name || cita.doctor.specialty.description || '-'
            : cita.doctor.specialty
      }

      let estadoCita = 'Pendiente'
      if (cita.status) {
        estadoCita = typeof cita.status === 'object' ? cita.status.name || cita.status.description || 'Pendiente' : cita.status
      }

      const fecha = cita.startDate || cita.date || '-'
      const doctorId = extraerDoctorId(cita) || extraerDoctorId(cita?.doctor) || extraerDoctorId(cita?.user)

      return {
  id: cita.id,
  date: fecha,
  doctorId,
  specialty: nombreEspecialidad,
  status: estadoCita,
  _raw: cita,
}
    })

    const proximas = citasFormateadas.filter((c) => new Date(c.date) >= ahora)
    const pasadas = citasFormateadas.filter((c) => new Date(c.date) < ahora)

    setProximasCitas(proximas)
    setCitasPasadas(pasadas)
  }

  const cargarHistorialClinico = async () => {
    // ATENCIONES
    let dataAtenciones = []
    try {
      if (medicalAttentionService?.listarConFiltros) {
        dataAtenciones = await medicalAttentionService.listarConFiltros({ patientId: id })
      } else {
        const all = await medicalAttentionService.listar()
        dataAtenciones = Array.isArray(all)
          ? all.filter((a) => String(a.patientId || a.patient?.id || '') === String(id))
          : []
      }
    } catch (e) {
      console.error('Error cargando atenciones:', e)
      dataAtenciones = []
    }

    const atencionesFormateadas = (dataAtenciones || []).map((a) => {
      // ✅ guardamos doctorId
      const doctorId = extraerDoctorId(a) || extraerDoctorId(a?.doctor) || extraerDoctorId(a?.user)
      return {
        id: a.id,
        date: safeDate(a),
        doctorId, // ✅
        reason: normalizarTexto(a.reasonConsultation || a.reason || a.motivo || a.description, 'Atención médica'),
        _raw: a,
      }
    })

    // RECETAS
    let dataRecetas = []
    try {
      if (medicalPrescriptionService?.listarConFiltros) {
        dataRecetas = await medicalPrescriptionService.listarConFiltros({ patientId: id })
      } else {
        const all = await medicalPrescriptionService.listar()
        dataRecetas = Array.isArray(all) ? all : []
      }
    } catch (e) {
      console.error('Error cargando recetas:', e)
      dataRecetas = []
    }

    // Map atenciones por id para fallback del doctor en receta
    const mapAtenciones = new Map((dataAtenciones || []).map((a) => [String(a.id), a]))

    const recetasFiltradas = (dataRecetas || []).filter((r) => {
      const pid = r.patientId || r.patient?.id
      if (pid && String(pid) === String(id)) return true

      const att = mapAtenciones.get(String(r.medicalAttentionId || ''))
      const attPid = att?.patientId || att?.patient?.id
      return attPid && String(attPid) === String(id)
    })

    const recetasFormateadas = recetasFiltradas.map((r) => {
      const att = mapAtenciones.get(String(r.medicalAttentionId || ''))

      // ✅ doctorId receta con fallback a atención
      const doctorId =
        extraerDoctorId(r) ||
        extraerDoctorId(r?.doctor) ||
        extraerDoctorId(att) ||
        extraerDoctorId(att?.doctor) ||
        extraerDoctorId(att?.user)

      return {
        id: r.id,
        date: safeDate(r) !== '-' ? safeDate(r) : safeDate(att),
        doctorId, // ✅
        instructions: normalizarTexto(r.generalIndications || r.instructions || r.indications, '-'),
        _raw: r,
      }
    })

    // CONVERSACIONES
    let dataChats = []
    try {
      const all = await chatSessionService.listar()
      dataChats = Array.isArray(all) ? all : []
    } catch (e) {
      console.error('Error cargando conversaciones:', e)
      dataChats = []
    }

    // Filtro por paciente o whatsapp
    const whatsappPhone = paciente?.whatsappPhone || paciente?.patientWhatsappNumber || null
    const chatsFiltrados = (dataChats || []).filter((c) => {
      const pid = c.patientId || c.patient?.id
      if (pid && String(pid) === String(id)) return true

      const num = c.patientWhatsappNumber || c.whatsappPhone || c.phoneNumber
      return whatsappPhone && num && String(num) === String(whatsappPhone)
    })

    const chatsFormateados = chatsFiltrados.map((c) => ({
      id: c.id,
      date: safeDate(c),
      channel: normalizarTexto(c.channel || c.platform || 'WhatsApp', 'WhatsApp'),
      lastMessage: normalizarTexto(c.lastMessage || c.lastUserMessage || c.conversationSummary || c.summary, '-'),
      _raw: c,
    }))

    setAtencionesMedicas(atencionesFormateadas)
    setRecetas(recetasFormateadas)
    setConversaciones(chatsFormateados)
  }

  const cargarTodo = async () => {
    try {
      setLoading(true)
      setError('')

      // ✅ paralelo para que cargue rápido (y el render actualizará nombres cuando lleguen doctores)
      await Promise.all([cargarDoctores(), cargarPaciente()])

      await Promise.all([cargarCitas(), cargarHistorialClinico()])
    } catch (err) {
      console.error('Error al cargar la ficha del paciente:', err)
      setError('No se pudo cargar el perfil o el historial del paciente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) cargarTodo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Acciones
  const editarPaciente = () => alert(`Aquí puedes abrir edición o navegar a editar paciente: ${id}`)
  const crearCita = () => alert(`Aquí puedes crear una cita para el paciente: ${id}`)
  const verReceta = (receta) => alert(`Aquí puedes ver la receta: ${receta.id}`)
  const verAtencion = (atencion) => alert(`Aquí puedes ver la atención médica: ${atencion.id}`)
  const verChat = (chat) => alert(`Aquí puedes ver el chat: ${chat.id}`)
  const volver = () => navigate(-1)

  const badgeEstadoCita = (status) => {
    const st = String(status || '').toLowerCase()
    if (st.includes('confirm') || st.includes('active') || st.includes('atendid')) return 'success'
    if (st.includes('cancel')) return 'danger'
    return 'warning'
  }

  const atencionesOrdenadas = useMemo(() => {
    return [...(atencionesMedicas || [])].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [atencionesMedicas])

  const recetasOrdenadas = useMemo(() => {
    return [...(recetas || [])].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [recetas])

  const conversacionesOrdenadas = useMemo(() => {
    return [...(conversaciones || [])].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [conversaciones])

  if (loading) {
    return (
      <div className="text-center my-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error) {
    return (
      <CAlert color="danger" dismissible onClose={() => setError('')}>
        {error}
      </CAlert>
    )
  }

  if (!paciente) {
    return <CAlert color="warning">No se encontró información del paciente.</CAlert>
  }

  return (
    <>
      {/* PERFIL */}
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Perfil del Paciente</strong>

          <div>
            <CButton color="secondary" variant="outline" className="me-2" onClick={volver}>
              Volver
            </CButton>

            <CButton color="warning" variant="outline" className="me-2" onClick={editarPaciente}>
              Editar paciente
            </CButton>

            <CButton color="primary" onClick={crearCita}>
              Crear cita
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          <CRow className="g-3">
            <CCol md={6}>
              <CCard>
                <CCardHeader>
                  <strong>Datos personales</strong>
                </CCardHeader>

                <CCardBody>
                  <p>
                    <strong>Paciente:</strong> {paciente.firstName} {paciente.lastName}
                  </p>

                  <p>
                    <strong>Identificación:</strong> {paciente.identificationType || '-'} {paciente.identification || '-'}
                  </p>

                  <p>
                    <strong>Fecha de nacimiento:</strong> {paciente.birthDate || '-'}
                  </p>

                  <p>
                    <strong>Género:</strong> {paciente.gender || '-'}
                  </p>

                  <p>
                    <strong>Email:</strong> {paciente.email || '-'}
                  </p>

                  <p>
                    <strong>Dirección:</strong> {paciente.address || '-'}
                  </p>

                  <p>
                    <strong>Estado:</strong>{' '}
                    {paciente.isActive ? <CBadge color="success">Activo</CBadge> : <CBadge color="secondary">Inactivo</CBadge>}
                  </p>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={6}>
              <CCard>
                <CCardHeader>
                  <strong>WhatsApp registrado</strong>
                </CCardHeader>

                <CCardBody>
                  <p>
                    <strong>Número:</strong> {paciente.whatsappPhone || '-'}
                  </p>

                  <p className="text-body-secondary">
                    Este número será usado para comunicación por WhatsApp, recordatorios, citas y seguimiento del paciente.
                  </p>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Próximas citas */}
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Próximas citas</strong>
        </CCardHeader>

        <CCardBody>
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell>Médico</CTableHeaderCell>
                <CTableHeaderCell>Especialidad</CTableHeaderCell>
                <CTableHeaderCell>Estado</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {proximasCitas.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    No existen próximas citas registradas.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                proximasCitas.map((cita, index) => (
                  <CTableRow key={cita.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{formatDate(cita.date)}</CTableDataCell>
                    <CTableDataCell>{getDoctorName(cita.doctorId, cita._raw)}</CTableDataCell>
                    <CTableDataCell>{cita.specialty}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={badgeEstadoCita(cita.status)}>{cita.status}</CBadge>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Citas pasadas */}
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Citas pasadas</strong>
        </CCardHeader>

        <CCardBody>
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell>Médico</CTableHeaderCell>
                <CTableHeaderCell>Especialidad</CTableHeaderCell>
                <CTableHeaderCell>Estado</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {citasPasadas.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    No existen citas pasadas registradas.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                citasPasadas.map((cita, index) => (
                  <CTableRow key={cita.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{formatDate(cita.date)}</CTableDataCell>
                    <CTableDataCell>{getDoctorName(cita.doctorId, cita._raw)}</CTableDataCell>
                    <CTableDataCell>{cita.specialty}</CTableDataCell>
                    <CTableDataCell>{cita.status}</CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Atenciones */}
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Atenciones médicas</strong>
        </CCardHeader>

        <CCardBody>
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell>Médico</CTableHeaderCell>
                <CTableHeaderCell>Motivo</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Acción</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {atencionesOrdenadas.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    No existen atenciones médicas registradas.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                atencionesOrdenadas.map((atencion, index) => (
                  <CTableRow key={atencion.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{formatDate(atencion.date)}</CTableDataCell>
                    <CTableDataCell>{getDoctorName(atencion.doctorId, atencion._raw)}</CTableDataCell>
                    <CTableDataCell>{atencion.reason}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButton color="info" variant="outline" size="sm" onClick={() => verAtencion(atencion)}>
                        Ver atención
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Recetas */}
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Recetas</strong>
        </CCardHeader>

        <CCardBody>
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell>Médico</CTableHeaderCell>
                <CTableHeaderCell>Indicaciones</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Acción</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {recetasOrdenadas.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    No existen recetas registradas.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                recetasOrdenadas.map((receta, index) => (
                  <CTableRow key={receta.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{formatDate(receta.date)}</CTableDataCell>
                    <CTableDataCell>{getDoctorName(receta.doctorId, receta._raw)}</CTableDataCell>
                    <CTableDataCell>{receta.instructions}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButton color="info" variant="outline" size="sm" onClick={() => verReceta(receta)}>
                        Ver receta
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Conversaciones */}
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Historial de conversaciones</strong>
        </CCardHeader>

        <CCardBody>
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell>Canal</CTableHeaderCell>
                <CTableHeaderCell>Último mensaje</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Acción</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {conversacionesOrdenadas.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    No existen conversaciones registradas.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                conversacionesOrdenadas.map((chat, index) => (
                  <CTableRow key={chat.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{formatDate(chat.date)}</CTableDataCell>
                    <CTableDataCell>{chat.channel}</CTableDataCell>
                    <CTableDataCell>{chat.lastMessage}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButton color="success" variant="outline" size="sm" onClick={() => verChat(chat)}>
                        Ver chat
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default PerfilPaciente