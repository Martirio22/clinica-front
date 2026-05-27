
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

import ModalEditarPaciente from './ModalEditarPaciente'

const PerfilPaciente = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [visibleEdit, setVisibleEdit] = useState(false);

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

  const [expandedRows, setExpandedRows] = useState({});

const toggleRow = (id) => {
  setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
};

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
  // 1. Buscar en el mapa (Esto debería funcionar ahora)
  if (doctorId && mapDoctoresById.has(String(doctorId))) {
    return mapDoctoresById.get(String(doctorId))
  }

  // 2. Si no está en el mapa, intentar extraerlo del objeto raw
  if (rawObj?.doctor) {
    // Si el doctor tiene un objeto 'user'
    if (rawObj.doctor.user) {
       return `Dr/a. ${rawObj.doctor.user.firstName || ''} ${rawObj.doctor.user.lastName || ''}`.trim()
    }
  }

  return doctorId ? `Dr/a. (ID desconocido)` : 'No asignado'
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
  // 1. Validar que la receta esté activa
  const isRecetaActive = r.isActive === true;
  if (!isRecetaActive) return false;

  // 2. Validar pertenencia al paciente (Tu lógica actual)
  const pid = r.patientId || r.patient?.id;
  if (pid && String(pid) === String(id)) return true;

  const att = mapAtenciones.get(String(r.medicalAttentionId || ''));
  const attPid = att?.patientId || att?.patient?.id;
  return attPid && String(attPid) === String(id);
});

    const recetasFormateadas = recetasFiltradas.map((r) => {
  const att = mapAtenciones.get(String(r.medicalAttentionId || ''))

  // ✅ Aquí extraemos el userId del doctor que viene en la raíz de la receta
  // O en su defecto, buscamos el del objeto atención
  const doctorUserId = r.doctor?.userId || att?.doctor?.userId || r.doctor?.id;

  return {
    id: r.id,
    date: safeDate(r) !== '-' ? safeDate(r) : safeDate(att),
    // Usamos el userId como identificador para buscar en el mapa
    doctorId: doctorUserId, 
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
  // Busca esta función en tu código actual y cámbiala por esto:
const editarPaciente = () => {
  setVisibleEdit(true); // <--- ESTO ES LO QUE FALTABA
}
  // const crearCita = () => alert(`Aquí puedes crear una cita para el paciente: ${id}`)
  // const verReceta = (receta) => alert(`Aquí puedes ver la receta: ${receta.id}`)
  // const verAtencion = (atencion) => alert(`Aquí puedes ver la atención médica: ${atencion.id}`)
  // const verChat = (chat) => alert(`Aquí puedes ver el chat: ${chat.id}`)
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

            {/* <CButton color="primary" onClick={crearCita}>
              Crear cita
            </CButton> */}
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
              <CTableDataCell>
                {/* APLICAMOS EL CBadge AQUÍ */}
                <CBadge color={badgeEstadoCita(cita.status)}>
                  {cita.status}
                </CBadge>
              </CTableDataCell>
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
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Recetas */}
      {/* Recetas */}
<CCard className="mb-4 shadow-sm border-0">
  <CCardHeader className="bg-white border-bottom d-flex align-items-center justify-content-between">
    <strong>Recetas médicas</strong>
  </CCardHeader>

  <CCardBody>
    <CTable hover responsive align="middle" className="mb-0">
      <CTableHead color="light">
        <CTableRow>
          <CTableHeaderCell className="text-center" style={{ width: '60px' }}>
            #
          </CTableHeaderCell>

          <CTableHeaderCell>Fecha</CTableHeaderCell>

          <CTableHeaderCell>Médico</CTableHeaderCell>

          <CTableHeaderCell>Indicaciones</CTableHeaderCell>

          <CTableHeaderCell
            className="text-center"
            style={{ width: '140px' }}
          >
            Acciones
          </CTableHeaderCell>
        </CTableRow>
      </CTableHead>

      <CTableBody>
        {recetasOrdenadas.length === 0 ? (
          <CTableRow>
            <CTableDataCell colSpan={5} className="text-center py-4">
              <div className="text-medium-emphasis">
                No existen recetas registradas.
              </div>
            </CTableDataCell>
          </CTableRow>
        ) : (
          recetasOrdenadas.map((receta, index) => {
            // Medicamentos activos
            const medicamentosActivos =
              receta._raw.items?.filter((i) => i.isActive === true) || [];

            const tieneMedicamentosActivos =
              medicamentosActivos.length > 0;

            return (
              <React.Fragment key={receta.id}>
                {/* FILA PRINCIPAL */}
                <CTableRow
                  className="border-bottom"
                  style={{
                    transition: 'all .2s ease',
                    backgroundColor: expandedRows[receta.id]
                      ? '#f8f9fa'
                      : '',
                  }}
                >
                  <CTableDataCell className="text-center fw-semibold">
                    {index + 1}
                  </CTableDataCell>

                  <CTableDataCell>
                    <div className="text-dark">
                      {formatDate(receta.date)}
                    </div>
                  </CTableDataCell>

                  <CTableDataCell>
                    <div className="text-dark">
                      {getDoctorName(receta.doctorId, receta._raw)}
                    </div>
                  </CTableDataCell>

                  <CTableDataCell>
                    <div
                      className="text-medium-emphasis"
                      style={{
                        maxWidth: '350px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {receta.instructions}
                    </div>
                  </CTableDataCell>

                  <CTableDataCell className="text-center">
                    {tieneMedicamentosActivos && (
                      <CButton
  size="sm"
  color={expandedRows[receta.id] ? 'danger' : 'primary'}
  className="px-3 fw-semibold rounded-pill shadow-sm border-0"
  style={{
    minWidth: '120px',
    transition: 'all .2s ease',
  }}
  onClick={() => toggleRow(receta.id)}
>
  {expandedRows[receta.id]
    ? 'Ocultar'
    : 'Ver Kardex'}
</CButton>
                    )}
                  </CTableDataCell>
                </CTableRow>

                {/* KARDEX */}
                {expandedRows[receta.id] &&
                  tieneMedicamentosActivos && (
                    <CTableRow>
                      <CTableDataCell
                        colSpan={5}
                        className="p-0 border-0"
                      >
                        <div
                          className="p-4"
                          style={{
                            background:
                              'linear-gradient(to right, #f8fafc, #ffffff)',
                            borderLeft: '4px solid #0d6efd',
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div>
                              <h6 className="mb-1 fw-bold text-primary">
                                Kardex de medicamentos
                              </h6>

                              <small className="text-medium-emphasis">
                                Medicamentos activos de la receta
                              </small>
                            </div>

                            <span className="badge bg-primary">
                              {medicamentosActivos.length} medicamentos
                            </span>
                          </div>

                          <div className="row g-3">
                            {medicamentosActivos.map((item, i) => (
                              <div
                                className="col-md-6"
                                key={i}
                              >
                                <div
                                  className="h-100 p-3 rounded-4 border bg-white shadow-sm"
                                  style={{
                                    transition: 'all .2s ease',
                                  }}
                                >
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                      <div className="fw-bold text-dark fs-6">
                                        {item.medicine}
                                      </div>

                                      <small className="text-medium-emphasis">
                                        Medicamento recetado
                                      </small>
                                    </div>

                                    <span className="badge bg-success">
                                      Activo
                                    </span>
                                  </div>

                                  <hr className="my-3" />

                                  <div className="d-flex flex-column gap-2">
                                    <div className="d-flex justify-content-between">
                                      <span className="text-medium-emphasis">
                                        Dosis:
                                      </span>

                                      <span className="fw-semibold">
                                        {item.dose}
                                      </span>
                                    </div>

                                    <div className="d-flex justify-content-between">
                                      <span className="text-medium-emphasis">
                                        Frecuencia:
                                      </span>

                                      <span className="fw-semibold">
                                        {item.frequency}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )}
              </React.Fragment>
            );
          })
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
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
      {visibleEdit && (
        <ModalEditarPaciente 
          visible={visibleEdit} 
          setVisible={setVisibleEdit} 
          patient={paciente} // Pasamos el paciente actual
          onSave={() => {
            setVisibleEdit(false);
            cargarPaciente(); // Recargamos los datos tras editar
          }}
        />
      )}
    </>
  )
}

export default PerfilPaciente