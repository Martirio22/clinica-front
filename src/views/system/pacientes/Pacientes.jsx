import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

import { patientService } from '../../../services/patientService'

const initialForm = {
  identificationType: 'CEDULA',
  identification: '',
  firstName: '',
  lastName: '',
  birthDate: '',
  gender: '',
  email: '',
  whatsappPhone: '',
  address: '',
  isActive: true,
}

const Pacientes = () => {
  const [pacientes, setPacientes] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingPatient, setEditingPatient] = useState(null)

  const [searchNombre, setSearchNombre] = useState('')
  const [searchIdentificacion, setSearchIdentificacion] = useState('')
  const [searchWhatsapp, setSearchWhatsapp] = useState('')

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  // Estado del modal de confirmación dinámico unificado
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  const navigate = useNavigate()

  // Temporizador para limpiar alertas de éxito automáticamente
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3500)
      return () => clearTimeout(timer)
    }
  }, [success])

  const cargarPacientes = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await patientService.listar()
      setPacientes(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los pacientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPacientes()
  }, [])

  const pacientesFiltrados = useMemo(() => {
    const nombre = String(searchNombre || '').toLowerCase().trim()
    const identificacion = String(searchIdentificacion || '').toLowerCase().trim()
    const whatsapp = String(searchWhatsapp || '').toLowerCase().trim()

    return pacientes.filter((patient) => {
      const nombreCompleto = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase()
      const patientIdentification = String(patient.identification || '').toLowerCase()
      const patientWhatsapp = String(patient.whatsappPhone || '').toLowerCase()

      const cumpleNombre = !nombre || nombreCompleto.includes(nombre)
      const cumpleIdentificacion =
        !identificacion || patientIdentification.includes(identificacion)
      const cumpleWhatsapp = !whatsapp || patientWhatsapp.includes(whatsapp)

      return cumpleNombre && cumpleIdentificacion && cumpleWhatsapp
    })
  }, [pacientes, searchNombre, searchIdentificacion, searchWhatsapp])

  const abrirModalCrear = () => {
    setEditingPatient(null)
    setForm(initialForm)
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const abrirModalEditar = (patient) => {
    setEditingPatient(patient)

    setForm({
      identificationType: patient.identificationType || 'CEDULA',
      identification: patient.identification || '',
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      birthDate: patient.birthDate || '',
      gender: patient.gender || '',
      email: patient.email || '',
      whatsappPhone: patient.whatsappPhone || '',
      address: patient.address || '',
      isActive: patient.isActive ?? true,
    })

    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingPatient(null)
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
    if (!String(form.firstName || '').trim()) return 'El nombre del paciente es requerido.'
    if (!String(form.lastName || '').trim()) return 'El apellido del paciente es requerido.'
    if (!String(form.identification || '').trim()) return 'La identificación es requerida.'
    if (!String(form.whatsappPhone || '').trim()) return 'El WhatsApp es requerido.'

    return ''
  }

  const guardarPaciente = async () => {
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
        identificationType: String(form.identificationType || '').trim() || null,
        identification: String(form.identification || '').trim(),
        firstName: String(form.firstName || '').trim(),
        lastName: String(form.lastName || '').trim(),
        birthDate: String(form.birthDate || '').trim() || null,
        gender: String(form.gender || '').trim() || null,
        email: String(form.email || '').trim() || null,
        whatsappPhone: String(form.whatsappPhone || '').trim(),
        address: String(form.address || '').trim() || null,
        isActive: form.isActive,
      }

      if (editingPatient) {
        await patientService.actualizar(editingPatient.id, payload)
        setSuccess('Paciente actualizado correctamente.')
      } else {
        await patientService.crear(payload)
        setSuccess('Paciente creado correctamente.')
      }

      cerrarModal()
      await cargarPacientes()
    } catch (err) {
      console.error(err)
      setModalError(err?.message || 'Ocurrió un error al guardar el paciente.')
    } finally {
      setSaving(false)
    }
  }

  // Abre el modal dinámico según el estado actual del paciente
  const confirmarAlternarEstadoPaciente = (patient) => {
    const accion = patient.isActive ? 'inactivar' : 'activar'
    setConfirmModal({
      visible: true,
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} Paciente`,
      message: `¿Seguro que deseas ${accion} al paciente ${patient.firstName} ${patient.lastName}?`,
      onConfirm: () => ejecutarAlternarEstado(patient),
    })
  }

  const ejecutarAlternarEstado = async (patient) => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (patient.isActive) {
        await patientService.eliminar(patient.id)
        setSuccess('Paciente inactivado correctamente.')
      } else {
        const payload = {
          identificationType: patient.identificationType,
          identification: patient.identification,
          firstName: patient.firstName,
          lastName: patient.lastName,
          birthDate: patient.birthDate,
          gender: patient.gender,
          email: patient.email,
          whatsappPhone: patient.whatsappPhone,
          address: patient.address,
          isActive: true,
        }
        await patientService.actualizar(patient.id, payload)
        setSuccess('Paciente activado correctamente.')
      }

      await cargarPacientes()
    } catch (err) {
      console.error(err)
      setError('No se pudo cambiar el estado del paciente.')
    } finally {
      setLoading(false)
    }
  }

  const cerrarConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
  }

  const limpiarFiltros = () => {
    setSearchNombre('')
    setSearchIdentificacion('')
    setSearchWhatsapp('')
  }

  const verPerfil = (patient) => {
    navigate(`/pacientes/perfil-paciente/${patient.id}`)
  }

  const verCitas = (patient) => {
    alert(`Aquí puedes redirigir a las citas del paciente: ${patient.id}`)
  }

  const verAtenciones = (patient) => {
    alert(`Aquí puedes redirigir a las atenciones médicas del paciente: ${patient.id}`)
  }

  const verRecetas = (patient) => {
    alert(`Aquí puedes redirigir a las recetas del paciente: ${patient.id}`)
  }

  const verSesionesChat = (patient) => {
    alert(`Aquí puedes redirigir a las sesiones de chat del paciente: ${patient.id}`)
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Administración de Pacientes</strong>

          <CButton color="primary" onClick={abrirModalCrear}>
            Nuevo paciente
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
            <CCol md={4}>
              <CFormLabel>Buscar por nombre</CFormLabel>
              <CFormInput
                value={searchNombre}
                onChange={(e) => setSearchNombre(e.target.value)}
                placeholder="Ej: Mishell Chiles"
              />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Buscar por identificación</CFormLabel>
              <CFormInput
                value={searchIdentificacion}
                onChange={(e) => setSearchIdentificacion(e.target.value)}
                placeholder="Ej: 1723456789"
              />
            </CCol>

            <CCol md={3}>
              <CFormLabel>Buscar por WhatsApp</CFormLabel>
              <CFormInput
                value={searchWhatsapp}
                onChange={(e) => setSearchWhatsapp(e.target.value)}
                placeholder="Ej: 0988541256"
              />
            </CCol>

            <CCol md={1} className="d-flex align-items-end">
              <CButton color="secondary" variant="outline" onClick={limpiarFiltros}>
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
                  <CTableHeaderCell scope="col">Paciente</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Identificación</CTableHeaderCell>
                  <CTableHeaderCell scope="col">WhatsApp</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Email</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Género</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Estado</CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="text-end">
                    Acciones
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {pacientesFiltrados.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center">
                      No existen pacientes registrados.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  pacientesFiltrados.map((patient, index) => (
                    <CTableRow key={patient.id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>

                      <CTableDataCell>
                        <div>
                          {patient.firstName} {patient.lastName}
                        </div>
                        <small className="text-body-secondary">
                          {patient.address || 'Sin dirección'}
                        </small>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div>{patient.identification || '-'}</div>
                        <small className="text-body-secondary">
                          {patient.identificationType || ''}
                        </small>
                      </CTableDataCell>

                      <CTableDataCell>{patient.whatsappPhone || '-'}</CTableDataCell>

                      <CTableDataCell>{patient.email || '-'}</CTableDataCell>

                      <CTableDataCell>{patient.gender || '-'}</CTableDataCell>

                      <CTableDataCell>
                        {patient.isActive ? (
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
                          className="me-2 mb-1"
                          onClick={() => verPerfil(patient)}
                        >
                          Perfil
                        </CButton>

                        <CButton
                          color="primary"
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => verCitas(patient)}
                        >
                          Citas
                        </CButton>

                        <CButton
                          color="dark"
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => verAtenciones(patient)}
                        >
                          Atenciones
                        </CButton>

                        <CButton
                          color="secondary"
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => verRecetas(patient)}
                        >
                          Recetas
                        </CButton>

                        <CButton
                          color="success"
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => verSesionesChat(patient)}
                        >
                          Chat
                        </CButton>

                        <CButton
                          color="warning"
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => abrirModalEditar(patient)}
                        >
                          Editar
                        </CButton>

                        <CButton
                          color={patient.isActive ? 'danger' : 'success'}
                          variant="outline"
                          size="sm"
                          className="mb-1"
                          onClick={() => confirmarAlternarEstadoPaciente(patient)}
                        >
                          {patient.isActive ? 'Inactivar' : 'Activar'}
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

      {/* MODAL FORMULARIO */}
      <CModal visible={visible} onClose={cerrarModal} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>{editingPatient ? 'Editar paciente' : 'Nuevo paciente'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={4}>
              <CFormLabel>Tipo de identificación</CFormLabel>
              <CFormSelect
                name="identificationType"
                value={form.identificationType || ''}
                onChange={handleChange}
              >
                <option value="CEDULA">Cédula</option>
                <option value="RUC">RUC</option>
                <option value="PASAPORTE">Pasaporte</option>
              </CFormSelect>
            </CCol>

            <CCol md={8}>
              <CFormLabel>Identificación</CFormLabel>
              <CFormInput
                name="identification"
                value={form.identification || ''}
                onChange={handleChange}
                placeholder="Ej: 1723456789"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Nombres</CFormLabel>
              <CFormInput
                name="firstName"
                value={form.firstName || ''}
                onChange={handleChange}
                placeholder="Ej: Mishell"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Apellidos</CFormLabel>
              <CFormInput
                name="lastName"
                value={form.lastName || ''}
                onChange={handleChange}
                placeholder="Ej: Chiles"
              />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Fecha de nacimiento</CFormLabel>
              <CFormInput
                type="date"
                name="birthDate"
                value={form.birthDate || ''}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Género</CFormLabel>
              <CFormSelect name="gender" value={form.gender || ''} onChange={handleChange}>
                <option value="">Seleccione</option>
                <option value="FEMENINO">Femenino</option>
                <option value="MASCULINO">Masculino</option>
                <option value="OTRO">Otro</option>
              </CFormSelect>
            </CCol>

            <CCol md={4}>
              <CFormLabel>WhatsApp</CFormLabel>
              <CFormInput
                name="whatsappPhone"
                value={form.whatsappPhone || ''}
                onChange={handleChange}
                placeholder="Ej: 0988541256"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Email</CFormLabel>
              <CFormInput
                type="email"
                name="email"
                value={form.email || ''}
                onChange={handleChange}
                placeholder="Ej: paciente@email.com"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Estado</CFormLabel>
              <CFormSelect value={String(form.isActive)} onChange={handleChangeEstado}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </CFormSelect>
            </CCol>

            <CCol md={12}>
              <CFormLabel>Dirección</CFormLabel>
              <CFormInput
                name="address"
                value={form.address || ''}
                onChange={handleChange}
                placeholder="Ej: Quito, Av. 10 de Agosto"
              />
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModal}>
            Cancelar
          </CButton>

          <CButton color="primary" onClick={guardarPaciente} disabled={saving}>
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

      {/* MODAL DE CONFIRMACIÓN DINÁMICO UNIFICADO */}
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

export default Pacientes