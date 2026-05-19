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

  const eliminarSucursal = async (branch) => {
    const confirmar = window.confirm(`¿Seguro que deseas inactivar la sucursal ${branch.name}?`)

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await branchService.eliminar(branch.id)

      setSuccess('Sucursal inactivada correctamente.')
      await cargarSucursales()
    } catch (err) {
      console.error(err)
      setError('No se pudo inactivar la sucursal.')
    } finally {
      setLoading(false)
    }
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
                  sucursales.map((branch, index) => (
                    <CTableRow key={branch.id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
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
                          color="danger"
                          variant="outline"
                          size="sm"
                          disabled={!branch.isActive}
                          onClick={() => eliminarSucursal(branch)}
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
    </>
  )
}

export default Sucursales
