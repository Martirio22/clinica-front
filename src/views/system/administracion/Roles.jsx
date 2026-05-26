import React, { useEffect, useState } from 'react'
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

import { roleService } from '../../../services/roleService'
import { userService } from '../../../services/userService'

const initialForm = {
  code: '',
  name: '',
  description: '',
  isActive: true,
}

const Roles = () => {
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingRole, setEditingRole] = useState(null)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [visibleUsuarios, setVisibleUsuarios] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [usuariosAsignados, setUsuariosAsignados] = useState([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)

  // Estado del modal de confirmación unificado para Roles
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  })

  const cargarRoles = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await roleService.listar()
      setRoles(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los roles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarRoles()
  }, [])

  const abrirModalCrear = () => {
    setEditingRole(null)
    setForm(initialForm)
    setError('')
    setSuccess('')
    setVisible(true)
  }

  const abrirModalEditar = (role) => {
    setEditingRole(role)
    setForm({
      code: role.code || '',
      name: role.name || '',
      description: role.description || '',
      isActive: role.isActive ?? true,
    })
    setError('')
    setSuccess('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingRole(null)
    setForm(initialForm)
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
    if (!form.code.trim()) return 'El código del rol es requerido.'
    if (!form.name.trim()) return 'El nombre del rol es requerido.'
    return ''
  }

  const guardarRole = async () => {
    try {
      const mensajeValidacion = validarFormulario()
      if (mensajeValidacion) {
        setError(mensajeValidacion)
        return
      }

      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        isActive: form.isActive,
      }

      if (editingRole) {
        await roleService.actualizar(editingRole.id, payload)
        setSuccess('Rol actualizado correctamente.')
      } else {
        await roleService.crear(payload)
        setSuccess('Rol creado correctamente.')
      }

      cerrarModal()
      await cargarRoles()
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Ocurrió un error al guardar el rol.')
    } finally {
      setSaving(false)
    }
  }

  // Modificado: Abre el modal personalizado de CoreUI y soporta alternar ambos estados
  const confirmarAlternarEstadoRol = (role) => {
    const accion = role.isActive ? 'desactivar' : 'activar'
    
    // Si por alguna razón estuviera el de usuarios de fondo, lo ocultamos temporalmente
    const estabaUsuariosAbierto = visibleUsuarios
    if (estabaUsuariosAbierto) setVisibleUsuarios(false)

    setConfirmModal({
      visible: true,
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} Rol`,
      message: `¿Seguro que deseas ${accion} el rol ${role.name}?`,
      onConfirm: () => ejecutarAlternarEstado(role, estabaUsuariosAbierto),
      onCancel: estabaUsuariosAbierto ? () => setVisibleUsuarios(true) : null,
    })
  }

  const ejecutarAlternarEstado = async (role, restaurarUsuarios) => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
    if (restaurarUsuarios) setVisibleUsuarios(true)

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (role.isActive) {
        // Desactivación lógica tradicional
        await roleService.eliminar(role.id)
        setSuccess('Rol desactivado correctamente.')
      } else {
        // Activación lógica usando actualización del estado de vuelta a true
        const payload = {
          code: role.code,
          name: role.name,
          description: role.description,
          isActive: true,
        }
        await roleService.actualizar(role.id, payload)
        setSuccess('Rol activado correctamente.')
      }

      await cargarRoles()
    } catch (err) {
      console.error(err)
      setError('No se pudo cambiar el estado del rol.')
    } finally {
      setLoading(false)
    }
  }

  const cerrarConfirmModal = () => {
    if (confirmModal.onCancel) {
      confirmModal.onCancel()
    }
    setConfirmModal((prev) => ({ ...prev, visible: false }))
  }

  const abrirModalUsuarios = async (role) => {
    try {
      setSelectedRole(role)
      setUsuariosAsignados([])
      setVisibleUsuarios(true)
      setLoadingUsuarios(true)
      setError('')

      const usuarios = await userService.listar()
      const usuariosFiltrados = (usuarios || []).filter((usuario) => {
        const rolesUsuario = usuario.roles || []
        return rolesUsuario.some((rol) => rol.id === role.id || rol.code === role.code)
      })

      setUsuariosAsignados(usuariosFiltrados)
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los usuarios asignados al rol.')
    } finally {
      setLoadingUsuarios(false)
    }
  }

  const cerrarModalUsuarios = () => {
    setVisibleUsuarios(false)
    setSelectedRole(null)
    setUsuariosAsignados([])
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Administración de Roles</strong>
          <CButton color="primary" onClick={abrirModalCrear}>
            Nuevo Rol
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
                {roles.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center">
                      No existen roles registrados.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  roles.map((role, index) => (
                    <CTableRow key={role.id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{role.code}</CTableDataCell>
                      <CTableDataCell>{role.name}</CTableDataCell>
                      <CTableDataCell>{role.description || '-'}</CTableDataCell>
                      <CTableDataCell>
                        {role.isActive ? (
                          <CBadge color="success">Activo</CBadge>
                        ) : (
                          <CBadge color="secondary">Inactivo</CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="text-end">
                        <CButton
                          color="info"
                          variant="outline"
                          size="sm"
                          className="me-2"
                          onClick={() => abrirModalUsuarios(role)}
                        >
                          Usuarios
                        </CButton>

                        <CButton
                          color="warning"
                          variant="outline"
                          size="sm"
                          className="me-2"
                          onClick={() => abrirModalEditar(role)}
                        >
                          Editar
                        </CButton>

                        {/* Modificado: Botón reactivo e inteligente según el estado real */}
                        <CButton
                          color={role.isActive ? 'danger' : 'success'}
                          variant="outline"
                          size="sm"
                          onClick={() => confirmarAlternarEstadoRol(role)}
                        >
                          {role.isActive ? 'Desactivar' : 'Activar'}
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

      {/* MODAL FORMULARIO (CREAR O EDITAR) */}
      <CModal visible={visible} onClose={cerrarModal} backdrop="static">
        <CModalHeader>
          <CModalTitle>{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CRow className="g-3">
            <CCol md={6}>
              <CFormLabel>Código</CFormLabel>
              <CFormInput
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="Ej: ADMIN"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Nombre</CFormLabel>
              <CFormInput
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej: Administrador"
              />
            </CCol>
            <CCol md={12}>
              <CFormLabel>Descripción</CFormLabel>
              <CFormInput
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Descripción del rol"
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
          <CButton color="primary" onClick={guardarRole} disabled={saving}>
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

      {/* MODAL VER USUARIOS ASIGNADOS */}
      <CModal visible={visibleUsuarios} onClose={cerrarModalUsuarios} size="lg" backdrop="static">
        <CModalHeader>
          <CModalTitle>
            Usuarios asignados al rol: {selectedRole?.name}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {loadingUsuarios ? (
            <div className="text-center my-4">
              <CSpinner color="primary" />
            </div>
          ) : (
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell scope="col">#</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Nombres</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Apellidos</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Email</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Username</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Teléfono</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Estado</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {usuariosAsignados.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center">
                      No existen usuarios asignados a este rol.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  usuariosAsignados.map((usuario, index) => (
                    <CTableRow key={usuario.id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{usuario.firstName}</CTableDataCell>
                      <CTableDataCell>{usuario.lastName}</CTableDataCell>
                      <CTableDataCell>{usuario.email}</CTableDataCell>
                      <CTableDataCell>{usuario.username}</CTableDataCell>
                      <CTableDataCell>{usuario.phone || '-'}</CTableDataCell>
                      <CTableDataCell>
                        {usuario.isActive ? (
                          <CBadge color="success">Activo</CBadge>
                        ) : (
                          <CBadge color="secondary">Inactivo</CBadge>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModalUsuarios}>
            Cerrar
          </CButton>
        </CModalFooter>
      </CModal>

      {/* MODAL DE CONFIRMACIÓN ESTILIZADO (Solución al desplazamiento feo) */}
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
          <CButton color={confirmModal.title?.includes('Activar') ? 'success' : 'danger'} onClick={confirmModal.onConfirm}>
            Confirmar
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Roles