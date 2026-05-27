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

import { botIntentService } from '../../../services/botIntentService'

const initialForm = {
  code: '',
  name: '',
  description: '',
  isActive: true,
}

const IntencionesIA = () => {
  const navigate = useNavigate()
  const [intenciones, setIntenciones] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingIntent, setEditingIntent] = useState(null)

  const [search, setSearch] = useState('')
  const [visibleForm, setVisibleForm] = useState(false)
  
  // Estado para el modal de confirmación
  const [confirmData, setConfirmData] = useState({ visible: false, message: '', onConfirm: null })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarIntenciones = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await botIntentService.listar()
      setIntenciones(data || [])
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudieron cargar las intenciones IA.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarIntenciones()
  }, [])

  const intencionesFiltradas = useMemo(() => {
    const texto = String(search || '').toLowerCase().trim()
    if (!texto) return intenciones
    return intenciones.filter((intent) => {
      const code = String(intent.code || '').toLowerCase()
      const name = String(intent.name || '').toLowerCase()
      const description = String(intent.description || '').toLowerCase()
      return code.includes(texto) || name.includes(texto) || description.includes(texto)
    })
  }, [intenciones, search])

  const abrirCrear = () => {
    setEditingIntent(null)
    setForm(initialForm)
    setModalError('')
    setVisibleForm(true)
  }

  const abrirEditar = (intent) => {
    setEditingIntent(intent)
    setForm({
      code: intent.code || '',
      name: intent.name || '',
      description: intent.description || '',
      isActive: intent.isActive !== false,
    })
    setModalError('')
    setVisibleForm(true)
  }

  const cerrarForm = () => {
    setVisibleForm(false)
    setEditingIntent(null)
    setForm(initialForm)
    setModalError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validarFormulario = () => {
    if (!String(form.code || '').trim()) return 'El código de la intención es requerido.'
    if (!String(form.name || '').trim()) return 'El nombre de la intención es requerido.'
    if (!String(form.description || '').trim()) return 'La descripción de la intención es requerida.'
    return ''
  }

  const guardarIntencion = async () => {
    try {
      const validation = validarFormulario()
      if (validation) {
        setModalError(validation)
        return
      }
      setSaving(true)
      setModalError('')
      setError('')
      setSuccess('')
      const payload = {
        code: String(form.code || '').trim().toUpperCase().replace(/\s+/g, '_'),
        name: String(form.name || '').trim(),
        description: String(form.description || '').trim(),
        isActive: form.isActive !== false,
      }
      if (editingIntent) {
        await botIntentService.actualizar(editingIntent.id, payload)
        setSuccess('Intención actualizada correctamente.')
      } else {
        await botIntentService.crear(payload)
        setSuccess('Intención creada correctamente.')
      }
      cerrarForm()
      await cargarIntenciones()
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo guardar la intención.')
    } finally {
      setSaving(false)
    }
  }

  const cambiarEstado = (intent) => {
    const nuevoEstado = intent.isActive === false
    setConfirmData({
      visible: true,
      message: `¿Seguro que deseas ${nuevoEstado ? 'activar' : 'inactivar'} esta intención?`,
      onConfirm: async () => {
        try {
          setLoading(true)
          await botIntentService.actualizar(intent.id, {
            code: intent.code,
            name: intent.name,
            description: intent.description,
            isActive: nuevoEstado,
          })
          setSuccess(`Intención ${nuevoEstado ? 'activada' : 'inactivada'} correctamente.`)
          await cargarIntenciones()
        } catch (err) {
          setError(err?.data?.message || err?.message || 'No se pudo cambiar el estado.')
        } finally {
          setLoading(false)
          setConfirmData({ ...confirmData, visible: false })
        }
      }
    })
  }

  const eliminarIntencion = (intent) => {
    setConfirmData({
      visible: true,
      message: `¿Seguro que deseas eliminar la intención ${intent.name}?`,
      onConfirm: async () => {
        try {
          setLoading(true)
          await botIntentService.eliminar(intent.id)
          setSuccess('Intención eliminada correctamente.')
          await cargarIntenciones()
        } catch (err) {
          setError(err?.data?.message || err?.message || 'No se pudo eliminar la intención.')
        } finally {
          setLoading(false)
          setConfirmData({ ...confirmData, visible: false })
        }
      }
    })
  }

  const verEventosIA = (intent) => navigate(`/whatsapp-bot/eventos-ia?botIntentId=${intent.id}`)

  const crearIntencionesBase = async () => {
    // ... lógica de crearIntencionesBase sin cambios ...
    const intencionesBase = [
        { code: 'INFO_CLINICA', name: 'Información de la clínica', description: 'El paciente solicita información general de la clínica.' },
        { code: 'AGENDAR_CITA', name: 'Agendar cita', description: 'El paciente desea reservar una cita médica.' },
        { code: 'CONSULTAR_CITAS', name: 'Consultar citas', description: 'El paciente desea consultar sus citas pasadas o futuras.' },
        { code: 'CONSULTAR_RECETA', name: 'Consultar receta', description: 'El paciente solicita una receta médica emitida.' },
        { code: 'DERIVAR_ESPECIALISTA', name: 'Derivar especialista', description: 'La IA sugiere una especialidad según síntomas.' },
        { code: 'TRANSFERIR_HUMANO', name: 'Transferir a humano', description: 'El paciente solicita atención personalizada por asistente.' },
    ]
    try {
      setLoading(true); setError(''); setSuccess('');
      for (const intent of intencionesBase) {
        const existe = intenciones.some((item) => item.code === intent.code)
        if (!existe) await botIntentService.crear({ ...intent, isActive: true })
      }
      setSuccess('Intenciones base creadas correctamente.'); await cargarIntenciones()
    } catch (err) {
      setError(err?.data?.message || err?.message || 'No se pudieron crear las intenciones base.')
    } finally { setLoading(false) }
  }

  return (
    <>
      {/* Modal de Confirmación */}
      <CModal visible={confirmData.visible} onClose={() => setConfirmData({ ...confirmData, visible: false })}>
        <CModalHeader><CModalTitle>Confirmar acción</CModalTitle></CModalHeader>
        <CModalBody>{confirmData.message}</CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setConfirmData({ ...confirmData, visible: false })}>Cancelar</CButton>
          <CButton color="primary" onClick={confirmData.onConfirm}>Confirmar</CButton>
        </CModalFooter>
      </CModal>

      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Intenciones IA</strong>
          <div>
            <CButton color="info" variant="outline" className="me-2" onClick={crearIntencionesBase}>Crear intenciones base</CButton>
            <CButton color="primary" onClick={abrirCrear}>Nueva intención</CButton>
          </div>
        </CCardHeader>
        <CCardBody>
          {error && <CAlert color="danger" dismissible onClose={() => setError('')}>{error}</CAlert>}
          {success && <CAlert color="success" dismissible onClose={() => setSuccess('')}>{success}</CAlert>}
          <CRow className="mb-3">
            <CCol md={5}>
              <CFormLabel>Buscar intención</CFormLabel>
              <CFormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código, nombre o descripción" />
            </CCol>
            <CCol md={3} className="d-flex align-items-end">
              <CButton color="primary" variant="outline" className="w-100" onClick={cargarIntenciones}>Actualizar</CButton>
            </CCol>
          </CRow>

          {loading ? (
            <div className="text-center my-4"><CSpinner color="primary" /></div>
          ) : (
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Código</CTableHeaderCell>
                  <CTableHeaderCell>Nombre</CTableHeaderCell>
                  <CTableHeaderCell>Descripción</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {intencionesFiltradas.length === 0 ? (
                  <CTableRow><CTableDataCell colSpan={6} className="text-center">No existen intenciones registradas.</CTableDataCell></CTableRow>
                ) : (
                  intencionesFiltradas.map((intent, index) => (
                    <CTableRow key={intent.id}>
                      <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{intent.code || '-'}</CTableDataCell>
                      <CTableDataCell>{intent.name || '-'}</CTableDataCell>
                      <CTableDataCell>{intent.description || '-'}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={intent.isActive === false ? 'danger' : 'success'}>
                          {intent.isActive === false ? 'Inactiva' : 'Activa'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-end">
                        <CButton color="warning" variant="outline" size="sm" className="me-2 mb-1" onClick={() => abrirEditar(intent)}>Editar</CButton>
                        <CButton color="info" variant="outline" size="sm" className="me-2 mb-1" onClick={() => verEventosIA(intent)}>Ver eventos IA</CButton>
                        <CButton color={intent.isActive === false ? 'success' : 'danger'} variant="outline" size="sm" className="me-2 mb-1" onClick={() => cambiarEstado(intent)}>{intent.isActive === false ? 'Activar' : 'Inactivar'}</CButton>
                        {/* <CButton color="danger" variant="outline" size="sm" className="mb-1" onClick={() => eliminarIntencion(intent)}>Eliminar</CButton> */}
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={visibleForm} onClose={cerrarForm} backdrop="static" size="lg">
        <CModalHeader><CModalTitle>{editingIntent ? 'Editar intención' : 'Nueva intención'}</CModalTitle></CModalHeader>
        <CModalBody>
          {modalError && <CAlert color="danger" dismissible onClose={() => setModalError('')}>{modalError}</CAlert>}
          <CRow className="g-3">
            <CCol md={6}><CFormLabel>Código</CFormLabel><CFormInput name="code" value={form.code} onChange={handleChange} placeholder="Ej: AGENDAR_CITA" disabled={editingIntent !== null} /></CCol>
            <CCol md={6}><CFormLabel>Nombre</CFormLabel><CFormInput name="name" value={form.name} onChange={handleChange} placeholder="Ej: Agendar cita" /></CCol>
            <CCol md={12}><CFormLabel>Descripción</CFormLabel><CFormTextarea rows={4} name="description" value={form.description} onChange={handleChange} placeholder="Describe cuándo se usa esta intención." /></CCol>
            <CCol md={6}>
              <CFormLabel>Estado</CFormLabel>
              <select className="form-select" value={String(form.isActive)} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}>
                <option value="true">Activa</option><option value="false">Inactiva</option>
              </select>
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarForm}>Cancelar</CButton>
          <CButton color="primary" onClick={guardarIntencion} disabled={saving}>{saving ? <><CSpinner size="sm" className="me-2" /> Guardando...</> : 'Guardar'}</CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default IntencionesIA