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

  const eliminarTipoBloqueo = async (type) => {
    const confirmar = window.confirm(`¿Seguro que deseas inactivar el tipo de bloqueo ${type.name}?`)

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await scheduleBlockTypeService.eliminar(type.id)

      setSuccess('Tipo de bloqueo inactivado correctamente.')
      await cargarTiposBloqueo()
    } catch (err) {
      console.error(err)
      setError('No se pudo inactivar el tipo de bloqueo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Tipos de Bloqueo</strong>

          <CButton color="primary" onClick={abrirModalCrear}>
            Nuevo tipo
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
                  tiposFiltrados.map((type, index) => (
                    <CTableRow key={type.id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
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
                          color="danger"
                          variant="outline"
                          size="sm"
                          disabled={!type.isActive}
                          onClick={() => eliminarTipoBloqueo(type)}
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
                placeholder="Ej: VACACIONES"
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
    </>
  )
}

export default TiposBloqueo
