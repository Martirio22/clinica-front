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

import { specialtyService } from '../../../services/specialtyService'

const initialForm = {
  code: '',
  name: '',
  description: '',
  isActive: true,
}

const Especialidades = () => {
  const [especialidades, setEspecialidades] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingSpecialty, setEditingSpecialty] = useState(null)

  const [search, setSearch] = useState('')

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarEspecialidades = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await specialtyService.listar()
      setEspecialidades(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar las especialidades.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarEspecialidades()
  }, [])

  const especialidadesFiltradas = useMemo(() => {
    const texto = String(search || '').toLowerCase().trim()

    if (!texto) return especialidades

    return especialidades.filter((specialty) => {
      const code = String(specialty.code || '').toLowerCase()
      const name = String(specialty.name || '').toLowerCase()
      const description = String(specialty.description || '').toLowerCase()

      return code.includes(texto) || name.includes(texto) || description.includes(texto)
    })
  }, [especialidades, search])

  const abrirModalCrear = () => {
    setEditingSpecialty(null)
    setForm(initialForm)
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const abrirModalEditar = (specialty) => {
    setEditingSpecialty(specialty)

    setForm({
      code: specialty.code || '',
      name: specialty.name || '',
      description: specialty.description || '',
      isActive: specialty.isActive ?? true,
    })

    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingSpecialty(null)
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
    if (!String(form.code || '').trim()) return 'El código de la especialidad es requerido.'
    if (!String(form.name || '').trim()) return 'El nombre de la especialidad es requerido.'

    return ''
  }

  const guardarEspecialidad = async () => {
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

      if (editingSpecialty) {
        await specialtyService.actualizar(editingSpecialty.id, payload)
        setSuccess('Especialidad actualizada correctamente.')
      } else {
        await specialtyService.crear(payload)
        setSuccess('Especialidad creada correctamente.')
      }

      cerrarModal()
      await cargarEspecialidades()
    } catch (err) {
      console.error(err)
      setModalError(err?.message || 'Ocurrió un error al guardar la especialidad.')
    } finally {
      setSaving(false)
    }
  }

  const eliminarEspecialidad = async (specialty) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas inactivar la especialidad ${specialty.name}?`,
    )

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await specialtyService.eliminar(specialty.id)

      setSuccess('Especialidad inactivada correctamente.')
      await cargarEspecialidades()
    } catch (err) {
      console.error(err)
      setError('No se pudo inactivar la especialidad.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Administración de Especialidades</strong>

          <CButton color="primary" onClick={abrirModalCrear}>
            Nueva Especialidad
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
              <CFormLabel>Buscar especialidad</CFormLabel>
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
                {especialidadesFiltradas.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center">
                      No existen especialidades registradas.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  especialidadesFiltradas.map((specialty, index) => (
                    <CTableRow key={specialty.id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{specialty.code}</CTableDataCell>
                      <CTableDataCell>{specialty.name}</CTableDataCell>
                      <CTableDataCell>{specialty.description || '-'}</CTableDataCell>
                      <CTableDataCell>
                        {specialty.isActive ? (
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
                          onClick={() => abrirModalEditar(specialty)}
                        >
                          Editar
                        </CButton>

                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          disabled={!specialty.isActive}
                          onClick={() => eliminarEspecialidad(specialty)}
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
          <CModalTitle>
            {editingSpecialty ? 'Editar Especialidad' : 'Nueva Especialidad'}
          </CModalTitle>
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
                placeholder="Ej: CARD"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Nombre</CFormLabel>
              <CFormInput
                name="name"
                value={form.name || ''}
                onChange={handleChange}
                placeholder="Ej: Cardiología"
              />
            </CCol>

            <CCol md={12}>
              <CFormLabel>Descripción</CFormLabel>
              <CFormInput
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                placeholder="Ej: Especialidad encargada del corazón y sistema cardiovascular"
              />
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

          <CButton color="primary" onClick={guardarEspecialidad} disabled={saving}>
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

export default Especialidades
