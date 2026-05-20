import React, { useEffect, useMemo, useState, useCallback } from 'react'
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
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilChevronLeft,
  cilChevronRight,
  cilCalendar,
  cilPlus,
  cilX,
  cilCheckAlt,
  cilBan,
  cilPencil,
  cilInfo,
  cilClock,
  cilUser,
  cilMedicalCross,
} from '@coreui/icons'

import { appointmentService } from '../../../services/appointmentService'
import { appointmentStatusService } from '../../../services/appointmentStatusService'
import { doctorService } from '../../../services/doctorService'
import { specialtyService } from '../../../services/specialtyService'
import { patientService } from '../../../services/patientService'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const initialForm = {
  patientId: '',
  doctorId: '',
  specialtyId: '',
  startDate: '',
  reason: '',
  statusId: '',
}

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayStr() {
  return fmtDate(new Date())
}

function getDiasDelMes(year, month) {
  const primer = new Date(year, month, 1)
  const ultimo = new Date(year, month + 1, 0)
  const offsetLunes = (primer.getDay() + 6) % 7
  const dias = []

  for (let i = 0; i < offsetLunes; i++) {
    dias.push({ date: new Date(year, month, 1 - offsetLunes + i), curMonth: false })
  }
  for (let i = 1; i <= ultimo.getDate(); i++) {
    dias.push({ date: new Date(year, month, i), curMonth: true })
  }
  while (dias.length % 7 !== 0) {
    dias.push({ date: new Date(year, month + 1, dias.length - ultimo.getDate() - offsetLunes + 1), curMonth: false })
  }
  return dias
}

function normalizarFechaHora(value) {
  if (!value) return ''
  return String(value).length === 16 ? `${value}:00` : value
}

function obtenerDateTimeInput(value) {
  if (!value) return ''
  return String(value).slice(0, 16)
}

function formatearFechaHora(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ')
  return date.toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── color helpers ───────────────────────────────────────────────────────────

function getColorEstado(code = '') {
  const c = String(code).toUpperCase()
  if (c.includes('CONFIRM')) return 'success'
  if (c.includes('CANCEL')) return 'danger'
  if (c.includes('NO_SHOW') || c.includes('NO_ASIST')) return 'warning'
  return 'info'
}

// Pill colors rendered inside calendar cells (inline style to avoid CoreUI dependency)
const PILL_STYLES = {
  success: { background: '#d1fae5', color: '#065f46' },
  danger:  { background: '#fee2e2', color: '#991b1b' },
  warning: { background: '#fef3c7', color: '#92400e' },
  info:    { background: '#e0e7ff', color: '#3730a3' },
}

// ─── sub-components ──────────────────────────────────────────────────────────

const CitaPill = ({ cita, statusCode }) => {
  const variant = getColorEstado(statusCode)
  const s = PILL_STYLES[variant] || PILL_STYLES.info
  const hora = cita.startDate ? String(cita.startDate).slice(11, 16) : ''
  return (
    <div
      style={{
        ...s,
        fontSize: 10,
        padding: '1px 5px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: 1.5,
        marginBottom: 1,
      }}
    >
      {hora && <span style={{ fontWeight: 600 }}>{hora} </span>}
      {cita._pacienteNombre || '—'}
    </div>
  )
}

const DiaCell = ({ dia, citas, estados, isSelected, isToday, onClick }) => {
  const visible = citas.slice(0, 2)
  const rest = citas.length - visible.length

  const borderColor = isSelected ? '#6366f1' : isToday ? '#818cf8' : '#e5e7eb'
  const borderWidth = isSelected || isToday ? 2 : 1
  const bg = isSelected ? '#eef2ff' : '#fff'

  return (
    <div
      onClick={onClick}
      style={{
        minHeight: 80,
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: 8,
        padding: '5px 6px',
        cursor: 'pointer',
        background: bg,
        opacity: dia.curMonth ? 1 : 0.35,
        transition: 'border-color .15s, background .15s',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: isToday ? '#6366f1' : 'transparent',
            color: isToday ? '#fff' : 'inherit',
          }}
        >
          {dia.date.getDate()}
        </span>
        {citas.length > 0 && (
          <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>{citas.length}</span>
        )}
      </div>

      {visible.map((c) => {
        const st = estados.find((e) => e.id === c.statusId)
        return <CitaPill key={c.id} cita={c} statusCode={st?.code || ''} />
      })}
      {rest > 0 && (
        <div style={{ fontSize: 10, color: '#6b7280', paddingLeft: 2 }}>+{rest} más</div>
      )}
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

const CalendarioCitas = () => {
  const [citas, setCitas] = useState([])
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [estados, setEstados] = useState([])

  const [form, setForm] = useState(initialForm)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [detalleCita, setDetalleCita] = useState(null)

  const [visible, setVisible] = useState(false)
  const [visibleDetalle, setVisibleDetalle] = useState(false)

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(todayStr())

  const [filtroDoctorId, setFiltroDoctorId] = useState('')
  const [filtroSpecialtyId, setFiltroSpecialtyId] = useState('')
  const [filtroStatusId, setFiltroStatusId] = useState('')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  // ── loaders ──────────────────────────────────────────────────────────────

  const cargarMedicos = async () => {
    try { setMedicos((await doctorService.listar()) || []) }
    catch { setError('No se pudieron cargar los médicos.') }
  }

  const cargarEspecialidades = async () => {
    try { setEspecialidades((await specialtyService.listar()) || []) }
    catch { setError('No se pudieron cargar las especialidades.') }
  }

  const cargarPacientes = async () => {
    try { setPacientes((await patientService.listar()) || []) }
    catch { setError('No se pudieron cargar los pacientes.') }
  }

  const cargarEstados = async () => {
    try { setEstados((await appointmentStatusService.listar()) || []) }
    catch { setError('No se pudieron cargar los estados de cita.') }
  }

  const cargarCitas = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const firstDay = new Date(currentYear, currentMonth, 1)
      const lastDay = new Date(currentYear, currentMonth + 1, 0)
      const data = await appointmentService.listarConFiltros({
        doctorId: filtroDoctorId,
        startDate: `${fmtDate(firstDay)}T00:00:00`,
        endDate: `${fmtDate(lastDay)}T23:59:59`,
      })
      setCitas(data || [])
    } catch (err) {
      setError(err?.data?.message || err?.message || 'No se pudieron cargar las citas.')
    } finally {
      setLoading(false)
    }
  }, [currentYear, currentMonth, filtroDoctorId])

  useEffect(() => {
    cargarMedicos()
    cargarEspecialidades()
    cargarPacientes()
    cargarEstados()
  }, [])

  useEffect(() => { cargarCitas() }, [cargarCitas])

  // ── derived data ──────────────────────────────────────────────────────────

  const citasFiltradas = useMemo(() => {
    return citas.filter((c) => {
      if (filtroSpecialtyId && c.specialtyId !== filtroSpecialtyId) return false
      if (filtroStatusId && c.statusId !== filtroStatusId) return false
      return true
    })
  }, [citas, filtroSpecialtyId, filtroStatusId])

  // Pre-compute patient/doctor names into citas for cheaper rendering
  const citasConNombres = useMemo(() => {
    return citasFiltradas.map((c) => {
      const pac = pacientes.find((p) => p.id === c.patientId)
      const doc = medicos.find((d) => d.id === c.doctorId)
      const esp = especialidades.find((e) => e.id === c.specialtyId)
      return {
        ...c,
        _pacienteNombre: pac ? `${pac.firstName || ''} ${pac.lastName || ''}`.trim() : '-',
        _medicoNombre: doc
          ? (doc.user
            ? `${doc.user.firstName || ''} ${doc.user.lastName || ''}`.trim()
            : `${doc.firstName || ''} ${doc.lastName || ''}`.trim()) || doc.professionalRegistry || '-'
          : '-',
        _especialidadNombre: esp?.name || '-',
      }
    })
  }, [citasFiltradas, pacientes, medicos, especialidades])

  const diasDelMes = useMemo(() => getDiasDelMes(currentYear, currentMonth), [currentYear, currentMonth])

  const citasPorFecha = useMemo(() => {
    const map = {}
    citasConNombres.forEach((c) => {
      const key = String(c.startDate || '').slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(c)
    })
    return map
  }, [citasConNombres])

  const citasDelDia = useMemo(() => {
    return (citasPorFecha[selectedDate] || []).sort((a, b) =>
      String(a.startDate || '').localeCompare(String(b.startDate || ''))
    )
  }, [citasPorFecha, selectedDate])

  // ── navigation ────────────────────────────────────────────────────────────

  const irMesAnterior = () => {
    if (currentMonth === 0) { setCurrentYear((y) => y - 1); setCurrentMonth(11) }
    else setCurrentMonth((m) => m - 1)
  }

  const irMesSiguiente = () => {
    if (currentMonth === 11) { setCurrentYear((y) => y + 1); setCurrentMonth(0) }
    else setCurrentMonth((m) => m + 1)
  }

  const irHoy = () => {
    const hoy = new Date()
    setCurrentYear(hoy.getFullYear())
    setCurrentMonth(hoy.getMonth())
    setSelectedDate(todayStr())
  }

  // ── helpers de lookup ─────────────────────────────────────────────────────

  const obtenerEstado = (statusId) => estados.find((s) => s.id === statusId)
  const obtenerNombreEstado = (statusId) => {
    const s = obtenerEstado(statusId)
    return s?.name || s?.code || '-'
  }

  // ── modal helpers ─────────────────────────────────────────────────────────

  const abrirModalCrear = () => {
    setEditingAppointment(null)
    setForm({ ...initialForm, startDate: `${selectedDate}T00:00` })
    setModalError('')
    setVisible(true)
  }

  const abrirModalEditar = (cita) => {
    setEditingAppointment(cita)
    setForm({
      patientId: cita.patientId || '',
      doctorId: cita.doctorId || '',
      specialtyId: cita.specialtyId || '',
      startDate: obtenerDateTimeInput(cita.startDate),
      reason: cita.reason || '',
      statusId: cita.statusId || '',
    })
    setModalError('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingAppointment(null)
    setForm(initialForm)
    setModalError('')
  }

  const abrirDetalle = async (cita) => {
    try {
      const data = await appointmentService.obtener(cita.id)
      setDetalleCita({ ...data, _cita: cita })
      setVisibleDetalle(true)
    } catch {
      setError('No se pudo cargar el detalle de la cita.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // ── guardar / acciones ────────────────────────────────────────────────────

  const validarFormulario = () => {
    if (!String(form.patientId || '').trim()) return 'Debe seleccionar un paciente.'
    if (!String(form.doctorId || '').trim()) return 'Debe seleccionar un médico.'
    if (!String(form.specialtyId || '').trim()) return 'Debe seleccionar una especialidad.'
    if (!String(form.startDate || '').trim()) return 'Debe seleccionar la fecha y hora.'
    return ''
  }

  const guardarCita = async () => {
    const msg = validarFormulario()
    if (msg) { setModalError(msg); return }
    try {
      setSaving(true)
      setModalError('')
      const payload = {
        patientId: String(form.patientId).trim(),
        doctorId: String(form.doctorId).trim(),
        specialtyId: String(form.specialtyId).trim(),
        startDate: normalizarFechaHora(form.startDate),
        reason: String(form.reason || '').trim() || null,
      }
      if (form.statusId) payload.statusId = form.statusId
      if (editingAppointment) {
        await appointmentService.actualizar(editingAppointment.id, payload)
        setSuccess('Cita actualizada correctamente.')
      } else {
        await appointmentService.crear(payload)
        setSuccess('Cita creada correctamente.')
      }
      cerrarModal()
      await cargarCitas()
    } catch (err) {
      setModalError(err?.data?.message || err?.message || 'Error al guardar la cita.')
    } finally {
      setSaving(false)
    }
  }

  const buscarEstadoPorCodigos = (codigos = []) =>
    estados.find((s) => codigos.some((c) => String(s.code || '').toUpperCase().includes(c)))

  const cambiarEstado = async (cita, accion) => {
    const mapa = {
      confirmar: ['CONFIRM'],
      cancelar: ['CANCEL'],
      noAsistio: ['NO_SHOW', 'NO_ASIST', 'NOATTEND'],
    }
    const st = buscarEstadoPorCodigos(mapa[accion])
    if (!st) { setError(`No se encontró estado para "${accion}".`); return }
    try {
      setLoading(true)
      await appointmentService.actualizar(cita.id, { statusId: st.id })
      const msgs = { confirmar: 'Cita confirmada.', cancelar: 'Cita cancelada.', noAsistio: 'Marcada como no asistió.' }
      setSuccess(msgs[accion])
      await cargarCitas()
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Error al actualizar la cita.')
    } finally {
      setLoading(false)
    }
  }

  const cancelarCita = async (cita) => {
    if (!window.confirm('¿Seguro que deseas cancelar esta cita?')) return
    await cambiarEstado(cita, 'cancelar')
  }

  const confirmarCita = (cita) => cambiarEstado(cita, 'confirmar')
  const marcarNoAsistio = async (cita) => {
    if (!window.confirm('¿Marcar esta cita como no asistió?')) return
    await cambiarEstado(cita, 'noAsistio')
  }

  // ── selected date label ───────────────────────────────────────────────────

  const [selY, selM, selD] = selectedDate.split('-')
  const selectedLabel = `${parseInt(selD, 10)} de ${MESES[parseInt(selM, 10) - 1]} de ${selY}`

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Calendario de Citas</strong>
          <CButton color="primary" onClick={abrirModalCrear}>
            <CIcon icon={cilPlus} className="me-1" /> Nueva cita
          </CButton>
        </CCardHeader>

        <CCardBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError('')}>{error}</CAlert>
          )}
          {success && (
            <CAlert color="success" dismissible onClose={() => setSuccess('')}>{success}</CAlert>
          )}

          {/* ── Filtros ── */}
          <CRow className="mb-3 g-2">
            <CCol md={4}>
              <CFormLabel className="small mb-1">Médico</CFormLabel>
              <CFormSelect size="sm" value={filtroDoctorId} onChange={(e) => setFiltroDoctorId(e.target.value)}>
                <option value="">Todos los médicos</option>
                {medicos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user
                      ? `${d.user.firstName || ''} ${d.user.lastName || ''}`.trim()
                      : `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.professionalRegistry}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={4}>
              <CFormLabel className="small mb-1">Especialidad</CFormLabel>
              <CFormSelect size="sm" value={filtroSpecialtyId} onChange={(e) => setFiltroSpecialtyId(e.target.value)}>
                <option value="">Todas</option>
                {especialidades.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CFormLabel className="small mb-1">Estado</CFormLabel>
              <CFormSelect size="sm" value={filtroStatusId} onChange={(e) => setFiltroStatusId(e.target.value)}>
                <option value="">Todos</option>
                {estados.map((s) => (
                  <option key={s.id} value={s.id}>{s.name || s.code}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={1} className="d-flex align-items-end">
              <CButton
                color="secondary"
                variant="outline"
                size="sm"
                className="w-100"
                onClick={() => { setFiltroDoctorId(''); setFiltroSpecialtyId(''); setFiltroStatusId('') }}
              >
                <CIcon icon={cilX} />
              </CButton>
            </CCol>
          </CRow>

          {/* ── Cabecera del calendario ── */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              <CButton color="light" size="sm" onClick={irMesAnterior}>
                <CIcon icon={cilChevronLeft} />
              </CButton>
              <CButton color="light" size="sm" onClick={irHoy}>Hoy</CButton>
              <CButton color="light" size="sm" onClick={irMesSiguiente}>
                <CIcon icon={cilChevronRight} />
              </CButton>
              <span className="fw-semibold ms-1" style={{ fontSize: 16 }}>
                {MESES[currentMonth]} {currentYear}
              </span>
            </div>
            <div className="d-flex gap-3" style={{ fontSize: 11, color: '#6b7280' }}>
              {[
                { label: 'Agendada', bg: '#e0e7ff', color: '#3730a3' },
                { label: 'Confirmada', bg: '#d1fae5', color: '#065f46' },
                { label: 'Cancelada', bg: '#fee2e2', color: '#991b1b' },
                { label: 'No asistió', bg: '#fef3c7', color: '#92400e' },
              ].map(({ label, bg, color }) => (
                <span key={label} className="d-flex align-items-center gap-1">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: bg, border: `1px solid ${color}`, display: 'inline-block' }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Grid del calendario ── */}
          {loading ? (
            <div className="text-center py-5"><CSpinner color="primary" /></div>
          ) : (
            <>
              {/* Días de la semana */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                {DIAS_SEMANA.map((d) => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280', padding: '4px 0' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Celdas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {diasDelMes.map(({ date, curMonth }, i) => {
                  const ds = fmtDate(date)
                  return (
                    <DiaCell
                      key={i}
                      dia={{ date, curMonth }}
                      citas={citasPorFecha[ds] || []}
                      estados={estados}
                      isSelected={ds === selectedDate}
                      isToday={ds === todayStr()}
                      onClick={() => setSelectedDate(ds)}
                    />
                  )
                })}
              </div>

              {/* ── Panel de citas del día seleccionado ── */}
              <div className="mt-4 border rounded p-3" style={{ background: '#fafafa' }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <CIcon icon={cilCalendar} style={{ color: '#6366f1' }} />
                    <span className="fw-semibold">{selectedLabel}</span>
                    <CBadge color="light" textColor="dark">{citasDelDia.length} cita{citasDelDia.length !== 1 ? 's' : ''}</CBadge>
                  </div>
                  <CButton color="primary" size="sm" onClick={abrirModalCrear}>
                    <CIcon icon={cilPlus} className="me-1" /> Nueva cita
                  </CButton>
                </div>

                {citasDelDia.length === 0 ? (
                  <div className="text-center py-4 text-muted" style={{ fontSize: 14 }}>
                    <CIcon icon={cilCalendar} style={{ fontSize: 28, display: 'block', margin: '0 auto 8px', opacity: .4 }} />
                    No hay citas registradas para este día
                  </div>
                ) : (
                  citasDelDia.map((cita) => {
                    const st = obtenerEstado(cita.statusId)
                    const color = getColorEstado(st?.code)
                    const hora = String(cita.startDate || '').slice(11, 16)
                    return (
                      <div
                        key={cita.id}
                        className="d-flex align-items-start gap-3 p-3 mb-2 border rounded bg-white"
                      >
                        {/* Hora */}
                        <div style={{ minWidth: 48, textAlign: 'center' }}>
                          <CIcon icon={cilClock} style={{ color: '#6366f1', fontSize: 14 }} />
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{hora || '--:--'}</div>
                        </div>

                        {/* Info */}
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <CIcon icon={cilUser} style={{ fontSize: 13, color: '#6b7280' }} />
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{cita._pacienteNombre}</span>
                            <CBadge color={color}>{obtenerNombreEstado(cita.statusId)}</CBadge>
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280' }} className="d-flex gap-3 flex-wrap">
                            <span>
                              <CIcon icon={cilMedicalCross} style={{ fontSize: 11, marginRight: 3 }} />
                              {cita._medicoNombre}
                            </span>
                            <span>{cita._especialidadNombre}</span>
                            {cita.reason && <span>· {cita.reason}</span>}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="d-flex gap-1 flex-wrap justify-content-end" style={{ minWidth: 180 }}>
                          <CButton color="info" variant="outline" size="sm" onClick={() => abrirDetalle(cita)}>
                            <CIcon icon={cilInfo} />
                          </CButton>
                          <CButton color="warning" variant="outline" size="sm" onClick={() => abrirModalEditar(cita)}>
                            <CIcon icon={cilPencil} />
                          </CButton>
                          <CButton color="success" variant="outline" size="sm" onClick={() => confirmarCita(cita)}>
                            <CIcon icon={cilCheckAlt} />
                          </CButton>
                          <CButton color="danger" variant="outline" size="sm" onClick={() => cancelarCita(cita)}>
                            <CIcon icon={cilBan} />
                          </CButton>
                          <CButton color="dark" variant="outline" size="sm" style={{ fontSize: 11 }} onClick={() => marcarNoAsistio(cita)}>
                            No asistió
                          </CButton>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </CCardBody>
      </CCard>

      {/* ── Modal crear / editar ── */}
      <CModal visible={visible} onClose={cerrarModal} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>{editingAppointment ? 'Editar cita' : 'Nueva cita'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>{modalError}</CAlert>
          )}
          <CRow className="g-3">
            <CCol md={6}>
              <CFormLabel>Paciente</CFormLabel>
              <CFormSelect name="patientId" value={form.patientId} onChange={handleChange}>
                <option value="">Seleccione un paciente</option>
                {pacientes.filter((p) => p.isActive !== false).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} - {p.identification}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>Médico</CFormLabel>
              <CFormSelect name="doctorId" value={form.doctorId} onChange={handleChange}>
                <option value="">Seleccione un médico</option>
                {medicos.filter((d) => d.isActive !== false).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user
                      ? `${d.user.firstName || ''} ${d.user.lastName || ''}`.trim()
                      : `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.professionalRegistry}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>Especialidad</CFormLabel>
              <CFormSelect name="specialtyId" value={form.specialtyId} onChange={handleChange}>
                <option value="">Seleccione una especialidad</option>
                {especialidades.filter((e) => e.isActive !== false).map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>Fecha y hora</CFormLabel>
              <CFormInput type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Estado</CFormLabel>
              <CFormSelect name="statusId" value={form.statusId} onChange={handleChange}>
                <option value="">Estado automático</option>
                {estados.filter((s) => s.isActive !== false).map((s) => (
                  <option key={s.id} value={s.id}>{s.name || s.code}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={12}>
              <CFormLabel>Motivo</CFormLabel>
              <CFormInput name="reason" value={form.reason} onChange={handleChange} placeholder="Ej: Consulta de control anual" />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModal}>Cancelar</CButton>
          <CButton color="primary" onClick={guardarCita} disabled={saving}>
            {saving ? <><CSpinner size="sm" className="me-2" />Guardando...</> : 'Guardar'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal detalle ── */}
      <CModal visible={visibleDetalle} onClose={() => { setVisibleDetalle(false); setDetalleCita(null) }} size="lg">
        <CModalHeader>
          <CModalTitle>Detalle de cita</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {!detalleCita ? (
            <div className="text-center my-4"><CSpinner color="primary" /></div>
          ) : (
            <CRow className="g-2">
              {[
                ['Paciente', detalleCita._cita?._pacienteNombre],
                ['Médico', detalleCita._cita?._medicoNombre],
                ['Especialidad', detalleCita._cita?._especialidadNombre],
                ['Fecha y hora', formatearFechaHora(detalleCita.startDate)],
                ['Estado', detalleCita._cita ? obtenerNombreEstado(detalleCita.statusId) : '-'],
                ['Motivo', detalleCita.reason || '-'],
                ['Origen', detalleCita.origin || '-'],
                ['Observación', detalleCita.observation || '-'],
              ].map(([label, val]) => (
                <CCol md={6} key={label}>
                  <div className="p-2 border rounded" style={{ background: '#f9fafb' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{val || '-'}</div>
                  </div>
                </CCol>
              ))}
            </CRow>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => { setVisibleDetalle(false); setDetalleCita(null) }}>
            Cerrar
          </CButton>
          {detalleCita?._cita && (
            <CButton color="warning" variant="outline" onClick={() => { setVisibleDetalle(false); abrirModalEditar(detalleCita._cita) }}>
              <CIcon icon={cilPencil} className="me-1" /> Editar
            </CButton>
          )}
        </CModalFooter>
      </CModal>
    </>
  )
}

export default CalendarioCitas
