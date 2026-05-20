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

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCheckChange = (e) => {
    const { name, checked } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleChangeEstado = (e) => {
    setForm((prev) => ({
      ...prev,
      isActive: e.target.value === 'true',
    }))
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

      let payload = {}

      if (editingAssistant) {
        payload = {
          userId: String(form.userId || '').trim(),
          canManageChat: form.canManageChat === true,
          canScheduleAppointments: form.canScheduleAppointments === true,
          canAuthorizeCare: form.canAuthorizeCare === true,
          isActive: form.isActive,
        }
      } else {
        payload = {
          userId: String(form.userId || '').trim(),
        }
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

  const eliminarAsistente = async (assistant) => {
    const nombre = obtenerNombreUsuario(assistant.userId)

    const confirmar = window.confirm(`¿Seguro que deseas inactivar al asistente clínico ${nombre}?`)

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await clinicalAssistantService.eliminar(assistant.id)

      setSuccess('Asistente clínico inactivado correctamente.')
      await cargarAsistentes()
      await cargarUsuariosAsistentes()
    } catch (err) {
      console.error(err)
      setError('No se pudo inactivar el asistente clínico.')
    } finally {
      setLoading(false)
    }
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
                  asistentesFiltrados.map((assistant, index) => (
                    <CTableRow key={assistant.id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>

                      <CTableDataCell>
                        <div>{obtenerNombreUsuario(assistant.userId)}</div>
                        <small className="text-body-secondary">
                          {obtenerUsuarioAsistente(assistant.userId)?.email || ''}
                        </small>
                      </CTableDataCell>

                      <CTableDataCell>{renderPermiso(assistant.canManageChat)}</CTableDataCell>

                      <CTableDataCell>
                        {renderPermiso(assistant.canScheduleAppointments)}
                      </CTableDataCell>

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
                          color="danger"
                          variant="outline"
                          size="sm"
                          disabled={!assistant.isActive}
                          onClick={() => eliminarAsistente(assistant)}
                        >
                          Inactivar
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

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
    </>
  )
}

export default AsistentesClinicos
