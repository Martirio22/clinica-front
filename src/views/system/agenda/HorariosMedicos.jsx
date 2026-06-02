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

import { doctorScheduleService } from '../../../services/doctorScheduleService'
import { doctorService } from '../../../services/doctorService'
import { branchService } from '../../../services/branchService'
import { officeService } from '../../../services/officeService'

const initialForm = {
  doctorId: '',
  branchId: '',
  officeId: '',
  dayOfWeek: '',
  startTime: '',
  endTime: '',
  isActive: true,
}

const diasSemana = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

const HorariosMedicos = () => {
  const [searchParams] = useSearchParams();

  const [filtroDoctorId, setFiltroDoctorId] = useState(searchParams.get('doctorId') || '');
  const [filtroBranchId, setFiltroBranchId] = useState('');

  const [horarios, setHorarios] = useState([])
  const [medicos, setMedicos] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [consultorios, setConsultorios] = useState([])

  const [form, setForm] = useState(initialForm)
  const [editingSchedule, setEditingSchedule] = useState(null)


  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const [page, setPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Estado unificado del modal de confirmación dinámico
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  // Temporizador para limpiar la alerta de éxito automáticamente
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
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los médicos.')
    }
  }

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
      const data = await officeService.listar()
      setConsultorios(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los consultorios.')
    }
  }

  const cargarHorarios = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await doctorScheduleService.listar()
      setHorarios(data || [])
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los horarios médicos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarMedicos()
    cargarSucursales()
    cargarConsultorios()
    cargarHorarios()
  }, [])

  const horariosFiltrados = useMemo(() => {
    return horarios.filter((horario) => {
      const cumpleDoctor = !filtroDoctorId || horario.doctorId === filtroDoctorId
      const cumpleSucursal = !filtroBranchId || horario.branchId === filtroBranchId
      return cumpleDoctor && cumpleSucursal
    })
  }, [horarios, filtroDoctorId, filtroBranchId])

  const from = page * itemsPerPage
  const to = Math.min((page + 1) * itemsPerPage, horariosFiltrados.length)
  const totalPages = Math.ceil(horariosFiltrados.length / itemsPerPage)

  useEffect(() => {
    setPage(0)
  }, [filtroDoctorId, filtroBranchId, itemsPerPage])

  const consultoriosDelFormulario = useMemo(() => {
    if (!form.branchId) return consultorios
    return consultorios.filter((office) => office.branchId === form.branchId)
  }, [consultorios, form.branchId])

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

    return doctor.name || doctor.userId || '-'
  }

  const obtenerNombreSucursal = (horario) => {
    if (horario.branch) {
      return horario.branch.name || '-'
    }

    const branch = sucursales.find((item) => item.id === horario.branchId)
    return branch?.name || '-'
  }

  const obtenerNombreConsultorio = (horario) => {
    if (horario.office) {
      return `${horario.office.code || ''} - ${horario.office.name || ''}`
    }

    const office = consultorios.find((item) => item.id === horario.officeId)
    return office ? `${office.code || ''} - ${office.name || ''}` : '-'
  }

  const obtenerDiaSemana = (dayOfWeek) => {
    const dia = diasSemana.find((item) => Number(item.value) === Number(dayOfWeek))
    return dia?.label || '-'
  }

  const normalizarHora = (hora) => {
    if (!hora) return ''
    return String(hora).length === 5 ? `${hora}:00` : hora
  }

  const abrirModalCrear = () => {
    setEditingSchedule(null)
    setForm({
      ...initialForm,
      doctorId: filtroDoctorId || '',
      branchId: filtroBranchId || '',
    })
    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const abrirModalEditar = (horario) => {
    setEditingSchedule(horario)

    setForm({
      doctorId: horario.doctorId || '',
      branchId: horario.branchId || '',
      officeId: horario.officeId || '',
      dayOfWeek: horario.dayOfWeek || '',
      startTime: horario.startTime ? String(horario.startTime).slice(0, 5) : '',
      endTime: horario.endTime ? String(horario.endTime).slice(0, 5) : '',
      isActive: horario.isActive ?? true,
    })

    setError('')
    setModalError('')
    setSuccess('')
    setVisible(true)
  }

  const cerrarModal = () => {
    setVisible(false)
    setEditingSchedule(null)
    setForm(initialForm)
    setModalError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => {
      const nextForm = {
        ...prev,
        [name]: value,
      }

      if (name === 'branchId') {
        nextForm.officeId = ''
      }

      return nextForm
    })
  }

  const handleChangeEstado = (e) => {
    setForm((prev) => ({
      ...prev,
      isActive: e.target.value === 'true',
    }))
  }

  const validarFormulario = () => {
    if (!String(form.doctorId || '').trim()) return 'Debe seleccionar un médico.'
    if (!String(form.branchId || '').trim()) return 'Debe seleccionar una sucursal.'
    if (!String(form.officeId || '').trim()) return 'Debe seleccionar un consultorio.'
    if (!String(form.dayOfWeek || '').trim()) return 'Debe seleccionar el día de semana.'
    if (!String(form.startTime || '').trim()) return 'Debe ingresar la hora de inicio.'
    if (!String(form.endTime || '').trim()) return 'Debe ingresar la hora fin.'

    if (form.startTime >= form.endTime) {
      return 'La hora de inicio debe ser menor que la hora fin.'
    }

    return ''
  }

  const guardarHorario = async () => {
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
        branchId: String(form.branchId || '').trim(),
        officeId: String(form.officeId || '').trim(),
        dayOfWeek: Number(form.dayOfWeek),
        startTime: normalizarHora(form.startTime),
        endTime: normalizarHora(form.endTime),
        isActive: form.isActive,
      }

      if (editingSchedule) {
        await doctorScheduleService.actualizar(editingSchedule.id, payload)
        setSuccess('Horario médico actualizado correctamente.')
      } else {
        await doctorScheduleService.crear(payload)
        setSuccess('Horario médico creado correctamente.')
      }

      cerrarModal()
      await cargarHorarios()
    } catch (err) {
      console.error(err)
      setModalError(err?.message || 'Ocurrió un error al guardar el horario médico.')
    } finally {
      setSaving(false)
    }
  }

  // Prepara y abre el modal dinámico dependiendo del estado actual del horario
  const confirmarAlternarEstadoHorario = (horario) => {
    const accion = horario.isActive ? 'inactivar' : 'activar'
    setConfirmModal({
      visible: true,
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} Horario Médico`,
      message: `¿Seguro que deseas ${accion} el horario de ${obtenerNombreMedico(horario.doctorId)} los días ${obtenerDiaSemana(horario.dayOfWeek)}?`,
      onConfirm: () => ejecutarAlternarEstado(horario),
    })
  }

  const ejecutarAlternarEstado = async (horario) => {
    setConfirmModal((prev) => ({ ...prev, visible: false }))
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (horario.isActive) {
        await doctorScheduleService.eliminar(horario.id)
        setSuccess('Horario médico inactivado correctamente.')
      } else {
        const payload = {
          doctorId: horario.doctorId,
          branchId: horario.branchId,
          officeId: horario.officeId,
          dayOfWeek: Number(horario.dayOfWeek),
          startTime: normalizarHora(horario.startTime),
          endTime: normalizarHora(horario.endTime),
          isActive: true,
        }
        await doctorScheduleService.actualizar(horario.id, payload)
        setSuccess('Horario médico activado correctamente.')
      }

      await cargarHorarios()
    } catch (err) {
      console.error(err)
      setError('No se pudo cambiar el estado del horario médico.')
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
          <strong>Horarios Médicos</strong>

          <CButton color="primary" onClick={abrirModalCrear}>
            Nuevo horario
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
              <CFormLabel>Filtro: Sucursal</CFormLabel>
              <CFormSelect
                value={filtroBranchId}
                onChange={(e) => setFiltroBranchId(e.target.value)}
              >
                <option value="">Todas las sucursales</option>

                {sucursales.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} - {branch.city}
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
                  setFiltroBranchId('')
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
                  <CTableHeaderCell scope="col">Sucursal</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Consultorio</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Día</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Hora inicio</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Hora fin</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Estado</CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="text-end">
                    Acciones
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
  {horariosFiltrados.length === 0 ? (
    <CTableRow>
      <CTableDataCell colSpan={9} className="text-center">
        No existen horarios médicos registrados.
      </CTableDataCell>
    </CTableRow>
  ) : (
    horariosFiltrados.slice(from, to).map((horario, index) => (
      <CTableRow key={horario.id}>
        <CTableHeaderCell scope="row">{from + index + 1}</CTableHeaderCell>
                      <CTableDataCell>{obtenerNombreMedico(horario.doctorId)}</CTableDataCell>
                      <CTableDataCell>{obtenerNombreSucursal(horario)}</CTableDataCell>
                      <CTableDataCell>{obtenerNombreConsultorio(horario)}</CTableDataCell>
                      <CTableDataCell>{obtenerDiaSemana(horario.dayOfWeek)}</CTableDataCell>
                      <CTableDataCell>{horario.startTime}</CTableDataCell>
                      <CTableDataCell>{horario.endTime}</CTableDataCell>

                      <CTableDataCell>
                        {horario.isActive ? (
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
                          onClick={() => abrirModalEditar(horario)}
                        >
                          Editar
                        </CButton>

                        <CButton
                          color={horario.isActive ? 'danger' : 'success'}
                          variant="outline"
                          size="sm"
                          onClick={() => confirmarAlternarEstadoHorario(horario)}
                        >
                          {horario.isActive ? 'Inactivar' : 'Activar'}
                        </CButton>
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
    <CButton 
      color="secondary" 
      variant="outline" 
      size="sm" 
      disabled={page === 0} 
      onClick={() => setPage(page - 1)} 
      className="me-2"
    >
      Anterior
    </CButton>
    <span className="mx-2">Pág {page + 1} de {totalPages || 1}</span>
    <CButton 
      color="secondary" 
      variant="outline" 
      size="sm" 
      disabled={page >= totalPages - 1} 
      onClick={() => setPage(page + 1)}
    >
      Siguiente
    </CButton>
  </div>
</div>
        </CCardBody>
      </CCard>

      {/* MODAL FORMULARIO DE HORARIO */}
      <CModal visible={visible} onClose={cerrarModal} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>{editingSchedule ? 'Editar horario médico' : 'Nuevo horario médico'}</CModalTitle>
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
              <CFormSelect name="doctorId" value={form.doctorId || ''} onChange={handleChange}>
                <option value="">Seleccione un médico</option>

                {medicos.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {obtenerNombreMedico(doctor.id)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormLabel>Sucursal</CFormLabel>
              <CFormSelect name="branchId" value={form.branchId || ''} onChange={handleChange}>
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
              <CFormLabel>Consultorio</CFormLabel>
              <CFormSelect name="officeId" value={form.officeId || ''} onChange={handleChange}>
                <option value="">Seleccione un consultorio</option>

                {consultoriosDelFormulario
                  .filter((office) => office.isActive)
                  .map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.code} - {office.name} {office.floor ? `(${office.floor})` : ''}
                    </option>
                  ))}
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormLabel>Día de semana</CFormLabel>
              <CFormSelect name="dayOfWeek" value={form.dayOfWeek || ''} onChange={handleChange}>
                <option value="">Seleccione un día</option>

                {diasSemana.map((dia) => (
                  <option key={dia.value} value={dia.value}>
                    {dia.label}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormLabel>Hora inicio</CFormLabel>
              <CFormInput
                type="time"
                name="startTime"
                value={form.startTime || ''}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Hora fin</CFormLabel>
              <CFormInput
                type="time"
                name="endTime"
                value={form.endTime || ''}
                onChange={handleChange}
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

          <CButton color="primary" onClick={guardarHorario} disabled={saving}>
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

export default HorariosMedicos