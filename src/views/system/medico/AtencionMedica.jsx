import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react'
import { useNavigate, useParams } from 'react-router-dom'

import { appointmentService } from '../../../services/appointmentService'
import { appointmentStatusService } from '../../../services/appointmentStatusService'
import { attendanceAuthorizationService } from '../../../services/attendanceAuthorizationService'
import { medicalAttentionService } from '../../../services/medicalAttentionService'
import { attentionStatusService } from '../../../services/attentionStatusService'
import { medicalPrescriptionService } from '../../../services/medicalPrescriptionService'

const AtencionMedica = () => {
  const navigate = useNavigate()
  const { appointmentId } = useParams()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const [cita, setCita] = useState(null)
  const [autorizacion, setAutorizacion] = useState(null)
  const [historial, setHistorial] = useState([])
  const [atencionActual, setAtencionActual] = useState(null)

  const [estadosAtencion, setEstadosAtencion] = useState([])
  const [estadosCita, setEstadosCita] = useState([])

  const [modalHistorial, setModalHistorial] = useState(false)
  const [modalReceta, setModalReceta] = useState(false)

  const [formAtencion, setFormAtencion] = useState({
    symptoms: '',
    diagnosis: '',
    indications: '',
    observations: '',
  })

  const [formReceta, setFormReceta] = useState({
    prescriptionCode: '',
    generalIndications: '',
  })

  const storageKey = useMemo(() => {
    return appointmentId ? `atencion_medica_avance_${appointmentId}` : null
  }, [appointmentId])

  const formatFecha = (dateValue) => {
    if (!dateValue) return '-'

    return new Date(dateValue).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const formatHora = (dateValue) => {
    if (!dateValue) return '-'

    return new Date(dateValue).toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getNombrePaciente = () => {
    if (cita?.patient) {
      return `${cita.patient.firstName || ''} ${cita.patient.lastName || ''}`.trim()
    }

    return cita?.patientName || 'Paciente'
  }

  const getIdentificacionPaciente = () => {
    return cita?.patient?.identification || cita?.patientIdentification || '-'
  }

  const getWhatsappPaciente = () => {
    return cita?.patient?.whatsappPhone || cita?.patientWhatsappPhone || '-'
  }

  const getEmailPaciente = () => {
    return cita?.patient?.email || cita?.patientEmail || '-'
  }

  const getNombreDoctor = () => {
    if (cita?.doctor?.user) {
      return `${cita.doctor.user.firstName || ''} ${cita.doctor.user.lastName || ''}`.trim()
    }

    return cita?.doctorName || 'Médico'
  }

  const getNombreEspecialidad = () => {
    return cita?.specialty?.name || cita?.specialtyName || '-'
  }

  const getNombreSucursal = () => {
    return cita?.branch?.name || cita?.branchName || '-'
  }

  const getNombreConsultorio = () => {
    return cita?.office?.name || cita?.officeName || '-'
  }

  const getEstadoCita = () => {
    return cita?.status?.name || cita?.statusName || 'Sin estado'
  }

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)
      setMensaje(null)

      const [
        citaData,
        autorizacionesData,
        atencionesData,
        estadosAtencionData,
        estadosCitaData,
      ] = await Promise.all([
        appointmentService.obtener(appointmentId),
        attendanceAuthorizationService.listarConFiltros({ appointmentId }),
        medicalAttentionService.listar(),
        attentionStatusService.listar(),
        appointmentStatusService.listar(),
      ])

      setCita(citaData || null)
      setEstadosAtencion(estadosAtencionData || [])
      setEstadosCita(estadosCitaData || [])

      const autorizacionEncontrada = Array.isArray(autorizacionesData)
        ? autorizacionesData[0]
        : null

      setAutorizacion(autorizacionEncontrada || null)

      const atenciones = Array.isArray(atencionesData) ? atencionesData : []

      const actual = atenciones.find((item) => item.appointmentId === appointmentId)

      setAtencionActual(actual || null)

      if (actual) {
        setFormAtencion({
          symptoms: actual.symptoms || '',
          diagnosis: actual.diagnosis || '',
          indications: actual.indications || '',
          observations: actual.observations || '',
        })
      } else if (storageKey) {
        const avanceLocal = localStorage.getItem(storageKey)

        if (avanceLocal) {
          setFormAtencion(JSON.parse(avanceLocal))
        }
      }

      const patientId = citaData?.patientId

      const historialPaciente = atenciones
        .filter((item) => item.patientId === patientId && item.appointmentId !== appointmentId)
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))

      setHistorial(historialPaciente)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al cargar la atención médica')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (appointmentId) {
      cargarDatos()
    }
  }, [appointmentId])

  const obtenerEstadoAtencionInicial = () => {
    return (
      estadosAtencion.find((x) => x.code === 'EN_CURSO') ||
      estadosAtencion.find((x) => x.code === 'INICIADA') ||
      estadosAtencion.find((x) => x.code === 'ABIERTA') ||
      estadosAtencion.find((x) => x.isActive) ||
      estadosAtencion[0]
    )
  }

  const obtenerEstadoCitaAtendida = () => {
    return (
      estadosCita.find((x) => x.code === 'ATENDIDA') ||
      estadosCita.find((x) => x.code === 'FINALIZADA') ||
      estadosCita.find((x) => x.name?.toLowerCase().includes('atendida'))
    )
  }

  const iniciarAtencion = async () => {
    if (!cita) return

    try {
      setSaving(true)
      setError(null)
      setMensaje(null)

      if (atencionActual) {
        setMensaje('La atención ya fue iniciada')
        return
      }

      const estadoInicial = obtenerEstadoAtencionInicial()

      if (!estadoInicial) {
        setError('No existe un estado de atención disponible para iniciar')
        return
      }

      const data = await medicalAttentionService.iniciar({
        appointmentId: cita.id,
        patientId: cita.patientId,
        doctorId: cita.doctorId,
        statusAttentionId: estadoInicial.id,
        reasonConsultation: cita.reason || '',
        symptoms: formAtencion.symptoms,
        diagnosis: formAtencion.diagnosis,
        indications: formAtencion.indications,
        observations: formAtencion.observations,
      })

      setAtencionActual(data)
      setMensaje('Atención iniciada correctamente')
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo iniciar la atención')
    } finally {
      setSaving(false)
    }
  }

  const guardarAtencion = async () => {
    try {
      setSaving(true)
      setError(null)
      setMensaje(null)

      if (!storageKey) return

      localStorage.setItem(storageKey, JSON.stringify(formAtencion))

      setMensaje('Avance guardado temporalmente')

      /*
        OJO:
        Tu backend actual no tiene un endpoint para guardar avance parcial.
        Solo tienes:
        POST /medicalcare/medical-attention
        PUT  /medicalcare/medical-attention/:id/finalizar

        Si luego agregas un endpoint PUT /medicalcare/medical-attention/:id,
        aquí podrías llamar a:
        await medicalAttentionService.actualizar(atencionActual.id, formAtencion)
      */
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo guardar el avance')
    } finally {
      setSaving(false)
    }
  }

  const finalizarAtencion = async () => {
  if (!atencionActual) {
    setError('Primero debes iniciar la atención')
    return
  }

  try {
    setSaving(true)
    setError(null)
    setMensaje(null)

    const data = await medicalAttentionService.finalizar(atencionActual.id, {
      symptoms: formAtencion.symptoms,
      diagnosis: formAtencion.diagnosis,
      indications: formAtencion.indications,
      observations: formAtencion.observations,
    })

    setAtencionActual(data)

    const estadoAtendida = obtenerEstadoCitaAtendida()

    if (estadoAtendida && cita?.id) {
      await appointmentService.actualizar(cita.id, {
        statusId: estadoAtendida.id,
      })
    }

    if (storageKey) {
      localStorage.removeItem(storageKey)
    }

    setMensaje('Atención finalizada correctamente')

    await cargarDatos()

    navigate('/medico/recetas-medicas')

  } catch (err) {
    console.error(err)
    setError(err.message || 'No se pudo finalizar la atención')
  } finally {
    setSaving(false)
  }
}

  const crearReceta = async () => {
    if (!atencionActual) {
      setError('Primero debes iniciar la atención para crear una receta')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setMensaje(null)

      await medicalPrescriptionService.crear({
        medicalAttentionId: atencionActual.id,
        prescriptionCode: formReceta.prescriptionCode || undefined,
        generalIndications: formReceta.generalIndications,
      })

      setMensaje('Receta médica creada correctamente')
      setModalReceta(false)

      setFormReceta({
        prescriptionCode: '',
        generalIndications: '',
      })
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo crear la receta médica')
    } finally {
      setSaving(false)
    }
  }

  const volverCalendario = () => {
    navigate('/medico/mi-calendario')
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner />
        <div className="mt-2">Cargando atención médica...</div>
      </div>
    )
  }

  if (!appointmentId) {
    return (
      <CCard>
        <CCardHeader>
          <strong>Atención Médica</strong>
        </CCardHeader>
        <CCardBody>
          <CAlert color="info">
            Para iniciar una atención médica, primero selecciona una cita desde Mi Calendario.
          </CAlert>

          <CButton color="primary" onClick={() => navigate('/medico/mi-calendario')}>
            Ir a Mi Calendario
          </CButton>
        </CCardBody>
      </CCard>
    )
  }

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h5 className="mb-0">Atención Médica</h5>
            <small className="text-body-secondary">
              Registro clínico de la cita, diagnóstico, indicaciones y receta médica
            </small>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <CButton color="secondary" variant="outline" onClick={volverCalendario}>
              Volver al calendario
            </CButton>

            <CButton color="info" variant="outline" onClick={() => setModalHistorial(true)}>
              Ver historial
            </CButton>

            <CButton color="success" onClick={iniciarAtencion} disabled={saving || !!atencionActual}>
              Iniciar atención
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError(null)}>
              {error}
            </CAlert>
          )}

          {mensaje && (
            <CAlert color="success" dismissible onClose={() => setMensaje(null)}>
              {mensaje}
            </CAlert>
          )}

          <CRow>
            <CCol lg={4}>
              <CCard className="mb-3">
                <CCardHeader>
                  <strong>Datos de la cita</strong>
                </CCardHeader>

                <CCardBody>
                  <div className="mb-2">
                    <strong>Fecha:</strong>
                    <div>{formatFecha(cita?.startDate)}</div>
                  </div>

                  <div className="mb-2">
                    <strong>Hora:</strong>
                    <div>{formatHora(cita?.startDate)} - {formatHora(cita?.endDate)}</div>
                  </div>

                  <div className="mb-2">
                    <strong>Estado:</strong>
                    <div>
                      <CBadge color="info">{getEstadoCita()}</CBadge>
                    </div>
                  </div>

                  <div className="mb-2">
                    <strong>Médico:</strong>
                    <div>{getNombreDoctor()}</div>
                  </div>

                  <div className="mb-2">
                    <strong>Especialidad:</strong>
                    <div>{getNombreEspecialidad()}</div>
                  </div>

                  <div className="mb-2">
                    <strong>Sucursal:</strong>
                    <div>{getNombreSucursal()}</div>
                  </div>

                  <div className="mb-2">
                    <strong>Consultorio:</strong>
                    <div>{getNombreConsultorio()}</div>
                  </div>
                </CCardBody>
              </CCard>

              <CCard className="mb-3">
                <CCardHeader>
                  <strong>Datos del paciente</strong>
                </CCardHeader>

                <CCardBody>
                  <div className="mb-2">
                    <strong>Paciente:</strong>
                    <div>{getNombrePaciente()}</div>
                  </div>

                  <div className="mb-2">
                    <strong>Identificación:</strong>
                    <div>{getIdentificacionPaciente()}</div>
                  </div>

                  <div className="mb-2">
                    <strong>WhatsApp:</strong>
                    <div>{getWhatsappPaciente()}</div>
                  </div>

                  <div className="mb-2">
                    <strong>Email:</strong>
                    <div>{getEmailPaciente()}</div>
                  </div>
                </CCardBody>
              </CCard>

              <CCard className="mb-3">
                <CCardHeader>
                  <strong>Autorización</strong>
                </CCardHeader>

                <CCardBody>
                  {autorizacion?.isAuthorized ? (
                    <CBadge color="success">Paciente autorizado</CBadge>
                  ) : (
                    <CBadge color="warning">No autorizado / pendiente</CBadge>
                  )}

                  <div className="mt-3">
                    <strong>Motivo:</strong>
                    <div>{autorizacion?.reason || '-'}</div>
                  </div>

                  <div className="mt-2">
                    <strong>Observación:</strong>
                    <div>{autorizacion?.observation || '-'}</div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol lg={8}>
              <CCard className="mb-3">
                <CCardHeader>
                  <strong>Motivo de consulta</strong>
                </CCardHeader>

                <CCardBody>
                  <div>{cita?.reason || 'Sin motivo registrado'}</div>
                </CCardBody>
              </CCard>

              <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <strong>Registro de atención</strong>

                  {atencionActual ? (
                    <CBadge color="success">Atención iniciada</CBadge>
                  ) : (
                    <CBadge color="secondary">Sin iniciar</CBadge>
                  )}
                </CCardHeader>

                <CCardBody>
                  <CForm>
                    <div className="mb-3">
                      <CFormLabel>Síntomas</CFormLabel>
                      <CFormTextarea
                        rows={4}
                        value={formAtencion.symptoms}
                        onChange={(e) =>
                          setFormAtencion({
                            ...formAtencion,
                            symptoms: e.target.value,
                          })
                        }
                        placeholder="Registrar síntomas del paciente"
                      />
                    </div>

                    <div className="mb-3">
                      <CFormLabel>Diagnóstico</CFormLabel>
                      <CFormTextarea
                        rows={4}
                        value={formAtencion.diagnosis}
                        onChange={(e) =>
                          setFormAtencion({
                            ...formAtencion,
                            diagnosis: e.target.value,
                          })
                        }
                        placeholder="Registrar diagnóstico médico"
                      />
                    </div>

                    <div className="mb-3">
                      <CFormLabel>Indicaciones</CFormLabel>
                      <CFormTextarea
                        rows={4}
                        value={formAtencion.indications}
                        onChange={(e) =>
                          setFormAtencion({
                            ...formAtencion,
                            indications: e.target.value,
                          })
                        }
                        placeholder="Registrar indicaciones para el paciente"
                      />
                    </div>

                    <div className="mb-3">
                      <CFormLabel>Observaciones</CFormLabel>
                      <CFormTextarea
                        rows={4}
                        value={formAtencion.observations}
                        onChange={(e) =>
                          setFormAtencion({
                            ...formAtencion,
                            observations: e.target.value,
                          })
                        }
                        placeholder="Registrar observaciones adicionales"
                      />
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      <CButton color="primary" variant="outline" onClick={guardarAtencion} disabled={saving}>
                        Guardar atención
                      </CButton>

                      <CButton
                        color="warning"
                        variant="outline"
                        onClick={() => setModalReceta(true)}
                        disabled={saving || !atencionActual}
                      >
                        Crear receta
                      </CButton>

                      <CButton color="success" onClick={finalizarAtencion} disabled={saving || !atencionActual}>
                        Finalizar atención
                      </CButton>
                    </div>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CModal visible={modalHistorial} onClose={() => setModalHistorial(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Historial de atenciones anteriores</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {historial.length === 0 ? (
            <div className="text-body-secondary">No hay atenciones anteriores registradas.</div>
          ) : (
            historial.map((item) => (
              <CCard key={item.id} className="mb-3">
                <CCardBody>
                  <div className="d-flex justify-content-between">
                    <strong>{formatFecha(item.startDate)}</strong>
                    <CBadge color="info">{item.status?.name || 'Atención'}</CBadge>
                  </div>

                  <div className="mt-2">
                    <strong>Motivo:</strong>
                    <div>{item.reasonConsultation || '-'}</div>
                  </div>

                  <div className="mt-2">
                    <strong>Síntomas:</strong>
                    <div>{item.symptoms || '-'}</div>
                  </div>

                  <div className="mt-2">
                    <strong>Diagnóstico:</strong>
                    <div>{item.diagnosis || '-'}</div>
                  </div>

                  <div className="mt-2">
                    <strong>Indicaciones:</strong>
                    <div>{item.indications || '-'}</div>
                  </div>

                  <div className="mt-2">
                    <strong>Observaciones:</strong>
                    <div>{item.observations || '-'}</div>
                  </div>
                </CCardBody>
              </CCard>
            ))
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalHistorial(false)}>
            Cerrar
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={modalReceta} onClose={() => setModalReceta(false)}>
        <CModalHeader>
          <CModalTitle>Crear receta médica</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel>Código de receta</CFormLabel>
              <CFormInput
                value={formReceta.prescriptionCode}
                onChange={(e) =>
                  setFormReceta({
                    ...formReceta,
                    prescriptionCode: e.target.value,
                  })
                }
                placeholder="Ejemplo: REC-0001"
              />
            </div>

            <div className="mb-3">
              <CFormLabel>Indicaciones generales</CFormLabel>
              <CFormTextarea
                rows={4}
                value={formReceta.generalIndications}
                onChange={(e) =>
                  setFormReceta({
                    ...formReceta,
                    generalIndications: e.target.value,
                  })
                }
                placeholder="Indicaciones generales de la receta"
              />
            </div>
          </CForm>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setModalReceta(false)}>
            Cancelar
          </CButton>

          <CButton color="warning" onClick={crearReceta} disabled={saving}>
            Crear receta
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default AtencionMedica
