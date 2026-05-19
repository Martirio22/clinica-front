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

import { officeService } from '../../../services/officeService'
import { branchService } from '../../../services/branchService'

const initialForm = {
  branchId: '',
  code: '',
  name: '',
  floor: '',
  isActive: true,
}

const Consultorios = () => {
  const [consultorios, setConsultorios] = useState([])
  const [sucursales, setSucursales] = useState([])

  const [form, setForm] = useState(initialForm)
  const [editingOffice, setEditingOffice] = useState(null)

  const [filtroBranchId, setFiltroBranchId] = useState('')

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarSucursales = async () => {
    try {
      const data = await branchService.listar()
      setSucursales(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar las sucursales.')
    }
  }

  const cargarConsultorios = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await officeService.listar()
      setConsultorios(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los consultorios.')
    } finally {
      setLoading(false)
    }
  }

  const cargarConsultoriosPorSucursal = async (branchId) => {
    try {
      setLoading(true)
      setError('')

      if (!branchId) {
        await cargarConsultorios()
        return
      }

      const data = await officeService.listarPorBranch(branchId)
      setConsultorios(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los consultorios de la sucursal.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarSucursales()
    cargarConsultorios()
  }, [])

  const handleFiltroSucursal = async (e) => {
    const branchId = e.target.value
    setFiltroBranchId(branchId)
    await cargarConsultoriosPorSucursal(branchId)
  }

  const abrirModalCrear = () => {
    setEditingOffice(null)
    setForm({
      ...initialForm,
      branchId: filtroBranchId || '',
    })
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const abrirModalEditar = (office) => {
    setEditingOffice(office)

    setForm({
      branchId: office.branchId || '',
      code: office.code || '',
      name: office.name || '',
      floor: office.floor || '',
      isActive: office.isActive ?? true,
    })

    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingOffice(null)
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
    if (!String(form.branchId || '').trim()) return 'La sucursal es requerida.'
    if (!String(form.code || '').trim()) return 'El código del consultorio es requerido.'
    if (!String(form.name || '').trim()) return 'El nombre del consultorio es requerido.'

    return ''
  }

  const guardarConsultorio = async () => {
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
        branchId: String(form.branchId || '').trim(),
        code: String(form.code || '').trim(),
        name: String(form.name || '').trim(),
        floor: String(form.floor || '').trim() || null,
        isActive: form.isActive,
      }

      if (editingOffice) {
        await officeService.actualizar(editingOffice.id, payload)
        setSuccess('Consultorio actualizado correctamente.')
      } else {
        await officeService.crear(payload)
        setSuccess('Consultorio creado correctamente.')
      }

      cerrarModal()

      if (filtroBranchId) {
        await cargarConsultoriosPorSucursal(filtroBranchId)
      } else {
        await cargarConsultorios()
      }
    } catch (err) {
      console.error(err)
      setModalError(err?.message || 'Ocurrió un error al guardar el consultorio.')
    } finally {
      setSaving(false)
    }
  }

  const eliminarConsultorio = async (office) => {
    const confirmar = window.confirm(`¿Seguro que deseas inactivar el consultorio ${office.name}?`)

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await officeService.eliminar(office.id)

      setSuccess('Consultorio inactivado correctamente.')

      if (filtroBranchId) {
        await cargarConsultoriosPorSucursal(filtroBranchId)
      } else {
        await cargarConsultorios()
      }
    } catch (err) {
      console.error(err)
      setError('No se pudo inactivar el consultorio.')
    } finally {
      setLoading(false)
    }
  }

  const obtenerNombreSucursal = (branchId) => {
    const sucursal = sucursales.find((branch) => branch.id === branchId)
    return sucursal?.name || '-'
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Administración de Consultorios</strong>

          <CButton color="primary" onClick={abrirModalCrear}>
            Nuevo Consultorio
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
              <CFormLabel>Filtrar por sucursal</CFormLabel>
              <CFormSelect value={filtroBranchId} onChange={handleFiltroSucursal}>
                <option value="">Todas las sucursales</option>

                {sucursales.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} - {branch.city}
                  </option>
                ))}
              </CFormSelect>
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
                  <CTableHeaderCell scope="col">Sucursal</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Código</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Nombre</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Piso</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Estado</CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="text-end">
                    Acciones
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {consultorios.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center">
                      No existen consultorios registrados.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  consultorios.map((office, index) => (
                    <CTableRow key={office.id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{obtenerNombreSucursal(office.branchId)}</CTableDataCell>
                      <CTableDataCell>{office.code}</CTableDataCell>
                      <CTableDataCell>{office.name}</CTableDataCell>
                      <CTableDataCell>{office.floor || '-'}</CTableDataCell>
                      <CTableDataCell>
                        {office.isActive ? (
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
                          onClick={() => abrirModalEditar(office)}
                        >
                          Editar
                        </CButton>

                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          disabled={!office.isActive}
                          onClick={() => eliminarConsultorio(office)}
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

      <CModal visible={visible} onClose={cerrarModal} backdrop="static">
        <CModalHeader>
          <CModalTitle>{editingOffice ? 'Editar Consultorio' : 'Nuevo Consultorio'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={12}>
              <CFormLabel>Sucursal</CFormLabel>
              <CFormSelect
                name="branchId"
                value={form.branchId || ''}
                onChange={handleChange}
              >
                <option value="">Seleccione una sucursal</option>

                {sucursales
                  .filter((branch) => branch.isActive)
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} - {branch.city}
                    </option>
                  ))}
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormLabel>Código</CFormLabel>
              <CFormInput
                name="code"
                value={form.code || ''}
                onChange={handleChange}
                placeholder="Ej: CEN-005"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Nombre</CFormLabel>
              <CFormInput
                name="name"
                value={form.name || ''}
                onChange={handleChange}
                placeholder="Ej: Consultorio de Dermatología"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Piso</CFormLabel>
              <CFormInput
                name="floor"
                value={form.floor || ''}
                onChange={handleChange}
                placeholder="Ej: Segundo Piso"
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

          <CButton color="primary" onClick={guardarConsultorio} disabled={saving}>
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

export default Consultorios
