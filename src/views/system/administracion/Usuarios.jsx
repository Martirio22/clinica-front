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

import { userService } from '../../../services/userService'
import { roleService } from '../../../services/roleService'
import { userRoleService } from '../../../services/userRoleService'

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  phone: '',
  isActive: true,
}

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [rolesUsuario, setRolesUsuario] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingRoles, setLoadingRoles] = useState(false)

  const [visible, setVisible] = useState(false)
  const [visibleRoles, setVisibleRoles] = useState(false)

  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(initialForm)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await userService.listar()
      setUsuarios(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los usuarios.')
    } finally {
      setLoading(false)
    }
  }

  const cargarRoles = async () => {
    try {
      const data = await roleService.listar()
      setRoles(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los roles.')
    }
  }

  useEffect(() => {
    cargarUsuarios()
    cargarRoles()
  }, [])

  const abrirModalCrear = () => {
    setEditingUser(null)
    setForm(initialForm)
    setError('')
    setSuccess('')
    setVisible(true)
  }

  const abrirModalEditar = (usuario) => {
    setEditingUser(usuario)

    setForm({
      firstName: usuario.firstName || '',
      lastName: usuario.lastName || '',
      email: usuario.email || '',
      username: usuario.username || '',
      password: '',
      phone: usuario.phone || '',
      isActive: usuario.isActive ?? true,
    })

    setError('')
    setSuccess('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingUser(null)
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
    if (!String(form.firstName || '').trim()) return 'Los nombres son requeridos.'
    if (!String(form.lastName || '').trim()) return 'Los apellidos son requeridos.'
    if (!String(form.email || '').trim()) return 'El email es requerido.'
    if (!String(form.username || '').trim()) return 'El username es requerido.'

    if (!editingUser && !String(form.password || '').trim()) {
      return 'La contraseña es requerida.'
    }

    return ''
  }

  const guardarUsuario = async () => {
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
        firstName: String(form.firstName || '').trim(),
        lastName: String(form.lastName || '').trim(),
        email: String(form.email || '').trim(),
        username: String(form.username || '').trim(),
        phone: String(form.phone || '').trim() || null,
        isActive: form.isActive,
      }

      const password = String(form.password || '').trim()

      if (password) {
        payload.password = password
      }

      if (editingUser) {
        await userService.actualizar(editingUser.id, payload)
        setSuccess('Usuario actualizado correctamente.')
      } else {
        await userService.crear(payload)
        setSuccess('Usuario creado correctamente.')
      }

      cerrarModal()
      await cargarUsuarios()
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Ocurrió un error al guardar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  const eliminarUsuario = async (usuario) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas desactivar al usuario ${usuario.firstName} ${usuario.lastName}?`,
    )

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await userService.eliminar(usuario.id)

      setSuccess('Usuario desactivado correctamente.')
      await cargarUsuarios()
    } catch (err) {
      console.error(err)
      setError('No se pudo desactivar el usuario.')
    } finally {
      setLoading(false)
    }
  }

  const obtenerRolesTexto = (roles = []) => {
    if (!roles || roles.length === 0) return 'Sin roles'
    return roles.map((rol) => rol.name || rol.code).join(', ')
  }

  const abrirModalRoles = async (usuario) => {
    try {
      setSelectedUser(usuario)
      setSelectedRoleId('')
      setRolesUsuario([])
      setError('')
      setSuccess('')
      setVisibleRoles(true)
      setLoadingRoles(true)

      const data = await userRoleService.listarRolesPorUser(usuario.id)
      setRolesUsuario(normalizarRolesUsuario(data || []))
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los roles del usuario.')
    } finally {
      setLoadingRoles(false)
    }
  }

  const cerrarModalRoles = () => {
    setVisibleRoles(false)
    setSelectedUser(null)
    setSelectedRoleId('')
    setRolesUsuario([])
  }

  const asignarRol = async () => {
    if (!selectedUser) return

    if (!selectedRoleId) {
      setError('Seleccione un rol para asignar.')
      return
    }

    try {
      setLoadingRoles(true)
      setError('')
      setSuccess('')

      await userRoleService.asignar({
        userId: selectedUser.id,
        roleId: selectedRoleId,
      })

      const data = await userRoleService.listarRolesPorUser(selectedUser.id)
      setRolesUsuario(normalizarRolesUsuario(data || []))

      await cargarUsuarios()

      setSelectedRoleId('')
      setSuccess('Rol asignado correctamente.')
    } catch (err) {
      console.error(err)
      setError(err?.message || 'No se pudo asignar el rol.')
    } finally {
      setLoadingRoles(false)
    }
  }

  const removerRol = async (role) => {
    if (!selectedUser) return

    const roleId = role.roleId || role.id

    const confirmar = window.confirm(`¿Seguro que deseas quitar el rol ${role.name || role.code}?`)

    if (!confirmar) return

    try {
      setLoadingRoles(true)
      setError('')
      setSuccess('')

      await userRoleService.remover(selectedUser.id, roleId)

      const data = await userRoleService.listarRolesPorUser(selectedUser.id)
      setRolesUsuario(normalizarRolesUsuario(data || []))

      await cargarUsuarios()

      setSuccess('Rol removido correctamente.')
    } catch (err) {
      console.error(err)
      setError('No se pudo remover el rol.')
    } finally {
      setLoadingRoles(false)
    }
  }

  const rolesDisponiblesParaAsignar = roles.filter((role) => {
    const yaAsignado = rolesUsuario.some((r) => {
      const roleIdAsignado = r.roleId || r.id
      return roleIdAsignado === role.id
    })

    return role.isActive && !yaAsignado
  })

  const normalizarRolesUsuario = (data = []) => {
    return data.map((item) => {
      // Caso 1: el backend ya devuelve el rol completo
      if (item.code && item.name) {
        return {
          ...item,
          roleId: item.roleId || item.id,
        }
      }

      // Caso 2: el backend devuelve userRole con roleId
      const role = roles.find((r) => r.id === item.roleId)

      return {
        ...item,
        id: role?.id || item.roleId,
        roleId: item.roleId,
        code: role?.code || '',
        name: role?.name || '',
        description: role?.description || '',
        isActive: role?.isActive ?? item.isActive,
      }
    })
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Administración de Usuarios</strong>

          <CButton color="primary" onClick={abrirModalCrear}>
            Nuevo Usuario
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
                  <CTableHeaderCell scope="col">Nombres</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Apellidos</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Email</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Username</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Teléfono</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Roles</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Estado</CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="text-end">
                    Acciones
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {usuarios.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center">
                      No existen usuarios registrados.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  usuarios.map((usuario, index) => (
                    <CTableRow key={usuario.id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{usuario.firstName}</CTableDataCell>
                      <CTableDataCell>{usuario.lastName}</CTableDataCell>
                      <CTableDataCell>{usuario.email}</CTableDataCell>
                      <CTableDataCell>{usuario.username}</CTableDataCell>
                      <CTableDataCell>{usuario.phone || '-'}</CTableDataCell>
                      <CTableDataCell>{obtenerRolesTexto(usuario.roles)}</CTableDataCell>
                      <CTableDataCell>
                        {usuario.isActive ? (
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
                          onClick={() => abrirModalRoles(usuario)}
                        >
                          Roles
                        </CButton>

                        <CButton
                          color="warning"
                          variant="outline"
                          size="sm"
                          className="me-2"
                          onClick={() => abrirModalEditar(usuario)}
                        >
                          Editar
                        </CButton>

                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          disabled={!usuario.isActive}
                          onClick={() => eliminarUsuario(usuario)}
                        >
                          Desactivar
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

      <CModal visible={visible} onClose={cerrarModal} backdrop="static">
        <CModalHeader>
          <CModalTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <CRow className="g-3">
            <CCol md={6}>
              <CFormLabel>Nombres</CFormLabel>
              <CFormInput
                name="firstName"
                value={form.firstName || ''}
                onChange={handleChange}
                placeholder="Ej: Juan Carlos"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Apellidos</CFormLabel>
              <CFormInput
                name="lastName"
                value={form.lastName || ''}
                onChange={handleChange}
                placeholder="Ej: Pérez López"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Email</CFormLabel>
              <CFormInput
                type="email"
                name="email"
                value={form.email || ''}
                onChange={handleChange}
                placeholder="Ej: usuario@correo.com"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Username</CFormLabel>
              <CFormInput
                name="username"
                value={form.username || ''}
                onChange={handleChange}
                placeholder="Ej: jperez"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>{editingUser ? 'Nueva contraseña' : 'Contraseña'}</CFormLabel>
              <CFormInput
                type="password"
                name="password"
                value={form.password || ''}
                onChange={handleChange}
                placeholder={editingUser ? 'Dejar vacío si no cambia' : 'Ingrese la contraseña'}
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Teléfono</CFormLabel>
              <CFormInput
                name="phone"
                value={form.phone || ''}
                onChange={handleChange}
                placeholder="Ej: 0999999999"
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

          <CButton color="primary" onClick={guardarUsuario} disabled={saving}>
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

      <CModal visible={visibleRoles} onClose={cerrarModalRoles} backdrop="static">
        <CModalHeader>
          <CModalTitle>
            Roles de {selectedUser?.firstName} {selectedUser?.lastName}
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          <CRow className="g-3 mb-3">
            <CCol md={8}>
              <CFormLabel>Rol</CFormLabel>
              <CFormSelect
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
              >
                <option value="">Seleccione un rol</option>

                {rolesDisponiblesParaAsignar.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} - {role.code}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={4} className="d-flex align-items-end">
              <CButton color="primary" className="w-100" onClick={asignarRol}>
                Asignar
              </CButton>
            </CCol>
          </CRow>

          {loadingRoles ? (
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
                  <CTableHeaderCell scope="col">Estado</CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="text-end">
                    Acción
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {rolesUsuario.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={5} className="text-center">
                      El usuario no tiene roles asignados.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  rolesUsuario.map((role, index) => (
                    <CTableRow key={role.id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{role.code}</CTableDataCell>
                      <CTableDataCell>{role.name}</CTableDataCell>
                      <CTableDataCell>
                        {role.isActive ? (
                          <CBadge color="success">Activo</CBadge>
                        ) : (
                          <CBadge color="secondary">Inactivo</CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="text-end">
                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          onClick={() => removerRol(role)}
                        >
                          Quitar
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModalRoles}>
            Cerrar
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Usuarios
