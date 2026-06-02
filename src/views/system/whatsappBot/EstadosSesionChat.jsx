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

import { chatSessionStatusService } from '../../../services/chatSessionStatusService'

const initialForm = {
  code: '',
  name: '',
  description: '',
  isActive: true,
}

const EstadosSesionChat = () => {
  const [statuses, setStatuses] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingStatus, setEditingStatus] = useState(null)

  const [search, setSearch] = useState('')
  const [visibleForm, setVisibleForm] = useState(false)
  
  // Estado para el modal de confirmación
  const [confirmData, setConfirmData] = useState({ visible: false, message: '', onConfirm: null })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const [page, setPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const cargarEstados = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await chatSessionStatusService.listar()
      setStatuses(data || [])
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudieron cargar los estados de sesión.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarEstados()
  }, [])

  const estadosFiltrados = useMemo(() => {
    const texto = String(search || '').toLowerCase().trim()
    if (!texto) return statuses
    return statuses.filter((status) => {
      const code = String(status.code || '').toLowerCase()
      const name = String(status.name || '').toLowerCase()
      const description = String(status.description || '').toLowerCase()
      return code.includes(texto) || name.includes(texto) || description.includes(texto)
    })
  }, [statuses, search])

  const from = page * itemsPerPage
  const to = Math.min((page + 1) * itemsPerPage, estadosFiltrados.length)
  const totalPages = Math.ceil(estadosFiltrados.length / itemsPerPage)

  useEffect(() => {
    setPage(0)
  }, [search])

  const abrirCrear = () => {
    setEditingStatus(null)
    setForm(initialForm)
    setModalError('')
    setVisibleForm(true)
  }

  const abrirEditar = (status) => {
    setEditingStatus(status)
    setForm({
      code: status.code || '',
      name: status.name || '',
      description: status.description || '',
      isActive: status.isActive !== false,
    })
    setModalError('')
    setVisibleForm(true)
  }

  const cerrarForm = () => {
    setVisibleForm(false)
    setEditingStatus(null)
    setForm(initialForm)
    setModalError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validarFormulario = () => {
    if (!String(form.code || '').trim()) return 'El código es requerido.'
    if (!String(form.name || '').trim()) return 'El nombre es requerido.'
    if (!String(form.description || '').trim()) return 'La descripción es requerida.'
    return ''
  }

  const guardarEstado = async () => {
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
      if (editingStatus) {
        await chatSessionStatusService.actualizar(editingStatus.id, payload)
        setSuccess('Estado de sesión actualizado correctamente.')
      } else {
        await chatSessionStatusService.crear(payload)
        setSuccess('Estado de sesión creado correctamente.')
      }
      cerrarForm()
      await cargarEstados()
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo guardar el estado.')
    } finally {
      setSaving(false)
    }
  }

  const cambiarEstado = (status) => {
    const nuevoEstado = status.isActive === false
    setConfirmData({
      visible: true,
      message: `¿Seguro que deseas ${nuevoEstado ? 'activar' : 'inactivar'} este estado?`,
      onConfirm: async () => {
        try {
          setLoading(true)
          await chatSessionStatusService.actualizar(status.id, {
            code: status.code,
            name: status.name,
            description: status.description,
            isActive: nuevoEstado,
          })
          setSuccess(`Estado ${nuevoEstado ? 'activado' : 'inactivado'} correctamente.`)
          await cargarEstados()
        } catch (err) {
          setError(err?.data?.message || err?.message || 'No se pudo cambiar el estado.')
        } finally {
          setLoading(false)
          setConfirmData({ ...confirmData, visible: false })
        }
      }
    })
  }

  const eliminarEstado = (status) => {
    setConfirmData({
      visible: true,
      message: `¿Seguro que deseas eliminar el estado ${status.name}?`,
      onConfirm: async () => {
        try {
          setLoading(true)
          await chatSessionStatusService.eliminar(status.id)
          setSuccess('Estado eliminado correctamente.')
          await cargarEstados()
        } catch (err) {
          setError(err?.data?.message || err?.message || 'No se pudo eliminar el estado.')
        } finally {
          setLoading(false)
          setConfirmData({ ...confirmData, visible: false })
        }
      }
    })
  }

  const crearEstadosBase = async () => {
    const estadosBase = [
      { code: 'BOT_ACTIVO', name: 'Bot activo', description: 'El paciente está siendo atendido por el bot.' },
      { code: 'ESPERANDO_ASISTENTE', name: 'Esperando asistente', description: 'El paciente solicitó atención humana y espera asignación.' },
      { code: 'ATENCION_HUMANA', name: 'Atención humana', description: 'Un asistente clínico está atendiendo al paciente.' },
      { code: 'CERRADA', name: 'Cerrada', description: 'La sesión de chat fue cerrada.' },
      { code: 'TRANSFERIDA_BOT', name: 'Transferida al bot', description: 'El asistente devolvió la conversación al bot.' },
    ]
    try {
      setLoading(true); setError(''); setSuccess('');
      for (const status of estadosBase) {
        const existe = statuses.some((item) => item.code === status.code)
        if (!existe) await chatSessionStatusService.crear({ ...status, isActive: true })
      }
      setSuccess('Estados base creados correctamente.'); await cargarEstados()
    } catch (err) {
      setError(err?.data?.message || err?.message || 'No se pudieron crear los estados base.')
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
          <strong>Estados de Sesión de Chat</strong>
          <div>
            <CButton color="info" variant="outline" className="me-2" onClick={crearEstadosBase}>Crear estados base</CButton>
            <CButton color="primary" onClick={abrirCrear}>Nuevo estado</CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {error && <CAlert color="danger" dismissible onClose={() => setError('')}>{error}</CAlert>}
          {success && <CAlert color="success" dismissible onClose={() => setSuccess('')}>{success}</CAlert>}

          <CRow className="mb-3">
            <CCol md={5}>
              <CFormLabel>Buscar estado</CFormLabel>
              <CFormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código, nombre o descripción" />
            </CCol>
            <CCol md={3} className="d-flex align-items-end">
              <CButton color="primary" variant="outline" className="w-100" onClick={cargarEstados}>Actualizar</CButton>
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
                {estadosFiltrados.length === 0 ? (
                  <CTableRow><CTableDataCell colSpan={6} className="text-center">No existen estados de sesión registrados.</CTableDataCell></CTableRow>
                ) : (
                  estadosFiltrados.slice(from, to).map((status, index) => (
                    <CTableRow key={status.id}>
                      <CTableHeaderCell>{from + index + 1}</CTableHeaderCell>
                      <CTableDataCell>{status.code || '-'}</CTableDataCell>
                      <CTableDataCell>{status.name || '-'}</CTableDataCell>
                      <CTableDataCell>{status.description || '-'}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={status.isActive === false ? 'danger' : 'success'}>
                          {status.isActive === false ? 'Inactivo' : 'Activo'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-end">
                        <CButton color="warning" variant="outline" size="sm" className="me-2 mb-1" onClick={() => abrirEditar(status)}>Editar</CButton>
                        <CButton color={status.isActive === false ? 'success' : 'danger'} variant="outline" size="sm" className="me-2 mb-1" onClick={() => cambiarEstado(status)}>{status.isActive === false ? 'Activar' : 'Inactivar'}</CButton>
                        {/* <CButton color="danger" variant="outline" size="sm" className="mb-1" onClick={() => eliminarEstado(status)}>Eliminar</CButton> */}
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <CFormSelect 
              size="sm" 
              style={{ width: '150px' }} 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
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
        </CCardBody>
      </CCard>

      <CModal visible={visibleForm} onClose={cerrarForm} backdrop="static" size="lg">
        <CModalHeader><CModalTitle>{editingStatus ? 'Editar estado' : 'Nuevo estado'}</CModalTitle></CModalHeader>
        <CModalBody>
          {modalError && <CAlert color="danger" dismissible onClose={() => setModalError('')}>{modalError}</CAlert>}
          <CRow className="g-3">
            <CCol md={6}><CFormLabel>Código</CFormLabel><CFormInput name="code" value={form.code} onChange={handleChange} placeholder="Ej: BOT_ACTIVO" disabled={editingStatus !== null} /></CCol>
            <CCol md={6}><CFormLabel>Nombre</CFormLabel><CFormInput name="name" value={form.name} onChange={handleChange} placeholder="Ej: Bot activo" /></CCol>
            <CCol md={12}><CFormLabel>Descripción</CFormLabel><CFormTextarea rows={4} name="description" value={form.description} onChange={handleChange} placeholder="Describe cuándo se usa este estado." /></CCol>
            <CCol md={6}>
              <CFormLabel>Estado</CFormLabel>
              <select className="form-select" value={String(form.isActive)} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}>
                <option value="true">Activo</option><option value="false">Inactivo</option>
              </select>
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarForm}>Cancelar</CButton>
          <CButton color="primary" onClick={guardarEstado} disabled={saving}>{saving ? <><CSpinner size="sm" className="me-2" /> Guardando...</> : 'Guardar'}</CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default EstadosSesionChat