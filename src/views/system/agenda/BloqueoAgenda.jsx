import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom';
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

import { scheduleBlockService } from '../../../services/scheduleBlockService'
import { scheduleBlockTypeService } from '../../../services/scheduleBlockTypeService'
import { doctorService } from '../../../services/doctorService'

const initialForm = {
  doctorId: '',
  blockingTypeId: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  reason: '',
  isActive: true,
}

const BloqueoAgenda = () => {

  const [searchParams] = useSearchParams();
  const doctorIdFromUrl = searchParams.get('doctorId');
  
  const [bloqueos, setBloqueos] = useState([])
  const [medicos, setMedicos] = useState([])
  const [tiposBloqueo, setTiposBloqueo] = useState([])

  const [form, setForm] = useState(initialForm)
  const [editingBlock, setEditingBlock] = useState(null)

  const [filtroDoctorId, setFiltroDoctorId] = useState('')
  const [filtroTipoBloqueoId, setFiltroTipoBloqueoId] = useState('')

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  // Estado estructurado para el modal de confirmación dinámico
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  // Temporizador para desvanecer la alerta de éxito automáticamente
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3500)
      return () => clearTimeout(timer)
    }
  }, [success])

  const cargarMedicos = async () => {
    try {
      const data = await doctorService.listar()
      setMedicos(data || [])
      
      if (doctorIdFromUrl) {
        setFiltroDoctorId(doctorIdFromUrl)
      }
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los médicos.')
    }
  }

  const cargarTiposBloqueo = async () => {
    try {
      const data = await scheduleBlockTypeService.listar()
      setTiposBloqueo(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los tipos de bloqueo.')
    }
  }

  const cargarBloqueos = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await scheduleBlockService.listar()
      setBloqueos(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los bloqueos de agenda.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarMedicos()
    cargarTiposBloqueo()
    cargarBloqueos()
  }, [])

  const bloqueosFiltrados = useMemo(() => {
    return bloqueos.filter((block) => {
      const cumpleDoctor = !filtroDoctorId || block.doctorId === filtroDoctorId
      const cumpleTipo = !filtroTipoBloqueoId || block.blockingTypeId === filtroTipoBloqueoId

      return cumpleDoctor && cumpleTipo
    })
  }, [bloqueos, filtroDoctorId, filtroTipoBloqueoId])

  const obtenerMedico = (doctorId) => {
    return medicos.find((doctor) => doctor.id === doctorId)
  }

  const obtenerNombreMedico = (doctorId) => {
    const doctor = obtenerMedico(doctorId)

    if (!doctor) return '-'

    if (doctor.user) {
      return `${doctor.user.firstName || ''} ${doctor.user.lastName || ''}`.trim()
    }

    if (doctor.firstName || doctor.lastName) {
      return `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()
    }

    if (doctor.professionalRegistry) {
      return `Médico ${doctor.professionalRegistry}`
    }

    return doctor.name || doctor.userId || '-'
  }

  const obtenerTipoBloqueo = (blockingTypeId) => {
    return tiposBloqueo.find((type) => type.id === blockingTypeId)
  }

  const obtenerNombreTipoBloqueo = (block) => {
    if (block.blockingType) {
      return block.blockingType.name || block.blockingType.code || '-'
    }

    const type = obtenerTipoBloqueo(block.blockingTypeId)
    return type?.name || type?.code || '-'
  }

  const formatearFechaHora = (value) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return String(value).replace('T', ' ')
    }

    return date.toLocaleString()
  }

  const obtenerFechaInput = (value) => {
    if (!value) return ''

    return String(value).slice(0, 10)
  }

  const obtenerHoraInput = (value) => {
    if (!value) return ''

    const raw = String(value)

    if (raw.includes('T')) {
      return raw.slice(11, 16)
    }

    return raw.slice(0, 5)
  }

  const armarFechaHora = (date, time) => {
    if (!date || !time) return ''

    const hora = String(time).length === 5 ? `${time}:00` : time
    return `${date}T${hora}`
  }

  const abrirModalCrear = () => {
    setEditingBlock(null)
    setForm({
      ...initialForm,
      doctorId: filtroDoctorId || '', 
      blockingTypeId: filtroTipoBloqueoId || '',
    })
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const abrirModalEditar = (block) => {
    setEditingBlock(block)

    setForm({
      doctorId: block.doctorId || '',
      blockingTypeId: block.blockingTypeId || '',
      startDate: obtenerFechaInput(block.startDate),
      startTime: obtenerHoraInput(block.startDate),
      endDate: obtenerFechaInput(block.endDate),
      endTime: obtenerHoraInput(block.endDate),
      reason: block.reason || '',
      isActive: block.isActive ?? true,
    })

    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingBlock(null)
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

  const configurarDiaCompleto = () => {
    const fecha = form.startDate || new Date().toISOString().slice(0, 10)

    setForm((prev) => ({
      ...prev,
      startDate: fecha,
      endDate: fecha,
      startTime: '00:00',
      endTime: '23:59',
    }))
  }

  const validarFormulario = () => {
    if (!String(form.doctorId || '').trim()) return 'Debe seleccionar un médico.'
    if (!String(form.blockingTypeId || '').trim()) return 'Debe seleccionar un tipo de bloqueo.'
    if (!String(form.startDate || '').trim()) return 'Debe ingresar la fecha de inicio.'
    if (!String(form.startTime || '').trim()) return 'Debe ingresar la hora de inicio.'
    if (!String(form.endDate || '').trim()) return 'Debe ingresar la fecha de fin.'
    if (!String(form.endTime || '').trim()) return 'Debe ingresar la hora de fin.'

    const startDate = armarFechaHora(form.startDate, form.startTime)
    const endDate = armarFechaHora(form.endDate, form.endTime)

    if (new Date(startDate) >= new Date(endDate)) {
      return 'La fecha y hora de inicio debe ser menor que la fecha y hora de fin.'
    }

    return ''
  }

  const guardarBloqueo = async () => {
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
        doctorId: String(form.doctorId || '').trim(),
        blockingTypeId: String(form.blockingTypeId || '').trim(),
        startDate: armarFechaHora(form.startDate, form.startTime),
        endDate: armarFechaHora(form.endDate, form.endTime),
        reason: String(form.reason || '').trim() || null,
        isActive: form.isActive,
      }

      if (editingBlock) {
        await scheduleBlockService.actualizar(editingBlock.id, payload)
        setSuccess('Bloqueo actualizado correctamente.')
      } else {
        await scheduleBlockService.crear(payload)
        setSuccess('Bloqueo creado correctamente.')
      }

      cerrarModal()
      await cargarBloqueos()
    } catch (err) {
      console.error(err)
      setModalError(err?.message || 'Ocurrió un error al guardar el bloqueo.')
    } finally {
      setSaving(false)
    }
  }

  // Prepara y despliega el modal dinámico de confirmación de estado
  const confirmarAlternarEstadoBloqueo = (block) => {
    const accion = block.isActive ? 'inactivar' : 'activar'
    setConfirmModal({
      visible: true,
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} Bloqueo de Agenda`,
      message: `¿Seguro que deseas ${accion} el bloqueo para el doctor ${obtenerNombreMedico(block.doctorId)}?`,
      onConfirm: () => ejecutarAlternarEstado(block),
    })
  }

  const ejecutarAlternarEstado = async (block) => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (block.isActive) {
        await scheduleBlockService.eliminar(block.id)
        setSuccess('Bloqueo inactivado correctamente.')
      } else {
        const payload = {
          doctorId: block.doctorId,
          blockingTypeId: block.blockingTypeId,
          startDate: block.startDate,
          endDate: block.endDate,
          reason: block.reason || null,
          isActive: true,
        }
        await scheduleBlockService.actualizar(block.id, payload)
        setSuccess('Bloqueo activado correctamente.')
      }

      await cargarBloqueos()
    } catch (err) {
      console.error(err)
      setError('No se pudo cambiar el estado del bloqueo de agenda.')
    } finally {
      setLoading(false)
    }
  }

  const cerrarConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Bloqueos de Agenda</strong>

          <CButton color="primary" onClick={abrirModalCrear}>
            Nuevo bloqueo
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

          <CRow className="mb-3 g-3">
            <CCol md={5}>
              <CFormLabel>Filtro: Médico</CFormLabel>
              <CFormSelect
                value={filtroDoctorId}
                onChange={(e) => setFiltroDoctorId(e.target.value)}
              >
                <option value="">Todos los médicos</option>

                {medicos.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {obtenerNombreMedico(doctor.id)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={5}>
              <CFormLabel>Filtro: Tipo de bloqueo</CFormLabel>
              <CFormSelect
                value={filtroTipoBloqueoId}
                onChange={(e) => setFiltroTipoBloqueoId(e.target.value)}
              >
                <option value="">Todos los tipos</option>

                {tiposBloqueo.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name || type.code}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={2} className="d-flex align-items-end">
              <CButton
                color="secondary"
                variant="outline"
                className="w-100"
                onClick={() => {
                  setFiltroDoctorId('')
                  setFiltroTipoBloqueoId('')
                }}
              >
                Limpiar
              </CButton>
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
                  <CTableHeaderCell scope="col">Médico</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Tipo</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Inicio</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Fin</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Motivo</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Estado</CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="text-end">
                    Acciones
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {bloqueosFiltrados.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center">
                      No existen bloqueos de agenda registrados.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  bloqueosFiltrados.map((block, index) => (
                    <CTableRow key={block.id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>

                      <CTableDataCell>{obtenerNombreMedico(block.doctorId)}</CTableDataCell>

                      <CTableDataCell>{obtenerNombreTipoBloqueo(block)}</CTableDataCell>

                      <CTableDataCell>{formatearFechaHora(block.startDate)}</CTableDataCell>

                      <CTableDataCell>{formatearFechaHora(block.endDate)}</CTableDataCell>

                      <CTableDataCell>{block.reason || '-'}</CTableDataCell>

                      <CTableDataCell>
                        {block.isActive ? (
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
                          onClick={() => abrirModalEditar(block)}
                        >
                          Editar
                        </CButton>

                        <CButton
                          color={block.isActive ? 'danger' : 'success'}
                          variant="outline"
                          size="sm"
                          onClick={() => confirmarAlternarEstadoBloqueo(block)}
                        >
                          {block.isActive ? 'Inactivar' : 'Activar'}
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

      {/* MODAL FORMULARIO DE BLOQUEO */}
      <CModal visible={visible} onClose={cerrarModal} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>{editingBlock ? 'Editar bloqueo' : 'Nuevo bloqueo'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={6}>
  <CFormLabel>Médico</CFormLabel>
  <CFormSelect 
    name="doctorId" 
    value={form.doctorId || ''} 
    onChange={handleChange}
    disabled={!!doctorIdFromUrl} 
  >
    <option value="">Seleccione un médico</option>
    {medicos.map((doctor) => (
      <option key={doctor.id} value={doctor.id}>
        {obtenerNombreMedico(doctor.id)}
      </option>
    ))}
  </CFormSelect>
</CCol>

            <CCol md={6}>
              <CFormLabel>Tipo de bloqueo</CFormLabel>
              <CFormSelect
                name="blockingTypeId"
                value={form.blockingTypeId || ''}
                onChange={handleChange}
              >
                <option value="">Seleccione un tipo</option>

                {tiposBloqueo
                  .filter((type) => type.isActive !== false)
                  .map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name || type.code}
                    </option>
                  ))}
              </CFormSelect>
            </CCol>

            <CCol md={3}>
              <CFormLabel>Fecha inicio</CFormLabel>
              <CFormInput
                type="date"
                name="startDate"
                value={form.startDate || ''}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={3}>
              <CFormLabel>Hora inicio</CFormLabel>
              <CFormInput
                type="time"
                name="startTime"
                value={form.startTime || ''}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={3}>
              <CFormLabel>Fecha fin</CFormLabel>
              <CFormInput
                type="date"
                name="endDate"
                value={form.endDate || ''}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={3}>
              <CFormLabel>Hora fin</CFormLabel>
              <CFormInput
                type="time"
                name="endTime"
                value={form.endTime || ''}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={6}>
              <CButton color="info" variant="outline" onClick={configurarDiaCompleto}>
                Bloquear día completo
              </CButton>
            </CCol>

            <CCol md={6}>
              <CFormLabel>Estado</CFormLabel>
              <CFormSelect value={String(form.isActive)} onChange={handleChangeEstado}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </CFormSelect>
            </CCol>

            <CCol md={12}>
              <CFormLabel>Motivo</CFormLabel>
              <CFormInput
                name="reason"
                value={form.reason || ''}
                onChange={handleChange}
                placeholder="Ej: Asuntos personales, vacaciones, reunión..."
              />
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModal}>
            Cancelar
          </CButton>

          <CButton color="primary" onClick={guardarBloqueo} disabled={saving}>
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

      {/* MODAL DE CONFIRMACIÓN DINÁMICO */}
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

export default BloqueoAgenda