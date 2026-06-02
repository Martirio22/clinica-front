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
import { appointmentService } from '../../../services/appointmentService'
import { medicalAttentionService } from '../../../services/medicalAttentionService'
import { medicalPrescriptionService } from '../../../services/medicalPrescriptionService'
import { chatSessionService } from '../../../services/chatSessionService'
import { chatMessageService } from '../../../services/chatMessageService'

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

  const user = JSON.parse(localStorage.getItem('user') || '{}');
const roles = user.roles || []; // Aseguramos que sea un array
const esMedico = roles.includes('MEDICO');
const esAdminOAsistente = roles.includes('ADMIN') || roles.includes('ASISTENTE');

  const [pacientes, setPacientes] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingPatient, setEditingPatient] = useState(null)

  const [patientAppointments, setPatientAppointments] = useState([])
const [visibleAppointmentsModal, setVisibleAppointmentsModal] = useState(false)
const [selectedPatientName, setSelectedPatientName] = useState('')

const [patientAttentions, setPatientAttentions] = useState([])
const [visibleAttentionsModal, setVisibleAttentionsModal] = useState(false)

const [patientPrescriptions, setPatientPrescriptions] = useState([]);
const [visiblePrescriptionsModal, setVisiblePrescriptionsModal] = useState(false);

const [patientSessions, setPatientSessions] = useState([]);
const [visibleSessionsModal, setVisibleSessionsModal] = useState(false);

const [visibleNoSessionModal, setVisibleNoSessionModal] = useState(false);

  const [searchNombre, setSearchNombre] = useState('')
  const [searchIdentificacion, setSearchIdentificacion] = useState('')
  const [searchWhatsapp, setSearchWhatsapp] = useState('')

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const [page, setPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(5)

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

  const from = page * itemsPerPage
  const to = Math.min((page + 1) * itemsPerPage, pacientesFiltrados.length)
  const totalPages = Math.ceil(pacientesFiltrados.length / itemsPerPage)

  // Reset al filtrar
  useEffect(() => {
    setPage(0)
  }, [searchNombre, searchIdentificacion, searchWhatsapp, itemsPerPage])

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

  const verCitas = async (patient) => {
  try {
    setLoading(true)
    setError('')
    setSelectedPatientName(`${patient.firstName} ${patient.lastName}`)
    
    const data = await appointmentService.listarConFiltros({
      patientId: patient.id,
    })
    setPatientAppointments(data || [])
    setVisibleAppointmentsModal(true)
  } catch (err) {
    console.error(err)
    setError('No se pudieron cargar las citas del paciente.')
  } finally {
    setLoading(false)
  }
}

  const verAtenciones = async (patient) => {
  try {
    setLoading(true);
    setError('');
    
    // Obtenemos todas y filtramos
    const data = await medicalAttentionService.listar();
    const atencionesDelPaciente = data.filter(a => a.patientId === patient.id);

    setSelectedPatientName(`${patient.firstName} ${patient.lastName}`);
    setPatientAttentions(atencionesDelPaciente); // Guardamos los datos
    setVisibleAttentionsModal(true);             // Abrimos el modal
    
  } catch (err) {
    console.error("Error al cargar atenciones:", err);
    setError('No se pudieron cargar las atenciones médicas.');
  } finally {
    setLoading(false);
  }
}

 const verRecetas = async (patient) => {
  try {
    setLoading(true);
    const data = await medicalPrescriptionService.listar();
    
    // CORRECCIÓN AQUÍ: Accedemos a medicalAttention.patient.id o medicalAttention.patientId
    const recetasDelPaciente = data.filter(r => {
      // Usamos encadenamiento opcional (?.) por seguridad
      const patientIdInRecipe = r.medicalAttention?.patientId;
      return patientIdInRecipe === patient.id;
    });

    console.log("Recetas filtradas:", recetasDelPaciente);

    setSelectedPatientName(`${patient.firstName} ${patient.lastName}`);
    setPatientPrescriptions(recetasDelPaciente);
    setVisiblePrescriptionsModal(true);
  } catch (err) {
    console.error("Error al cargar recetas:", err);
  } finally {
    setLoading(false);
  }
};

  const verSesionesChat = async (patient) => {
  try {
    setLoading(true);
    const data = await chatSessionService.listar();
    const sesionesDelPaciente = data.filter(s => s.patientId === patient.id);
    
    if (sesionesDelPaciente.length > 0) {
      const sesionMasReciente = sesionesDelPaciente.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0];
      
      window.location.hash = `#/asistente-clinico/chat-en-vivo/${sesionMasReciente.id}`;
    } else {
      // En lugar de alert, abrimos el modal
      setVisibleNoSessionModal(true);
    }
  } catch (err) {
    console.error("Error al cargar sesiones:", err);
  } finally {
    setLoading(false);
  }
};

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
    pacientesFiltrados.slice(from, to).map((patient, index) => (
      <CTableRow key={patient.id}>
        <CTableHeaderCell scope="row">{from + index + 1}</CTableHeaderCell>

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
  <div className="d-flex flex-wrap justify-content-end gap-1">
    
    {/* VISIBLES SOLO PARA MÉDICO */}
{esMedico && (
  <>
    <CButton color="info" variant="outline" size="sm" onClick={() => verPerfil(patient)}>
      Perfil
    </CButton>
    <CButton color="secondary" variant="outline" size="sm" onClick={() => verRecetas(patient)}>
      Recetas
    </CButton>
    <CButton color="dark" variant="outline" size="sm" onClick={() => verAtenciones(patient)}>
      Atenciones
    </CButton>
  </>
)}

{/* VISIBLES PARA TODOS */}
<CButton color="primary" variant="outline" size="sm" onClick={() => verCitas(patient)}>
  Citas
</CButton>

{/* VISIBLE SOLO PARA ADMIN Y ASISTENTE */}
{esAdminOAsistente && (
  <CButton color="primary" variant="outline" size="sm" onClick={() => verSesionesChat(patient)}>
    Chat
  </CButton>
)}
    
    
    {/* Botones administrativos siempre visibles (o ajusta el rol aquí también) */}
    <CButton color="warning" variant="outline" size="sm" onClick={() => abrirModalEditar(patient)}>
      Editar
    </CButton>
    <CButton 
      color={patient.isActive ? 'danger' : 'success'} 
      variant="outline" 
      size="sm" 
      onClick={() => confirmarAlternarEstadoPaciente(patient)}
    >
      {patient.isActive ? 'Inactivar' : 'Activar'}
    </CButton>
  </div>
</CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
          <div className="d-flex justify-content-between align-items-center mt-3">
  <CFormSelect 
    size="sm" 
    style={{ width: '150px' }} 
    value={itemsPerPage} 
    onChange={(e) => setItemsPerPage(Number(e.target.value))}
  >
    <option value={5}>5 por pág</option>
    <option value={10}>10 por pág</option>
    <option value={20}>20 por pág</option>
  </CFormSelect>
  
  <div>
    <CButton color="secondary" variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="me-2">
      Anterior
    </CButton>
    <span className="mx-2">Pág {page + 1} de {totalPages || 1}</span>
    <CButton color="secondary" variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
      Siguiente
    </CButton>
  </div>
</div>
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

      <CModal visible={visibleAppointmentsModal} onClose={() => setVisibleAppointmentsModal(false)} size="xl">
  <CModalHeader>
    <CModalTitle>Historial de citas: {selectedPatientName}</CModalTitle>
  </CModalHeader>
  <CModalBody>
    <CTable hover responsive align="middle">
      <CTableHead color="light">
        <CTableRow>
          <CTableHeaderCell>Fecha y Hora</CTableHeaderCell>
          <CTableHeaderCell>Especialidad</CTableHeaderCell>
          <CTableHeaderCell>Médico</CTableHeaderCell>
          <CTableHeaderCell>Motivo</CTableHeaderCell>
          <CTableHeaderCell>Estado</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {Array.isArray(patientAppointments) && patientAppointments.length > 0 ? (
          patientAppointments.map((cita) => (
            <CTableRow key={cita.id}>
              <CTableDataCell>
                {new Date(cita.startDate).toLocaleDateString('es-EC', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </CTableDataCell>
              <CTableDataCell>
                <strong>{cita.specialty?.name || 'N/A'}</strong>
                <div className="small text-body-secondary">Consultorio: {cita.office?.name || 'No asignado'}</div>
              </CTableDataCell>
              <CTableDataCell>
                {cita.doctor?.user 
                  ? `Dr(a). ${cita.doctor.user.firstName} ${cita.doctor.user.lastName}` 
                  : 'No asignado'}
              </CTableDataCell>
              <CTableDataCell className="text-truncate" style={{ maxWidth: '150px' }}>
                {cita.reason || '-'}
              </CTableDataCell>
              <CTableDataCell>
                <CBadge color={cita.status?.code === 'CONFIRMED' ? 'success' : 'info'}>
                  {cita.status?.name || 'Sin estado'}
                </CBadge>
              </CTableDataCell>
            </CTableRow>
          ))
        ) : (
          <CTableRow>
            <CTableDataCell colSpan={5} className="text-center">No tiene citas registradas.</CTableDataCell>
          </CTableRow>
        )}
      </CTableBody>
    </CTable>
  </CModalBody>
  <CModalFooter>
    <CButton color="secondary" onClick={() => setVisibleAppointmentsModal(false)}>Cerrar</CButton>
  </CModalFooter>
</CModal>

<CModal visible={visibleAttentionsModal} onClose={() => setVisibleAttentionsModal(false)} size="xl">
  <CModalHeader>
    <CModalTitle>Historial de Atenciones: {selectedPatientName}</CModalTitle>
  </CModalHeader>
  <CModalBody>
    <CTable hover responsive align="middle">
      <CTableHead color="light">
        <CTableRow>
          <CTableHeaderCell>Fecha</CTableHeaderCell>
          <CTableHeaderCell>Motivo / Síntomas</CTableHeaderCell>
          <CTableHeaderCell>Diagnóstico</CTableHeaderCell>
          <CTableHeaderCell>Indicaciones</CTableHeaderCell>
          <CTableHeaderCell>Estado</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {Array.isArray(patientAttentions) && patientAttentions.length > 0 ? (
          patientAttentions.map((atencion) => (
            <CTableRow key={atencion.id}>
              <CTableDataCell>
                {new Date(atencion.startDate).toLocaleDateString('es-EC', {
                  day: '2-digit', month: '2-digit', year: 'numeric'
                })}
              </CTableDataCell>
              <CTableDataCell>
                <strong>{atencion.reasonConsultation}</strong>
                <div className="small text-body-secondary">Sint: {atencion.symptoms}</div>
              </CTableDataCell>
              <CTableDataCell>{atencion.diagnosis || '-'}</CTableDataCell>
              <CTableDataCell>{atencion.indications || '-'}</CTableDataCell>
              <CTableDataCell>
                <CBadge color={atencion.status?.code === 'FINALIZADO' ? 'success' : 'warning'}>
                  {atencion.status?.name || 'Proceso'}
                </CBadge>
              </CTableDataCell>
            </CTableRow>
          ))
        ) : (
          <CTableRow>
            <CTableDataCell colSpan={5} className="text-center">No tiene atenciones registradas.</CTableDataCell>
          </CTableRow>
        )}
      </CTableBody>
    </CTable>
  </CModalBody>
  <CModalFooter>
    <CButton color="secondary" onClick={() => setVisibleAttentionsModal(false)}>Cerrar</CButton>
  </CModalFooter>
</CModal>

<CModal visible={visiblePrescriptionsModal} onClose={() => setVisiblePrescriptionsModal(false)} size="xl">
  <CModalHeader>
    <CModalTitle>Recetas Médicas: {selectedPatientName}</CModalTitle>
  </CModalHeader>
  <CModalBody>
    <CTable hover responsive align="middle">
      <CTableHead color="light">
        <CTableRow>
          <CTableHeaderCell>Código / Fecha</CTableHeaderCell>
          <CTableHeaderCell>Medicamentos</CTableHeaderCell>
          <CTableHeaderCell>Indicaciones Generales</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {Array.isArray(patientPrescriptions) && patientPrescriptions.length > 0 ? (
          patientPrescriptions.map((receta) => (
            <CTableRow key={receta.id}>
              <CTableDataCell>
                <strong>{receta.prescriptionCode}</strong>
                <div className="small text-body-secondary">
                  {new Date(receta.issueDate).toLocaleDateString()}
                </div>
              </CTableDataCell>
              <CTableDataCell>
                <ul className="list-unstyled mb-0">
                  {receta.items?.map((item, index) => (
                    <li key={index} className="small">
                      • <strong>{item.medicine}</strong>: {item.dose} ({item.frequency})
                    </li>
                  ))}
                </ul>
              </CTableDataCell>
              <CTableDataCell style={{ maxWidth: '200px' }}>
                {receta.generalIndications || '-'}
              </CTableDataCell>
            </CTableRow>
          ))
        ) : (
          <CTableRow>
            <CTableDataCell colSpan={5} className="text-center">No hay recetas registradas.</CTableDataCell>
          </CTableRow>
        )}
      </CTableBody>
    </CTable>
  </CModalBody>
  <CModalFooter>
    <CButton color="secondary" onClick={() => setVisiblePrescriptionsModal(false)}>Cerrar</CButton>
  </CModalFooter>
</CModal>

<CModal visible={visibleNoSessionModal} onClose={() => setVisibleNoSessionModal(false)}>
  <CModalHeader>
    <CModalTitle>Sin sesiones activas</CModalTitle>
  </CModalHeader>
  <CModalBody>
    <p>El paciente seleccionado aún no tiene ninguna sesión de chat iniciada.</p>
  </CModalBody>
  <CModalFooter>
    <CButton color="secondary" onClick={() => setVisibleNoSessionModal(false)}>
      Cerrar
    </CButton>
    <CButton 
      color="primary" 
      onClick={async () => {
        // Opcional: Crear sesión aquí si tu API lo permite
        // await chatSessionService.crear({ patientId: selectedPatient.id });
        setVisibleNoSessionModal(false);
      }}
    >
      Entendido
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