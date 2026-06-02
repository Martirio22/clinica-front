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

import { branchService } from '../../../services/branchService'

const initialForm = {
  name: '',
  address: '',
  city: '',
  phone: '',
  latitude: '',
  longitude: '',
  isActive: true,
}

const Sucursales = () => {
  const [sucursales, setSucursales] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingBranch, setEditingBranch] = useState(null)

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  // Configuración de paginación
  const [page, setPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Cálculos de paginación
  const from = page * itemsPerPage
  const to = Math.min((page + 1) * itemsPerPage, sucursales.length)
  const totalPages = Math.ceil(sucursales.length / itemsPerPage)

  // Resetear a la primera página cuando cambian los filtros o la lista
  useEffect(() => {
    setPage(0)
  }, [itemsPerPage, sucursales.length])

  // Estado del modal de confirmación unificado (Alineación superior estándar de la app)
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  const cargarSucursales = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await branchService.listar()
      setSucursales(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar las sucursales.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarSucursales()
  }, [])

  const abrirModalCrear = () => {
    setEditingBranch(null)
    setForm(initialForm)
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const abrirModalEditar = (branch) => {
    setEditingBranch(branch)
    setForm({
      name: branch.name || '',
      address: branch.address || '',
      city: branch.city || '',
      phone: branch.phone || '',
      latitude: branch.latitude ?? '',
      longitude: branch.longitude ?? '',
      isActive: branch.isActive ?? true,
    })
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingBranch(null)
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
    if (!String(form.name || '').trim()) return 'El nombre de la sucursal es requerido.'
    if (!String(form.address || '').trim()) return 'La dirección es requerida.'
    if (!String(form.city || '').trim()) return 'La ciudad es requerida.'

    const latitude = String(form.latitude || '').trim()
    const longitude = String(form.longitude || '').trim()

    if (latitude && Number.isNaN(Number(latitude))) {
      return 'La latitud debe ser un número válido.'
    }
    if (longitude && Number.isNaN(Number(longitude))) {
      return 'La longitud debe ser un número válido.'
    }
    return ''
  }

  const guardarSucursal = async () => {
    try {
      const mensajeValidacion = validarFormulario()
      if (mensajeValidacion) {
        setModalError(mensajeValidacion)
        return
      }

      setSaving(true)
      setModalError('')
      setSuccess('')

      const latitude = String(form.latitude || '').trim()
      const longitude = String(form.longitude || '').trim()

      const payload = {
        name: String(form.name || '').trim(),
        address: String(form.address || '').trim(),
        city: String(form.city || '').trim(),
        phone: String(form.phone || '').trim() || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        isActive: form.isActive,
      }

      if (editingBranch) {
        await branchService.actualizar(editingBranch.id, payload)
        setSuccess('Sucursal actualizada correctamente.')
      } else {
        await branchService.crear(payload)
        setSuccess('Sucursal creada correctamente.')
      }

      cerrarModal()
      await cargarSucursales()
    } catch (err) {
      console.error(err)
      setModalError(err?.message || 'Ocurrió un error al guardar la sucursal.')
    } finally {
      setSaving(false)
    }
  }

  // Configura el modal dinámico para Activar o Inactivar
  const confirmarAlternarEstadoBranch = (branch) => {
    const accion = branch.isActive ? 'inactivar' : 'activar'
    setConfirmModal({
      visible: true,
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} Sucursal`,
      message: `¿Seguro que deseas ${accion} la sucursal ${branch.name}?`,
      onConfirm: () => ejecutarAlternarEstado(branch),
    })
  }

  const ejecutarAlternarEstado = async (branch) => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (branch.isActive) {
        // Inactivación lógica tradicional
        await branchService.eliminar(branch.id)
        setSuccess('Sucursal inactivada correctamente.')
      } else {
        // Activación lógica mediante actualización del estado
        const payload = {
          name: branch.name,
          address: branch.address,
          city: branch.city,
          phone: branch.phone,
          latitude: branch.latitude,
          longitude: branch.longitude,
          isActive: true,
        }
        await branchService.actualizar(branch.id, payload)
        setSuccess('Sucursal activada correctamente.')
      }

      await cargarSucursales()
    } catch (err) {
      console.error(err)
      setError('No se pudo cambiar el estado de la sucursal.')
    } finally {
      setLoading(false)
    }
  }

  const cerrarConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
  }

  const usarUbicacionActual = () => {
    if (!navigator.geolocation) {
      setModalError('Tu navegador no permite obtener la ubicación.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }))
      },
      (error) => {
        console.error(error)
        setModalError('No se pudo obtener la ubicación actual.')
      },
    )
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Administración de Sucursales</strong>
          <CButton color="primary" onClick={abrirModalCrear}>
            Nueva Sucursal
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
                  <CTableHeaderCell scope="col">Nombre</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Dirección</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Ciudad</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Teléfono</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Latitud</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Longitud</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Estado</CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="text-end">
                    Acciones
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
  {sucursales.length === 0 ? (
    <CTableRow>
      <CTableDataCell colSpan={9} className="text-center">
        No existen sucursales registradas.
      </CTableDataCell>
    </CTableRow>
  ) : (
    sucursales.slice(from, to).map((branch, index) => (
      <CTableRow key={branch.id}>
        <CTableHeaderCell scope="row">{from + index + 1}</CTableHeaderCell>
                      <CTableDataCell>{branch.name}</CTableDataCell>
                      <CTableDataCell>{branch.address}</CTableDataCell>
                      <CTableDataCell>{branch.city}</CTableDataCell>
                      <CTableDataCell>{branch.phone || '-'}</CTableDataCell>
                      <CTableDataCell>{branch.latitude ?? '-'}</CTableDataCell>
                      <CTableDataCell>{branch.longitude ?? '-'}</CTableDataCell>
                      <CTableDataCell>
                        {branch.isActive ? (
                          <CBadge color="success">Activa</CBadge>
                        ) : (
                          <CBadge color="secondary">Inactiva</CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="text-end">
                        <CButton
                          color="warning"
                          variant="outline"
                          size="sm"
                          className="me-2"
                          onClick={() => abrirModalEditar(branch)}
                        >
                          Editar
                        </CButton>

                        <CButton
                          color={branch.isActive ? 'danger' : 'success'}
                          variant="outline"
                          size="sm"
                          onClick={() => confirmarAlternarEstadoBranch(branch)}
                        >
                          {branch.isActive ? 'Inactivar' : 'Activar'}
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
          <div className="d-flex justify-content-between align-items-center mt-3">
  <div>
    <CFormSelect 
      size="sm" 
      style={{ width: '150px' }}
      value={itemsPerPage}
      onChange={(e) => setItemsPerPage(Number(e.target.value))}
    >
      <option value={5}>5 por página</option>
      <option value={10}>10 por página</option>
      <option value={20}>20 por página</option>
    </CFormSelect>
  </div>
  
  <div>
    <CButton 
      color="secondary" 
      variant="outline" 
      disabled={page === 0} 
      onClick={() => setPage(page - 1)}
      className="me-2"
    >
      Anterior
    </CButton>
    <span className="mx-2">
      Página {page + 1} de {totalPages || 1}
    </span>
    <CButton 
      color="secondary" 
      variant="outline" 
      disabled={page >= totalPages - 1} 
      onClick={() => setPage(page + 1)}
    >
      Siguiente
    </CButton>
  </div>
</div>
        </CCardBody>
      </CCard>

      {/* MODAL FORMULARIO DE CREACIÓN/EDICIÓN */}
      <CModal visible={visible} onClose={cerrarModal} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>{editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={6}>
              <CFormLabel>Nombre</CFormLabel>
              <CFormInput
                name="name"
                value={form.name || ''}
                onChange={handleChange}
                placeholder="Ej: Sucursal Centro"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Ciudad</CFormLabel>
              <CFormInput
                name="city"
                value={form.city || ''}
                onChange={handleChange}
                placeholder="Ej: Quito"
              />
            </CCol>

            <CCol md={12}>
              <CFormLabel>Dirección</CFormLabel>
              <CFormInput
                name="address"
                value={form.address || ''}
                onChange={handleChange}
                placeholder="Ej: Av. 10 de Agosto y Colón"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Teléfono</CFormLabel>
              <CFormInput
                name="phone"
                value={form.phone || ''}
                onChange={handleChange}
                placeholder="Ej: 022158755"
              />
            </CCol>

            <CCol md={3}>
              <CFormLabel>Latitud</CFormLabel>
              <CFormInput
                type="number"
                step="any"
                name="latitude"
                value={form.latitude ?? ''}
                onChange={handleChange}
                placeholder="Ej: -0.210512"
              />
            </CCol>

            <CCol md={3}>
              <CFormLabel>Longitud</CFormLabel>
              <CFormInput
                type="number"
                step="any"
                name="longitude"
                value={form.longitude ?? ''}
                onChange={handleChange}
                placeholder="Ej: -78.499321"
              />
            </CCol>

            <CCol md={6} className="d-flex align-items-end">
              <CButton color="info" variant="outline" onClick={usarUbicacionActual}>
                Usar mi ubicación actual
              </CButton>
            </CCol>

            <CCol md={6}>
              <CFormLabel>Estado</CFormLabel>
              <CFormSelect value={String(form.isActive)} onChange={handleChangeEstado}>
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </CFormSelect>
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModal}>
            Cancelar
          </CButton>
          <CButton color="primary" onClick={guardarSucursal} disabled={saving}>
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

      {/* MODAL DE CONFIRMACIÓN - CORREGIDO (Alineado arriba e idéntico a Roles/Usuarios/Consultorios) */}
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

export default Sucursales