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

import { scheduleBlockTypeService } from '../../../services/scheduleBlockTypeService'

const initialForm = {
  code: '',
  name: '',
  description: '',
  isActive: true,
}

const TiposBloqueo = () => {
  const [tiposBloqueo, setTiposBloqueo] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingType, setEditingType] = useState(null)

  const [search, setSearch] = useState('')

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const [page, setPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Estado estructurado para el modal de confirmación dinámico
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  // Temporizador para desvanecer la alerta de éxito automáticamente (3500ms)
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3500)
      return () => clearTimeout(timer)
    }
  }, [success])

  const cargarTiposBloqueo = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await scheduleBlockTypeService.listar()
      setTiposBloqueo(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los tipos de bloqueo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarTiposBloqueo()
  }, [])

  const tiposFiltrados = useMemo(() => {
    const texto = String(search || '').toLowerCase().trim()

    if (!texto) return tiposBloqueo

    return tiposBloqueo.filter((type) => {
      const code = String(type.code || '').toLowerCase()
      const name = String(type.name || '').toLowerCase()
      const description = String(type.description || '').toLowerCase()

      return code.includes(texto) || name.includes(texto) || description.includes(texto)
    })
  }, [tiposBloqueo, search])

  const from = page * itemsPerPage
  const to = Math.min((page + 1) * itemsPerPage, tiposFiltrados.length)
  const totalPages = Math.ceil(tiposFiltrados.length / itemsPerPage)

  useEffect(() => {
    setPage(0)
  }, [search, itemsPerPage])

  const abrirModalCrear = () => {
    setEditingType(null)
    setForm(initialForm)
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const abrirModalEditar = (type) => {
    setEditingType(type)

    setForm({
      code: type.code || '',
      name: type.name || '',
      description: type.description || '',
      isActive: type.isActive ?? true,
    })

    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingType(null)
    setForm(initialForm)
    setModalError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleChangeEstado = (e) => {
    setForm((prev) => ({
      ...prev,
      isActive: e.target.value === 'true',
    }))
  }

  const validarFormulario = () => {
    if (!String(form.code || '').trim()) return 'El código del tipo de bloqueo es requerido.'
    if (!String(form.name || '').trim()) return 'El nombre del tipo de bloqueo es requerido.'

    return ''
  }

  const guardarTipoBloqueo = async () => {
    try {
      const mensajeValidacion = validarFormulario()

      if (mensajeValidacion) {
        setModalError(mensajeValidacion)
        return
      }

      setSaving(true)
      setModalError('')
      setSuccess('')

      const payload = {
        code: String(form.code || '').trim().toUpperCase(),
        name: String(form.name || '').trim(),
        description: String(form.description || '').trim() || null,
        isActive: form.isActive,
      }

      if (editingType) {
        await scheduleBlockTypeService.actualizar(editingType.id, payload)
        setSuccess('Tipo de bloqueo actualizado correctamente.')
      } else {
        await scheduleBlockTypeService.crear(payload)
        setSuccess('Tipo de bloqueo creado correctamente.')
      }

      cerrarModal()
      await cargarTiposBloqueo()
    } catch (err) {
      console.error(err)
      setModalError(err?.message || 'Ocurrió un error al guardar el tipo de bloqueo.')
    } finally {
      setSaving(false)
    }
  }

  // Prepara y despliega el modal dinámico de confirmación de estado
  const confirmarAlternarEstadoTipoBloqueo = (type) => {
    const accion = type.isActive ? 'inactivar' : 'activar'
    setConfirmModal({
      visible: true,
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} Tipo de Bloqueo`,
      message: `¿Seguro que deseas ${accion} el tipo de bloqueo "${type.name}"?`,
      onConfirm: () => ejecutarAlternarEstado(type),
    })
  }

  const ejecutarAlternarEstado = async (type) => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (type.isActive) {
        await scheduleBlockTypeService.eliminar(type.id)
        setSuccess('Tipo de bloqueo inactivado correctamente.')
      } else {
        const payload = {
          code: type.code,
          name: type.name,
          description: type.description || null,
          isActive: true,
        }
        await scheduleBlockTypeService.actualizar(type.id, payload)
        setSuccess('Tipo de bloqueo activado correctamente.')
      }

      await cargarTiposBloqueo()
    } catch (err) {
      console.error(err)
      setError('No se pudo cambiar el estado del tipo de bloqueo.')
    } finally {
      setLoading(false)
    }
  }

  const cerrarConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
  }

  const crearTiposBloqueoBase = async () => {
    const blocks = [
      { code: 'VACACION', name: 'Vacaciones', description: 'Bloqueo por vacaciones' },
      { code: 'ALMUERZO', name: 'Almuerzo', description: 'Horario de almuerzo' },
      { code: 'REUNION', name: 'Reunión', description: 'Reuniones internas' },
      { code: 'PERSONAL', name: 'Asunto personal', description: 'Motivos personales' },
      { code: 'MANTENIMIENTO', name: 'Mantenimiento', description: 'Bloqueo por mantenimiento' },
    ]

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      for (const block of blocks) {
        const yaExiste = tiposBloqueo.some((item) => item.code === block.code)

        if (!yaExiste) {
          await scheduleBlockTypeService.crear({
            ...block,
            isActive: true,
          })
        }
      }

      setSuccess('Tipos de bloqueo base creados correctamente.')
      await cargarTiposBloqueo()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudieron crear los tipos de bloqueo base.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Tipos de Bloqueo</strong>

          <div className="d-flex gap-2">
            <CButton color="success" variant="outline" onClick={crearTiposBloqueoBase}>
              Crear tipos base
            </CButton>

            <CButton color="primary" onClick={abrirModalCrear}>
              Nuevo tipo
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

          <CRow className="mb-3">
            <CCol md={5}>
              <CFormLabel>Buscar tipo de bloqueo</CFormLabel>
              <CFormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código, nombre o descripción"
              />
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
                  <CTableHeaderCell scope="col">#</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Código</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Nombre</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Descripción</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Estado</CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="text-end">
                    Acciones
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
  {tiposFiltrados.length === 0 ? (
    <CTableRow>
      <CTableDataCell colSpan={6} className="text-center">
        No existen tipos de bloqueo registrados.
      </CTableDataCell>
    </CTableRow>
  ) : (
    tiposFiltrados.slice(from, to).map((type, index) => (
      <CTableRow key={type.id}>
        <CTableHeaderCell scope="row">{from + index + 1}</CTableHeaderCell>
                      <CTableDataCell>{type.code}</CTableDataCell>
                      <CTableDataCell>{type.name}</CTableDataCell>
                      <CTableDataCell>{type.description || '-'}</CTableDataCell>
                      <CTableDataCell>
                        {type.isActive ? (
                          <CBadge color="success">Activo</CBadge>
                        ) : (
                          <CBadge color="secondary">Inactivo</CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="text-end">
                        <CButton
                          color="warning"
                          variant="outline"
                          size="sm"
                          className="me-2"
                          onClick={() => abrirModalEditar(type)}
                        >
                          Editar
                        </CButton>

                        <CButton
                          color={type.isActive ? 'danger' : 'success'}
                          variant="outline"
                          size="sm"
                          onClick={() => confirmarAlternarEstadoTipoBloqueo(type)}
                        >
                          {type.isActive ? 'Inactivar' : 'Activar'}
                        </CButton>
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
    <CButton 
      color="secondary" 
      variant="outline" 
      size="sm" 
      disabled={page === 0} 
      onClick={() => setPage(page - 1)} 
      className="me-2"
    >
      Anterior
    </CButton>
    <span className="mx-2">Pág {page + 1} de {totalPages || 1}</span>
    <CButton 
      color="secondary" 
      variant="outline" 
      size="sm" 
      disabled={page >= totalPages - 1} 
      onClick={() => setPage(page + 1)}
    >
      Siguiente
    </CButton>
  </div>
</div>
        </CCardBody>
      </CCard>

      {/* MODAL FORMULARIO (Crear / Editar) */}
      <CModal visible={visible} onClose={cerrarModal} backdrop="static">
        <CModalHeader>
          <CModalTitle>{editingType ? 'Editar tipo de bloqueo' : 'Nuevo tipo de bloqueo'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={6}>
              <CFormLabel>Código</CFormLabel>
              <CFormInput
                name="code"
                value={form.code || ''}
                onChange={handleChange}
                placeholder="Ej: VACACION"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Nombre</CFormLabel>
              <CFormInput
                name="name"
                value={form.name || ''}
                onChange={handleChange}
                placeholder="Ej: Vacaciones"
              />
            </CCol>

            <CCol md={12}>
              <CFormLabel>Descripción</CFormLabel>
              <CFormInput
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                placeholder="Ej: Bloqueo por vacaciones del médico"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Estado</CFormLabel>
              <CFormSelect value={String(form.isActive)} onChange={handleChangeEstado}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </CFormSelect>
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModal}>
            Cancelar
          </CButton>

          <CButton color="primary" onClick={guardarTipoBloqueo} disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* MODAL DE CONFIRMACIÓN DINÁMICO */}
      <CModal visible={confirmModal.visible} onClose={cerrarConfirmModal} backdrop="static">
        <CModalHeader>
          <CModalTitle>{confirmModal.title}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>{confirmModal.message}</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarConfirmModal}>
            Cancelar
          </CButton>
          <CButton 
            color={confirmModal.title?.includes('Activar') ? 'success' : 'danger'} 
            onClick={confirmModal.onConfirm}
          >
            Confirmar
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default TiposBloqueo