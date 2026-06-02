import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom';
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

import { doctorService } from '../../../services/doctorService'
import { userService } from '../../../services/userService'
import { specialtyService } from '../../../services/specialtyService'

import { doctorScheduleService } from '../../../services/doctorScheduleService' 
import { scheduleBlockService } from '../../../services/scheduleBlockService'

const initialForm = {
  userId: '',
  specialtyId: '',
  professionalRegistry: '',
  appointmentDurationMinutes: 30,
  isActive: true,
}

const Medicos = () => {
  const navigate = useNavigate();
  const [medicos, setMedicos] = useState([])
  const [usuariosMedicos, setUsuariosMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])

  const [horariosModal, setHorariosModal] = useState({ visible: false, data: [], loading: false });
  const [bloqueosModal, setBloqueosModal] = useState({ visible: false, data: [], loading: false });

  const [form, setForm] = useState(initialForm)
  const [editingDoctor, setEditingDoctor] = useState(null)

  const [search, setSearch] = useState('')
  const [filtroSpecialtyId, setFiltroSpecialtyId] = useState('')

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const [page, setPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  const cargarUsuariosMedicos = async () => {
    try {
      const data = await userService.listarMedicosDisponibles()
      setUsuariosMedicos(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los usuarios con rol médico.')
    }
  }

  const cargarEspecialidades = async () => {
    try {
      const data = await specialtyService.listar()
      setEspecialidades(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar las especialidades.')
    }
  }

  const cargarMedicos = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await doctorService.listar()
      setMedicos(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los médicos.')
    } finally {
      setLoading(false)
    }
  }

  const cargarMedicosPorEspecialidad = async (specialtyId) => {
    try {
      setLoading(true)
      setError('')

      if (!specialtyId) {
        await cargarMedicos()
        return
      }

      const data = await doctorService.listarPorSpecialty(specialtyId)
      setMedicos(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los médicos de la especialidad.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarUsuariosMedicos()
    cargarEspecialidades()
    cargarMedicos()
  }, [])

  const abrirHorarios = async (doctor) => {
    setHorariosModal({ visible: true, data: [], loading: true });
    try {
      // Cambiado de doctorService a doctorScheduleService
      const data = await doctorScheduleService.listarPorDoctor(doctor.id); 
      setHorariosModal({ visible: true, data: data || [], loading: false });
    } catch (err) {
      console.error(err);
      setHorariosModal({ visible: false, data: [], loading: false });
      setError('Error al cargar horarios.');
    }
  };

  const abrirBloqueos = async (doctor) => {
    // Agregamos doctorId al estado
    setBloqueosModal({ visible: true, data: [], loading: true, doctorId: doctor.id }); 
    try {
      const data = await scheduleBlockService.listarPorDoctor(doctor.id); 
      setBloqueosModal({ visible: true, data: data || [], loading: false, doctorId: doctor.id });
    } catch (err) {
      console.error(err);
      setBloqueosModal({ visible: false, data: [], loading: false, doctorId: null });
      setError('Error al cargar bloqueos.');
    }
  };

  const configurarHorario = (doctor) => {
    navigate(`/agenda/horarios-medicos?doctorId=${doctor.id}`);
  };

  const irACrearBloqueo = (doctorId) => {
  navigate(`/agenda/bloqueo-agenda?doctorId=${doctorId}`);
};

  const handleFiltroEspecialidad = async (e) => {
    const specialtyId = e.target.value
    setFiltroSpecialtyId(specialtyId)
    await cargarMedicosPorEspecialidad(specialtyId)
  }

  const medicosFiltrados = useMemo(() => {
    const texto = String(search || '').toLowerCase().trim()

    if (!texto) return medicos

    return medicos.filter((doctor) => {
      const usuario = obtenerUsuarioMedico(doctor.userId)
      const especialidad = obtenerEspecialidad(doctor.specialtyId)

      const nombreUsuario = `${usuario?.firstName || ''} ${usuario?.lastName || ''}`.toLowerCase()
      const email = String(usuario?.email || '').toLowerCase()
      const username = String(usuario?.username || '').toLowerCase()
      const especialidadNombre = String(especialidad?.name || '').toLowerCase()
      const registro = String(doctor.professionalRegistry || '').toLowerCase()

      return (
        nombreUsuario.includes(texto) ||
        email.includes(texto) ||
        username.includes(texto) ||
        especialidadNombre.includes(texto) ||
        registro.includes(texto)
      )
    })
  }, [medicos, search, usuariosMedicos, especialidades])

  const from = page * itemsPerPage
  const to = Math.min((page + 1) * itemsPerPage, medicosFiltrados.length)
  const totalPages = Math.ceil(medicosFiltrados.length / itemsPerPage)

  useEffect(() => {
    setPage(0)
  }, [search, filtroSpecialtyId, itemsPerPage])

  const obtenerUsuarioMedico = (userId) => {
    return usuariosMedicos.find((user) => user.id === userId)
  }

  const obtenerEspecialidad = (specialtyId) => {
    return especialidades.find((specialty) => specialty.id === specialtyId)
  }

  const obtenerNombreUsuario = (userId) => {
    const usuario = obtenerUsuarioMedico(userId)
    if (!usuario) return '-'
    return `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim()
  }

  const obtenerNombreEspecialidad = (specialtyId) => {
    const especialidad = obtenerEspecialidad(specialtyId)
    return especialidad?.name || '-'
  }

  const abrirModalCrear = () => {
    setEditingDoctor(null)
    setForm({
      ...initialForm,
      specialtyId: filtroSpecialtyId || '',
    })
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const abrirModalEditar = (doctor) => {
    setEditingDoctor(doctor)
    setForm({
      userId: doctor.userId || '',
      specialtyId: doctor.specialtyId || '',
      professionalRegistry: doctor.professionalRegistry || '',
      appointmentDurationMinutes: doctor.appointmentDurationMinutes || 30,
      isActive: doctor.isActive ?? true,
    })
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingDoctor(null)
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
    if (!String(form.userId || '').trim()) return 'Debe seleccionar un usuario médico.'
    if (!String(form.specialtyId || '').trim()) return 'Debe seleccionar una especialidad.'
    if (!String(form.professionalRegistry || '').trim()) {
      return 'El número de registro profesional es requerido.'
    }

    const duration = Number(form.appointmentDurationMinutes)
    if (!duration || duration <= 0) {
      return 'La duración de la cita debe ser mayor a 0.'
    }
    return ''
  }

  const guardarMedico = async () => {
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
        userId: String(form.userId || '').trim(),
        specialtyId: String(form.specialtyId || '').trim(),
        professionalRegistry: String(form.professionalRegistry || '').trim(),
        appointmentDurationMinutes: Number(form.appointmentDurationMinutes),
        isActive: form.isActive,
      }

      if (editingDoctor) {
        await doctorService.actualizar(editingDoctor.id, payload)
        setSuccess('Médico actualizado correctamente.')
      } else {
        await doctorService.crear(payload)
        setSuccess('Médico creado correctamente.')
      }

      cerrarModal()

      if (filtroSpecialtyId) {
        await cargarMedicosPorEspecialidad(filtroSpecialtyId)
      } else {
        await cargarMedicos()
      }
    } catch (err) {
      console.error(err)
      setModalError(err?.message || 'Ocurrió un error al guardar el médico.')
    } finally {
      setSaving(false)
    }
  }

  // Abre el modal dinámico según la acción requerida
  const confirmarAlternarEstadoMedico = (doctor) => {
    const nombre = obtenerNombreUsuario(doctor.userId)
    const accion = doctor.isActive ? 'inactivar' : 'activar'
    setConfirmModal({
      visible: true,
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} Médico`,
      message: `¿Seguro que deseas ${accion} al médico ${nombre}?`,
      onConfirm: () => ejecutarAlternarEstado(doctor),
    })
  }

  const ejecutarAlternarEstado = async (doctor) => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (doctor.isActive) {
        await doctorService.eliminar(doctor.id)
        setSuccess('Médico inactivado correctamente.')
      } else {
        const payload = {
          userId: doctor.userId,
          specialtyId: doctor.specialtyId,
          professionalRegistry: doctor.professionalRegistry,
          appointmentDurationMinutes: doctor.appointmentDurationMinutes,
          isActive: true,
        }
        await doctorService.actualizar(doctor.id, payload)
        setSuccess('Médico activado correctamente.')
      }

      if (filtroSpecialtyId) {
        await cargarMedicosPorEspecialidad(filtroSpecialtyId)
      } else {
        await cargarMedicos()
      }
    } catch (err) {
      console.error(err)
      setError('No se pudo cambiar el estado del médico.')
    } finally {
      setLoading(false)
    }
  }

  const cerrarConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
  }

  // //const irHorarios = (doctor) => {
  //  // alert(`Aquí puedes redirigir a horarios del médico: ${doctor.id}`)
  // }

  // const irBloqueos = (doctor) => {
  //   alert(`Aquí puedes redirigir a bloqueos del médico: ${doctor.id}`)
  // }

  // const configurarHorario = (doctor) => {
  //   alert(`Aquí puedes abrir la pantalla para configurar horario del médico: ${doctor.id}`)
  // }

  const obtenerNombreDia = (day) => {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[day] || '-';
};

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Administración de Médicos</strong>
          <CButton color="primary" onClick={abrirModalCrear}>
            Nuevo médico
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
              <CFormLabel>Buscar médico</CFormLabel>
              <CFormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email, especialidad o registro"
              />
            </CCol>

            <CCol md={5}>
              <CFormLabel>Filtrar por especialidad</CFormLabel>
              <CFormSelect value={filtroSpecialtyId} onChange={handleFiltroEspecialidad}>
                <option value="">Todas las especialidades</option>
                {especialidades.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
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
                  <CTableHeaderCell scope="col">Médico</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Especialidad</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Registro profesional</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Duración cita</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Estado</CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="text-end">
                    Acciones
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
  {medicosFiltrados.length === 0 ? (
    <CTableRow>
      <CTableDataCell colSpan={7} className="text-center">No hay médicos registrados.</CTableDataCell>
    </CTableRow>
  ) : (
    medicosFiltrados.slice(from, to).map((doctor, index) => (
      <CTableRow key={doctor.id}>
        <CTableHeaderCell scope="row">{from + index + 1}</CTableHeaderCell>

                      <CTableDataCell>
                        <div>{obtenerNombreUsuario(doctor.userId)}</div>
                        <small className="text-body-secondary">
                          {obtenerUsuarioMedico(doctor.userId)?.email || ''}
                        </small>
                      </CTableDataCell>

                      <CTableDataCell>{obtenerNombreEspecialidad(doctor.specialtyId)}</CTableDataCell>
                      <CTableDataCell>{doctor.professionalRegistry}</CTableDataCell>
                      <CTableDataCell>{doctor.appointmentDurationMinutes} min</CTableDataCell>

                      <CTableDataCell>
                        {doctor.isActive ? (
                          <CBadge color="success">Activo</CBadge>
                        ) : (
                          <CBadge color="secondary">Inactivo</CBadge>
                        )}
                      </CTableDataCell>

                      <CTableDataCell className="text-end">
  <div className="d-flex flex-wrap justify-content-end gap-1">
    {/* Acciones principales */}
    <CButton color="info" variant="outline" size="sm" onClick={() => abrirHorarios(doctor)}>
      Horarios
    </CButton>
    <CButton color="dark" variant="outline" size="sm" onClick={() => abrirBloqueos(doctor)}>
      Bloqueos
    </CButton>
    <CButton color="primary" variant="outline" size="sm" onClick={() => configurarHorario(doctor)}>
      Configurar Horario
    </CButton>
    
    {/* Acciones de mantenimiento */}
    <CButton color="warning" variant="outline" size="sm" onClick={() => abrirModalEditar(doctor)}>
      Editar
    </CButton>
    <CButton 
      color={doctor.isActive ? 'danger' : 'success'} 
      variant="outline" 
      size="sm" 
      onClick={() => confirmarAlternarEstadoMedico(doctor)}
    >
      {doctor.isActive ? 'Inactivar' : 'Activar'}
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
    <span className="mx-2">Página {page + 1} de {totalPages || 1}</span>
    <CButton color="secondary" variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
      Siguiente
    </CButton>
  </div>
</div>
        </CCardBody>
      </CCard>

      <CModal visible={horariosModal.visible} onClose={() => setHorariosModal(p => ({...p, visible: false}))} size="lg">
  <CModalHeader><CModalTitle>Horarios del Médico</CModalTitle></CModalHeader>
  <CModalBody>
    {horariosModal.loading ? (
      <div className="text-center"><CSpinner /></div>
    ) : (
      <CTable hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Día</CTableHeaderCell>
            <CTableHeaderCell>Horario</CTableHeaderCell>
            <CTableHeaderCell>Sucursal</CTableHeaderCell>
            <CTableHeaderCell>Consultorio</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {horariosModal.data.map((item) => (
            <CTableRow key={item.id}>
              <CTableDataCell>{obtenerNombreDia(item.dayOfWeek)}</CTableDataCell>
              <CTableDataCell>{item.startTime?.substring(0, 5)} - {item.endTime?.substring(0, 5)}</CTableDataCell>
              <CTableDataCell>{item.branch?.name || '-'}</CTableDataCell>
              <CTableDataCell>{item.office?.name || '-'}</CTableDataCell>
            </CTableRow>
          ))}
          {horariosModal.data.length === 0 && (
            <CTableRow><CTableDataCell colSpan={4} className="text-center">Sin horarios.</CTableDataCell></CTableRow>
          )}
        </CTableBody>
      </CTable>
    )}
  </CModalBody>
</CModal>

      {/* MODAL BLOQUEOS */}
<CModal visible={bloqueosModal.visible} onClose={() => setBloqueosModal(p => ({...p, visible: false}))} size="xl">
  <CModalHeader>
    <CModalTitle>Bloqueos del Médico</CModalTitle>
    <CButton 
      color="primary" 
      size="sm" 
      className="ms-3" 
      onClick={() => irACrearBloqueo(bloqueosModal.doctorId)} 
    >
      Agregar Bloqueo
    </CButton>
  </CModalHeader>
  <CModalBody>
    {bloqueosModal.loading ? (
      <div className="text-center py-4"><CSpinner /></div>
    ) : (
      <CTable hover responsive align="middle">
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Tipo</CTableHeaderCell>
            <CTableHeaderCell>Fecha Inicio</CTableHeaderCell>
            <CTableHeaderCell>Fecha Fin</CTableHeaderCell>
            <CTableHeaderCell>Motivo / Descripción</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {bloqueosModal.data.map((item) => (
            <CTableRow key={item.id}>
              <CTableDataCell>
                <CBadge color="info">{item.blockingType?.name || 'N/A'}</CBadge>
              </CTableDataCell>
              <CTableDataCell>{new Date(item.startDate).toLocaleString()}</CTableDataCell>
              <CTableDataCell>{new Date(item.endDate).toLocaleString()}</CTableDataCell>
              <CTableDataCell>
                <div>{item.reason}</div>
                <small className="text-body-secondary">{item.blockingType?.description}</small>
              </CTableDataCell>
            </CTableRow>
          ))}
          {bloqueosModal.data.length === 0 && (
            <CTableRow>
              <CTableDataCell colSpan={5} className="text-center">No hay bloqueos registrados.</CTableDataCell>
            </CTableRow>
          )}
        </CTableBody>
      </CTable>
    )}
  </CModalBody>
</CModal>


      {/* MODAL FORMULARIO */}
      <CModal visible={visible} onClose={cerrarModal} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>{editingDoctor ? 'Editar médico' : 'Nuevo médico'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={6}>
              <CFormLabel>Usuario médico</CFormLabel>
              <CFormSelect
                name="userId"
                value={form.userId || ''}
                onChange={handleChange}
                disabled={!!editingDoctor}
              >
                <option value="">Seleccione un usuario con rol médico</option>
                {usuariosMedicos
                  .filter((user) => user.isActive)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} - {user.email}
                    </option>
                  ))}
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormLabel>Especialidad</CFormLabel>
              <CFormSelect
                name="specialtyId"
                value={form.specialtyId || ''}
                onChange={handleChange}
              >
                <option value="">Seleccione una especialidad</option>
                {especialidades
                  .filter((specialty) => specialty.isActive)
                  .map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </option>
                  ))}
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormLabel>Número de registro profesional</CFormLabel>
              <CFormInput
                name="professionalRegistry"
                value={form.professionalRegistry || ''}
                onChange={handleChange}
                placeholder="Ej: MP-2026-EC-99822"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Duración de cita en minutos</CFormLabel>
              <CFormInput
                type="number"
                min={1}
                name="appointmentDurationMinutes"
                value={form.appointmentDurationMinutes || ''}
                onChange={handleChange}
                placeholder="Ej: 30"
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
          <CButton color="primary" onClick={guardarMedico} disabled={saving}>
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

      {/* MODAL DE CONFIRMACIÓN */}
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

export default Medicos