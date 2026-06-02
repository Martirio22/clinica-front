import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormCheck,
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

import { clinicalAssistantService } from '../../../services/clinicalAssistantService'
import { userService } from '../../../services/userService'

const initialForm = {
  userId: '',
  canManageChat: true,
  canScheduleAppointments: true,
  canAuthorizeCare: true,
  isActive: true,
}

const AsistentesClinicos = () => {
  const [asistentes, setAsistentes] = useState([])
  const [usuariosAsistentes, setUsuariosAsistentes] = useState([])

  const [form, setForm] = useState(initialForm)
  const [editingAssistant, setEditingAssistant] = useState(null)

  const [search, setSearch] = useState('')

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const [page, setPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Estado del modal de confirmación dinámico unificado (Igual a Especialidades)
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  // Temporizador para limpiar alertas de éxito automáticamente
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3500)
      return () => clearTimeout(timer)
    }
  }, [success])

  const cargarUsuariosAsistentes = async () => {
    try {
      const data = await userService.listarAsistentesDisponibles()
      setUsuariosAsistentes(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los usuarios con rol ASISTENTE.')
    }
  }

  const cargarAsistentes = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await clinicalAssistantService.listar()
      setAsistentes(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los asistentes clínicos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarUsuariosAsistentes()
    cargarAsistentes()
  }, [])

  const obtenerUsuarioAsistente = (userId) => {
    return usuariosAsistentes.find((user) => user.id === userId)
  }

  const obtenerNombreUsuario = (userId) => {
    const usuario = obtenerUsuarioAsistente(userId)
    if (!usuario) return '-'
    return `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim()
  }

  const asistentesFiltrados = useMemo(() => {
    const texto = String(search || '').toLowerCase().trim()
    if (!texto) return asistentes

    return asistentes.filter((assistant) => {
      const usuario = obtenerUsuarioAsistente(assistant.userId)
      const nombre = `${usuario?.firstName || ''} ${usuario?.lastName || ''}`.toLowerCase()
      const email = String(usuario?.email || '').toLowerCase()
      const username = String(usuario?.username || '').toLowerCase()

      return nombre.includes(texto) || email.includes(texto) || username.includes(texto)
    })
  }, [asistentes, search, usuariosAsistentes])

   // Cálculo de paginación
  const from = page * itemsPerPage
  const to = Math.min((page + 1) * itemsPerPage, asistentesFiltrados.length)
  const totalPages = Math.ceil(asistentesFiltrados.length / itemsPerPage)

  // Reset de página al buscar o cambiar tamaño
  useEffect(() => {
    setPage(0)
  }, [search, itemsPerPage])

  const usuariosDisponiblesParaCrear = usuariosAsistentes.filter((user) => {
    const yaEsAsistente = asistentes.some((assistant) => assistant.userId === user.id)
    return user.isActive && !yaEsAsistente
  })

  const abrirModalCrear = () => {
    setEditingAssistant(null)
    setForm(initialForm)
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const abrirModalEditar = (assistant) => {
    setEditingAssistant(assistant)
    setForm({
      userId: assistant.userId || '',
      canManageChat: assistant.canManageChat ?? true,
      canScheduleAppointments: assistant.canScheduleAppointments ?? true,
      canAuthorizeCare: assistant.canAuthorizeCare ?? true,
      isActive: assistant.isActive ?? true,
    })
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingAssistant(null)
    setForm(initialForm)
    setModalError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckChange = (e) => {
    const { name, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: checked }))
  }

  const handleChangeEstado = (e) => {
    setForm((prev) => ({ ...prev, isActive: e.target.value === 'true' }))
  }

  const validarFormulario = () => {
    if (!String(form.userId || '').trim()) {
      return 'Debe seleccionar un usuario con rol ASISTENTE.'
    }
    return ''
  }

  const guardarAsistente = async () => {
    try {
      const mensajeValidacion = validarFormulario()
      if (mensajeValidacion) {
        setModalError(mensajeValidacion)
        return
      }

      setSaving(true)
      setModalError('')
      setSuccess('')

      let payload = editingAssistant
        ? {
            userId: String(form.userId || '').trim(),
            canManageChat: form.canManageChat === true,
            canScheduleAppointments: form.canScheduleAppointments === true,
            canAuthorizeCare: form.canAuthorizeCare === true,
            isActive: form.isActive,
          }
        : {
            userId: String(form.userId || '').trim(),
          }

      if (editingAssistant) {
        await clinicalAssistantService.actualizar(editingAssistant.id, payload)
        setSuccess('Asistente clínico actualizado correctamente.')
      } else {
        await clinicalAssistantService.crear(payload)
        setSuccess('Asistente clínico creado correctamente.')
      }

      cerrarModal()
      await cargarAsistentes()
      await cargarUsuariosAsistentes()
    } catch (err) {
      console.error(err)
      setModalError(err?.message || 'Ocurrió un error al guardar el asistente clínico.')
    } finally {
      setSaving(false)
    }
  }

  // --- Lógica de Cambio de Estado Unificado ---
  const confirmarAlternarEstadoAsistente = (assistant) => {
    const accion = assistant.isActive ? 'inactivar' : 'activar'
    const nombre = obtenerNombreUsuario(assistant.userId)
    
    setConfirmModal({
      visible: true,
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} Asistente Clínico`,
      message: `¿Seguro que deseas ${accion} al asistente clínico ${nombre}?`,
      onConfirm: () => ejecutarAlternarEstado(assistant),
    })
  }

  const ejecutarAlternarEstado = async (assistant) => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (assistant.isActive) {
        await clinicalAssistantService.eliminar(assistant.id)
        setSuccess('Asistente clínico inactivado correctamente.')
      } else {
        const payload = {
          userId: assistant.userId,
          canManageChat: assistant.canManageChat,
          canScheduleAppointments: assistant.canScheduleAppointments,
          canAuthorizeCare: assistant.canAuthorizeCare,
          isActive: true,
        }
        await clinicalAssistantService.actualizar(assistant.id, payload)
        setSuccess('Asistente clínico activado correctamente.')
      }

      await cargarAsistentes()
      await cargarUsuariosAsistentes()
    } catch (err) {
      console.error(err)
      setError('No se pudo cambiar el estado del asistente clínico.')
    } finally {
      setLoading(false)
    }
  }

  const cerrarConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
  }

  const renderPermiso = (value) => {
    return value ? <CBadge color="success">Sí</CBadge> : <CBadge color="secondary">No</CBadge>
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Administración de Asistentes Clínicos</strong>
          <CButton color="primary" onClick={abrirModalCrear}>
            Nuevo asistente clínico
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

          <CRow className="mb-3">
            <CCol md={5}>
              <CFormLabel>Buscar asistente clínico</CFormLabel>
              <CFormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email o usuario"
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
                  <CTableHeaderCell scope="col">Asistente</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Gestiona chat</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Agenda citas</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Autoriza atención</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Estado</CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="text-end">
                    Acciones
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
  {asistentesFiltrados.length === 0 ? (
    <CTableRow>
      <CTableDataCell colSpan={7} className="text-center">
        No existen asistentes clínicos registrados.
      </CTableDataCell>
    </CTableRow>
  ) : (
    asistentesFiltrados.slice(from, to).map((assistant, index) => (
      <CTableRow key={assistant.id}>
        <CTableHeaderCell scope="row">{from + index + 1}</CTableHeaderCell>

                      <CTableDataCell>
                        <div>{obtenerNombreUsuario(assistant.userId)}</div>
                        <small className="text-body-secondary">
                          {obtenerUsuarioAsistente(assistant.userId)?.email || ''}
                        </small>
                      </CTableDataCell>

                      <CTableDataCell>{renderPermiso(assistant.canManageChat)}</CTableDataCell>
                      <CTableDataCell>{renderPermiso(assistant.canScheduleAppointments)}</CTableDataCell>
                      <CTableDataCell>{renderPermiso(assistant.canAuthorizeCare)}</CTableDataCell>

                      <CTableDataCell>
                        {assistant.isActive ? (
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
                          onClick={() => abrirModalEditar(assistant)}
                        >
                          Editar
                        </CButton>

                        <CButton
                          color={assistant.isActive ? 'danger' : 'success'}
                          variant="outline"
                          size="sm"
                          onClick={() => confirmarAlternarEstadoAsistente(assistant)}
                        >
                          {assistant.isActive ? 'Inactivar' : 'Activar'}
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
    <CButton color="secondary" variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="me-2">
      Anterior
    </CButton>
    <span className="mx-2">Página {page + 1} de {totalPages || 1}</span>
    <CButton color="secondary" variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
      Siguiente
    </CButton>
  </div>
</div>
        </CCardBody>
      </CCard>

      {/* MODAL FORMULARIO */}
      <CModal visible={visible} onClose={cerrarModal} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>
            {editingAssistant ? 'Editar asistente clínico' : 'Nuevo asistente clínico'}
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={12}>
              <CFormLabel>Usuario asistente</CFormLabel>
              <CFormSelect
                name="userId"
                value={form.userId || ''}
                onChange={handleChange}
                disabled={!!editingAssistant}
              >
                <option value="">Seleccione un usuario con rol ASISTENTE</option>
                {(editingAssistant ? usuariosAsistentes : usuariosDisponiblesParaCrear).map(
                  (user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} - {user.email}
                    </option>
                  ),
                )}
              </CFormSelect>
            </CCol>

            {editingAssistant && (
              <>
                <CCol md={4}>
                  <CFormCheck
                    id="canManageChat"
                    name="canManageChat"
                    label="Puede gestionar chat"
                    checked={form.canManageChat}
                    onChange={handleCheckChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormCheck
                    id="canScheduleAppointments"
                    name="canScheduleAppointments"
                    label="Puede agendar citas"
                    checked={form.canScheduleAppointments}
                    onChange={handleCheckChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormCheck
                    id="canAuthorizeCare"
                    name="canAuthorizeCare"
                    label="Puede autorizar atención"
                    checked={form.canAuthorizeCare}
                    onChange={handleCheckChange}
                  />
                </CCol>

                <CCol md={6}>
                  <CFormLabel>Estado</CFormLabel>
                  <CFormSelect value={String(form.isActive)} onChange={handleChangeEstado}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </CFormSelect>
                </CCol>
              </>
            )}
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModal}>
            Cancelar
          </CButton>
          <CButton color="primary" onClick={guardarAsistente} disabled={saving}>
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

      {/* MODAL DE CONFIRMACIÓN (Exactamente igual al de Especialidades) */}
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

export default AsistentesClinicos