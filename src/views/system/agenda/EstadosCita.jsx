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

import { appointmentStatusService } from '../../../services/appointmentStatusService'

const initialForm = {
  code: '',
  name: '',
  description: '',
  isActive: true,
}

const EstadosCita = () => {
  const [estados, setEstados] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingStatus, setEditingStatus] = useState(null)

  const [search, setSearch] = useState('')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarEstados = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await appointmentStatusService.listar()
      setEstados(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los estados de cita.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarEstados()
  }, [])

  const estadosFiltrados = useMemo(() => {
    const texto = String(search || '').toLowerCase().trim()

    if (!texto) return estados

    return estados.filter((status) => {
      const code = String(status.code || '').toLowerCase()
      const name = String(status.name || '').toLowerCase()
      const description = String(status.description || '').toLowerCase()

      return code.includes(texto) || name.includes(texto) || description.includes(texto)
    })
  }, [estados, search])

  const abrirModalCrear = () => {
    setEditingStatus(null)
    setForm(initialForm)
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const abrirModalEditar = (status) => {
    setEditingStatus(status)

    setForm({
      code: status.code || '',
      name: status.name || '',
      description: status.description || '',
      isActive: status.isActive ?? true,
    })

    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingStatus(null)
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
    if (!String(form.code || '').trim()) return 'El código del estado es requerido.'
    if (!String(form.name || '').trim()) return 'El nombre del estado es requerido.'

    return ''
  }

  const guardarEstado = async () => {
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

      if (editingStatus) {
        await appointmentStatusService.actualizar(editingStatus.id, payload)
        setSuccess('Estado de cita actualizado correctamente.')
      } else {
        await appointmentStatusService.crear(payload)
        setSuccess('Estado de cita creado correctamente.')
      }

      cerrarModal()
      await cargarEstados()
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'Ocurrió un error al guardar el estado.')
    } finally {
      setSaving(false)
    }
  }

  const eliminarEstado = async (status) => {
    const confirmar = window.confirm(`¿Seguro que deseas inactivar el estado ${status.name}?`)

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await appointmentStatusService.eliminar(status.id)

      setSuccess('Estado de cita inactivado correctamente.')
      await cargarEstados()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo inactivar el estado de cita.')
    } finally {
      setLoading(false)
    }
  }

  const crearEstadosBase = async () => {
    const estadosBase = [
      {
        code: 'RESERVADA',
        name: 'Pendiente',
        description: 'Cita reservada',
      },
      {
        code: 'CONFIRMADA',
        name: 'Confirmada',
        description: 'Cita confirmada por el paciente',
      },
      {
        code: 'EN_ESPERA',
        name: 'En espera',
        description: 'Cita en espera',
      },
      {
        code: 'CANCELADA',
        name: 'Cancelada',
        description: 'Cita cancelada',
      },
      {
        code: 'COMPLETADA',
        name: 'Completada',
        description: 'Cita atendida correctamente',
      },
      {
        code: 'ATENDIDA',
        name: 'ATENDIDA',
        description: 'La cita ya fue atentida',
      },
      {
        code: 'NO_ASISTIO',
        name: 'No asistió',
        description: 'El paciente no se presentó',
      },
      {
        code: 'REPROGRAMADA',
        name: 'Reprogramada',
        description: 'La cita fue reprogramada',
      },
      {
        code: 'EXPIRADA',
        name: 'Expirada',
        description: 'La cita fue expirada',
      },
    ]

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      for (const estado of estadosBase) {
        const yaExiste = estados.some((item) => item.code === estado.code)

        if (!yaExiste) {
          await appointmentStatusService.crear({
            ...estado,
            isActive: true,
          })
        }
      }

      setSuccess('Estados base creados correctamente.')
      await cargarEstados()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudieron crear los estados base.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Estados de Cita</strong>

          <div>
            <CButton color="info" variant="outline" className="me-2" onClick={crearEstadosBase}>
              Crear estados base
            </CButton>

            <CButton color="primary" onClick={abrirModalCrear}>
              Nuevo estado
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
              <CFormLabel>Buscar estado</CFormLabel>
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
                {estadosFiltrados.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center">
                      No existen estados de cita registrados.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  estadosFiltrados.map((status, index) => (
                    <CTableRow key={status.id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{status.code}</CTableDataCell>
                      <CTableDataCell>{status.name}</CTableDataCell>
                      <CTableDataCell>{status.description || '-'}</CTableDataCell>
                      <CTableDataCell>
                        {status.isActive ? (
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
                          onClick={() => abrirModalEditar(status)}
                        >
                          Editar
                        </CButton>

                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          disabled={!status.isActive}
                          onClick={() => eliminarEstado(status)}
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
          <CModalTitle>{editingStatus ? 'Editar estado de cita' : 'Nuevo estado de cita'}</CModalTitle>
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
                placeholder="Ej: AGENDADA"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Nombre</CFormLabel>
              <CFormInput
                name="name"
                value={form.name || ''}
                onChange={handleChange}
                placeholder="Ej: Agendada"
              />
            </CCol>

            <CCol md={12}>
              <CFormLabel>Descripción</CFormLabel>
              <CFormInput
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                placeholder="Ej: Cita registrada en el sistema"
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

          <CButton color="primary" onClick={guardarEstado} disabled={saving}>
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

export default EstadosCita
