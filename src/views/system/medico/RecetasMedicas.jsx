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
  CFormTextarea,
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

import { medicalAttentionService } from '../../../services/medicalAttentionService'
import { medicalPrescriptionService } from '../../../services/medicalPrescriptionService'
import { medicalPrescriptionDetailService } from '../../../services/medicalPrescriptionDetailService'
import { patientService } from '../../../services/patientService'
import { appointmentService } from '../../../services/appointmentService'

const initialPrescriptionForm = {
  medicalAttentionId: '',
  generalIndications: '',
}

const initialDetailForm = {
  medicalPrescriptionId: '',
  medicine: '',
  dose: '',
  frequency: '',
  duration: '',
  indications: '',
  order: 1,
}

const RecetasMedicas = () => {
  const [atenciones, setAtenciones] = useState([])
  const [recetas, setRecetas] = useState([])
  const [detalles, setDetalles] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [citas, setCitas] = useState([])

  const [prescriptionForm, setPrescriptionForm] = useState(initialPrescriptionForm)
  const [detailForm, setDetailForm] = useState(initialDetailForm)

  const [editingPrescription, setEditingPrescription] = useState(null)
  const [editingDetail, setEditingDetail] = useState(null)
  const [selectedPrescription, setSelectedPrescription] = useState(null)

  const [visiblePrescription, setVisiblePrescription] = useState(false)
  const [visibleDetail, setVisibleDetail] = useState(false)
  const [visiblePreview, setVisiblePreview] = useState(false)

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarAtenciones = async () => {
    try {
      const data = await medicalAttentionService.listar()
      setAtenciones(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar las atenciones médicas.')
    }
  }

  const cargarRecetas = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await medicalPrescriptionService.listar()
      setRecetas(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar las recetas médicas.')
    } finally {
      setLoading(false)
    }
  }

  const cargarDetalles = async () => {
    try {
      const data = await medicalPrescriptionDetailService.listar()
      setDetalles(data || [])
    } catch (err) {
      console.error(err)
      setDetalles([])
    }
  }

  const cargarPacientes = async () => {
    try {
      const data = await patientService.listar()
      setPacientes(data || [])
    } catch (err) {
      console.error(err)
      setPacientes([])
    }
  }

  const cargarCitas = async () => {
    try {
      const data = await appointmentService.listar()
      setCitas(data || [])
    } catch (err) {
      console.error(err)
      setCitas([])
    }
  }

  const cargarTodo = async () => {
    await Promise.all([
      cargarAtenciones(),
      cargarRecetas(),
      cargarDetalles(),
      cargarPacientes(),
      cargarCitas(),
    ])
  }

  useEffect(() => {
    cargarTodo()
  }, [])

  const obtenerAtencion = (medicalAttentionId) => {
    return atenciones.find((attention) => attention.id === medicalAttentionId)
  }

  const obtenerCita = (appointmentId) => {
    return citas.find((appointment) => appointment.id === appointmentId)
  }

  const obtenerPaciente = (patientId) => {
    return pacientes.find((patient) => patient.id === patientId)
  }

  const obtenerPacientePorReceta = (prescription) => {
    const attention = obtenerAtencion(prescription.medicalAttentionId)

    if (!attention) return null

    if (attention.patient) return attention.patient

    const appointment = obtenerCita(attention.appointmentId)

    if (appointment?.patient) return appointment.patient

    return obtenerPaciente(appointment?.patientId)
  }

  const obtenerNombrePacientePorReceta = (prescription) => {
    const patient = obtenerPacientePorReceta(prescription)

    if (!patient) return '-'

    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
  }

  const obtenerTextoAtencion = (attention) => {
    if (!attention) return '-'

    const appointment = obtenerCita(attention.appointmentId)
    const patient = appointment?.patient || obtenerPaciente(appointment?.patientId)
    const patientName = patient
      ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
      : 'Paciente sin identificar'

    return `${patientName} - ${attention.reasonConsultation || 'Atención médica'}`
  }

  const obtenerDetallesPorReceta = (prescriptionId) => {
    return detalles
      .filter((detail) => detail.medicalPrescriptionId === prescriptionId)
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
  }

  const recetasFiltradas = useMemo(() => {
    const texto = String(search || '').toLowerCase().trim()

    if (!texto) return recetas

    return recetas.filter((prescription) => {
      const patientName = obtenerNombrePacientePorReceta(prescription).toLowerCase()
      const indications = String(prescription.generalIndications || '').toLowerCase()
      const detailText = obtenerDetallesPorReceta(prescription.id)
        .map((detail) => `${detail.medicine} ${detail.dose} ${detail.frequency}`)
        .join(' ')
        .toLowerCase()

      return (
        patientName.includes(texto) ||
        indications.includes(texto) ||
        detailText.includes(texto)
      )
    })
  }, [recetas, detalles, search, pacientes, citas, atenciones])

  const abrirModalCrearReceta = () => {
    setEditingPrescription(null)
    setPrescriptionForm(initialPrescriptionForm)
    setModalError('')
    setVisiblePrescription(true)
  }

  const abrirModalEditarReceta = (prescription) => {
    setEditingPrescription(prescription)

    setPrescriptionForm({
      medicalAttentionId: prescription.medicalAttentionId || '',
      generalIndications: prescription.generalIndications || '',
    })

    setModalError('')
    setVisiblePrescription(true)
  }

  const cerrarModalReceta = () => {
    setVisiblePrescription(false)
    setEditingPrescription(null)
    setPrescriptionForm(initialPrescriptionForm)
    setModalError('')
  }

  const handlePrescriptionChange = (e) => {
    const { name, value } = e.target

    setPrescriptionForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validarReceta = () => {
    if (!String(prescriptionForm.medicalAttentionId || '').trim()) {
      return 'Debe seleccionar una atención médica.'
    }

    if (!String(prescriptionForm.generalIndications || '').trim()) {
      return 'Debe ingresar las indicaciones generales.'
    }

    return ''
  }

  const guardarReceta = async () => {
    try {
      const mensajeValidacion = validarReceta()

      if (mensajeValidacion) {
        setModalError(mensajeValidacion)
        return
      }

      setSaving(true)
      setModalError('')
      setSuccess('')

      const payload = {
        medicalAttentionId: String(prescriptionForm.medicalAttentionId || '').trim(),
        generalIndications: String(prescriptionForm.generalIndications || '').trim(),
      }

      if (editingPrescription) {
        await medicalPrescriptionService.actualizar(editingPrescription.id, payload)
        setSuccess('Receta actualizada correctamente.')
      } else {
        await medicalPrescriptionService.crear(payload)
        setSuccess('Receta creada correctamente.')
      }

      cerrarModalReceta()
      await cargarRecetas()
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo guardar la receta.')
    } finally {
      setSaving(false)
    }
  }

  const abrirModalAgregarMedicamento = (prescription) => {
    const currentDetails = obtenerDetallesPorReceta(prescription.id)

    setSelectedPrescription(prescription)
    setEditingDetail(null)

    setDetailForm({
      ...initialDetailForm,
      medicalPrescriptionId: prescription.id,
      order: currentDetails.length + 1,
    })

    setModalError('')
    setVisibleDetail(true)
  }

  const abrirModalEditarMedicamento = (prescription, detail) => {
    setSelectedPrescription(prescription)
    setEditingDetail(detail)

    setDetailForm({
      medicalPrescriptionId: detail.medicalPrescriptionId || prescription.id,
      medicine: detail.medicine || '',
      dose: detail.dose || '',
      frequency: detail.frequency || '',
      duration: detail.duration || '',
      indications: detail.indications || '',
      order: detail.order || 1,
    })

    setModalError('')
    setVisibleDetail(true)
  }

  const cerrarModalDetalle = () => {
    setVisibleDetail(false)
    setSelectedPrescription(null)
    setEditingDetail(null)
    setDetailForm(initialDetailForm)
    setModalError('')
  }

  const handleDetailChange = (e) => {
    const { name, value } = e.target

    setDetailForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validarMedicamento = () => {
    if (!String(detailForm.medicalPrescriptionId || '').trim()) return 'No existe una receta seleccionada.'
    if (!String(detailForm.medicine || '').trim()) return 'Debe ingresar el medicamento.'
    if (!String(detailForm.dose || '').trim()) return 'Debe ingresar la dosis.'
    if (!String(detailForm.frequency || '').trim()) return 'Debe ingresar la frecuencia.'
    if (!String(detailForm.duration || '').trim()) return 'Debe ingresar la duración.'
    if (!String(detailForm.indications || '').trim()) return 'Debe ingresar las indicaciones.'

    return ''
  }

  const guardarMedicamento = async () => {
    try {
      const mensajeValidacion = validarMedicamento()

      if (mensajeValidacion) {
        setModalError(mensajeValidacion)
        return
      }

      setSaving(true)
      setModalError('')
      setSuccess('')

      const payload = {
        medicalPrescriptionId: String(detailForm.medicalPrescriptionId || '').trim(),
        medicine: String(detailForm.medicine || '').trim(),
        dose: String(detailForm.dose || '').trim(),
        frequency: String(detailForm.frequency || '').trim(),
        duration: String(detailForm.duration || '').trim(),
        indications: String(detailForm.indications || '').trim(),
        order: Number(detailForm.order || 1),
      }

      if (editingDetail) {
        await medicalPrescriptionDetailService.actualizar(editingDetail.id, payload)
        setSuccess('Medicamento actualizado correctamente.')
      } else {
        await medicalPrescriptionDetailService.crear(payload)
        setSuccess('Medicamento agregado correctamente.')
      }

      cerrarModalDetalle()
      await cargarDetalles()
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo guardar el medicamento.')
    } finally {
      setSaving(false)
    }
  }

  const eliminarMedicamento = async (detail) => {
    const confirmar = window.confirm(`¿Seguro que deseas eliminar el medicamento ${detail.medicine}?`)

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await medicalPrescriptionDetailService.eliminar(detail.id)

      setSuccess('Medicamento eliminado correctamente.')
      await cargarDetalles()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo eliminar el medicamento.')
    } finally {
      setLoading(false)
    }
  }

  const enviarPorWhatsapp = async (prescription) => {
    const confirmar = window.confirm('¿Deseas enviar esta receta por WhatsApp?')

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await medicalPrescriptionService.enviarWhatsapp(prescription.id)

      setSuccess('Receta enviada por WhatsApp correctamente.')
      await cargarRecetas()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo enviar la receta por WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  const verReceta = (prescription) => {
    setSelectedPrescription(prescription)
    setVisiblePreview(true)
  }

  const cerrarPreview = () => {
    setVisiblePreview(false)
    setSelectedPrescription(null)
  }

  const eliminarReceta = async (prescription) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar esta receta?')

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await medicalPrescriptionService.eliminar(prescription.id)

      setSuccess('Receta eliminada correctamente.')
      await cargarRecetas()
      await cargarDetalles()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo eliminar la receta.')
    } finally {
      setLoading(false)
    }
  }

  const estaEnviada = (prescription) => {
    return Boolean(
      prescription.sentWhatsappAt ||
        prescription.sentAt ||
        prescription.isSent ||
        prescription.wasSent ||
        prescription.isSentWhatsapp,
    )
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Recetas Médicas</strong>

          <CButton color="primary" onClick={abrirModalCrearReceta}>
            Nueva receta
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
              <CFormLabel>Buscar receta</CFormLabel>
              <CFormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por paciente, medicamento o indicación"
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
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Paciente</CTableHeaderCell>
                  <CTableHeaderCell>Atención</CTableHeaderCell>
                  <CTableHeaderCell>Indicaciones generales</CTableHeaderCell>
                  <CTableHeaderCell>Medicamentos</CTableHeaderCell>
                  <CTableHeaderCell>Envío</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {recetasFiltradas.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center">
                      No existen recetas médicas registradas.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  recetasFiltradas.map((prescription, index) => {
                    const prescriptionDetails = obtenerDetallesPorReceta(prescription.id)
                    const attention = obtenerAtencion(prescription.medicalAttentionId)

                    return (
                      <CTableRow key={prescription.id}>
                        <CTableHeaderCell>{index + 1}</CTableHeaderCell>

                        <CTableDataCell>{obtenerNombrePacientePorReceta(prescription)}</CTableDataCell>

                        <CTableDataCell>{obtenerTextoAtencion(attention)}</CTableDataCell>

                        <CTableDataCell>{prescription.generalIndications || '-'}</CTableDataCell>

                        <CTableDataCell>
                          <CBadge color="info">{prescriptionDetails.length}</CBadge>
                        </CTableDataCell>

                        <CTableDataCell>
                          {estaEnviada(prescription) ? (
                            <CBadge color="success">Enviada</CBadge>
                          ) : (
                            <CBadge color="secondary">Pendiente</CBadge>
                          )}
                        </CTableDataCell>

                        <CTableDataCell className="text-end">
                          <CButton
                            color="info"
                            variant="outline"
                            size="sm"
                            className="me-2 mb-1"
                            onClick={() => verReceta(prescription)}
                          >
                            Ver receta
                          </CButton>

                          <CButton
                            color="warning"
                            variant="outline"
                            size="sm"
                            className="me-2 mb-1"
                            onClick={() => abrirModalEditarReceta(prescription)}
                          >
                            Editar
                          </CButton>

                          <CButton
                            color="primary"
                            variant="outline"
                            size="sm"
                            className="me-2 mb-1"
                            onClick={() => abrirModalAgregarMedicamento(prescription)}
                          >
                            Agregar medicamento
                          </CButton>

                          <CButton
                            color="success"
                            variant="outline"
                            size="sm"
                            className="me-2 mb-1"
                            onClick={() => enviarPorWhatsapp(prescription)}
                          >
                            Enviar WhatsApp
                          </CButton>

                          <CButton
                            color="danger"
                            variant="outline"
                            size="sm"
                            className="mb-1"
                            onClick={() => eliminarReceta(prescription)}
                          >
                            Eliminar
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={visiblePrescription} onClose={cerrarModalReceta} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>{editingPrescription ? 'Editar receta' : 'Nueva receta'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={12}>
              <CFormLabel>Atención médica</CFormLabel>
              <CFormSelect
                name="medicalAttentionId"
                value={prescriptionForm.medicalAttentionId || ''}
                onChange={handlePrescriptionChange}
              >
                <option value="">Seleccione una atención médica</option>
                {atenciones.map((attention) => (
                  <option key={attention.id} value={attention.id}>
                    {obtenerTextoAtencion(attention)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={12}>
              <CFormLabel>Indicaciones generales</CFormLabel>
              <CFormTextarea
                rows={4}
                name="generalIndications"
                value={prescriptionForm.generalIndications || ''}
                onChange={handlePrescriptionChange}
                placeholder="Ej: Reposo absoluto por 3 días..."
              />
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModalReceta}>
            Cancelar
          </CButton>

          <CButton color="primary" onClick={guardarReceta} disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              'Guardar receta'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={visibleDetail} onClose={cerrarModalDetalle} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>{editingDetail ? 'Editar medicamento' : 'Agregar medicamento'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          {selectedPrescription && (
            <CAlert color="info">
              <strong>Receta:</strong> {selectedPrescription.generalIndications || '-'}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={8}>
              <CFormLabel>Medicamento</CFormLabel>
              <CFormInput
                name="medicine"
                value={detailForm.medicine || ''}
                onChange={handleDetailChange}
                placeholder="Ej: Complejo A (Inyectable)"
              />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Orden</CFormLabel>
              <CFormInput
                type="number"
                name="order"
                value={detailForm.order || 1}
                onChange={handleDetailChange}
              />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Dosis</CFormLabel>
              <CFormInput
                name="dose"
                value={detailForm.dose || ''}
                onChange={handleDetailChange}
                placeholder="Ej: 2ml"
              />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Frecuencia</CFormLabel>
              <CFormInput
                name="frequency"
                value={detailForm.frequency || ''}
                onChange={handleDetailChange}
                placeholder="Ej: Cada 24 horas"
              />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Duración</CFormLabel>
              <CFormInput
                name="duration"
                value={detailForm.duration || ''}
                onChange={handleDetailChange}
                placeholder="Ej: 3 días"
              />
            </CCol>

            <CCol md={12}>
              <CFormLabel>Indicaciones</CFormLabel>
              <CFormTextarea
                rows={3}
                name="indications"
                value={detailForm.indications || ''}
                onChange={handleDetailChange}
                placeholder="Ej: Aplicación intramuscular profunda."
              />
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModalDetalle}>
            Cancelar
          </CButton>

          <CButton color="primary" onClick={guardarMedicamento} disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              'Guardar medicamento'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={visiblePreview} onClose={cerrarPreview} size="xl">
        <CModalHeader>
          <CModalTitle>Receta generada</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {selectedPrescription && (
            <>
              <CCard className="mb-3">
                <CCardBody>
                  <h4 className="mb-3">Receta Médica</h4>

                  <p>
                    <strong>Paciente:</strong> {obtenerNombrePacientePorReceta(selectedPrescription)}
                  </p>

                  <p>
                    <strong>Atención:</strong>{' '}
                    {obtenerTextoAtencion(obtenerAtencion(selectedPrescription.medicalAttentionId))}
                  </p>

                  <p>
                    <strong>Indicaciones generales:</strong>{' '}
                    {selectedPrescription.generalIndications || '-'}
                  </p>

                  <p>
                    <strong>Estado de envío:</strong>{' '}
                    {estaEnviada(selectedPrescription) ? (
                      <CBadge color="success">Enviada</CBadge>
                    ) : (
                      <CBadge color="secondary">Pendiente</CBadge>
                    )}
                  </p>
                </CCardBody>
              </CCard>

              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Orden</CTableHeaderCell>
                    <CTableHeaderCell>Medicamento</CTableHeaderCell>
                    <CTableHeaderCell>Dosis</CTableHeaderCell>
                    <CTableHeaderCell>Frecuencia</CTableHeaderCell>
                    <CTableHeaderCell>Duración</CTableHeaderCell>
                    <CTableHeaderCell>Indicaciones</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {obtenerDetallesPorReceta(selectedPrescription.id).length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center">
                        No existen medicamentos agregados.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    obtenerDetallesPorReceta(selectedPrescription.id).map((detail) => (
                      <CTableRow key={detail.id}>
                        <CTableDataCell>{detail.order}</CTableDataCell>
                        <CTableDataCell>{detail.medicine}</CTableDataCell>
                        <CTableDataCell>{detail.dose}</CTableDataCell>
                        <CTableDataCell>{detail.frequency}</CTableDataCell>
                        <CTableDataCell>{detail.duration}</CTableDataCell>
                        <CTableDataCell>{detail.indications}</CTableDataCell>
                        <CTableDataCell className="text-end">
                          <CButton
                            color="warning"
                            variant="outline"
                            size="sm"
                            className="me-2"
                            onClick={() => abrirModalEditarMedicamento(selectedPrescription, detail)}
                          >
                            Editar medicamento
                          </CButton>

                          <CButton
                            color="danger"
                            variant="outline"
                            size="sm"
                            onClick={() => eliminarMedicamento(detail)}
                          >
                            Eliminar medicamento
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarPreview}>
            Cerrar
          </CButton>

          {selectedPrescription && (
            <>
              <CButton
                color="primary"
                variant="outline"
                onClick={() => abrirModalAgregarMedicamento(selectedPrescription)}
              >
                Agregar medicamento
              </CButton>

              <CButton color="success" onClick={() => enviarPorWhatsapp(selectedPrescription)}>
                Enviar por WhatsApp
              </CButton>
            </>
          )}
        </CModalFooter>
      </CModal>
    </>
  )
}

export default RecetasMedicas
