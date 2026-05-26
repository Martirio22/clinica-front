import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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

import { aiBotEventService } from '../../../services/aiBotEventService'
import { botIntentService } from '../../../services/botIntentService'
import { specialtyService } from '../../../services/specialtyService'
import { chatSessionService } from '../../../services/chatSessionService'

const EventosIA = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const botIntentIdFromUrl = searchParams.get('botIntentId') || ''

  const [eventos, setEventos] = useState([])
  const [intenciones, setIntenciones] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [sesiones, setSesiones] = useState([])

  const [fechaFiltro, setFechaFiltro] = useState('')
  const [botIntentId, setBotIntentId] = useState(botIntentIdFromUrl)
  const [specialtyId, setSpecialtyId] = useState('')
  const [requiresHuman, setRequiresHuman] = useState('')

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [visibleDetalle, setVisibleDetalle] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarIntenciones = async () => {
    try {
      const data = await botIntentService.listar()
      setIntenciones(data || [])
    } catch (err) {
      console.error(err)
      setIntenciones([])
    }
  }

  const cargarEspecialidades = async () => {
    try {
      const data = await specialtyService.listar()
      setEspecialidades(data || [])
    } catch (err) {
      console.error(err)
      setEspecialidades([])
    }
  }

  const cargarSesiones = async () => {
    try {
      const data = await chatSessionService.listar()
      setSesiones(data || [])
    } catch (err) {
      console.error(err)
      setSesiones([])
    }
  }

  const cargarEventos = async () => {
    try {
      setLoading(true)
      setError('')

      const filters = {}

      if (botIntentId) filters.botIntentId = botIntentId

      if (requiresHuman !== '') {
        filters.requiresHuman = requiresHuman === 'true'
      }

      const data = await aiBotEventService.listarConFiltros(filters)

      setEventos(data || [])
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudieron cargar los eventos IA.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarIntenciones()
    cargarEspecialidades()
    cargarSesiones()
  }, [])

  useEffect(() => {
    cargarEventos()
  }, [botIntentId, requiresHuman])

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((event) => {
      const cumpleFecha = !fechaFiltro || String(event.createdAt || event.date || '').slice(0, 10) === fechaFiltro

      const cumpleEspecialidad =
        !specialtyId || event.suggestedSpecialtyId === specialtyId

      return cumpleFecha && cumpleEspecialidad
    })
  }, [eventos, fechaFiltro, specialtyId])

  const obtenerIntencion = (id) => {
    return intenciones.find((intent) => intent.id === id)
  }

  const obtenerNombreIntencion = (id) => {
    const intent = obtenerIntencion(id)
    return intent ? `${intent.code} - ${intent.name}` : '-'
  }

  const obtenerEspecialidad = (id) => {
    return especialidades.find((specialty) => specialty.id === id)
  }

  const obtenerNombreEspecialidad = (id) => {
    const specialty = obtenerEspecialidad(id)
    return specialty ? specialty.name : '-'
  }

  const obtenerSesion = (id) => {
    return sesiones.find((session) => session.id === id)
  }

  const obtenerTextoSesion = (id) => {
    const session = obtenerSesion(id)

    if (!session) return id || '-'

    const phone =
      session.whatsappPhone ||
      session.phone ||
      session.patientPhone ||
      session.contactPhone ||
      session.from ||
      ''

    return phone ? `${id} - ${phone}` : id
  }

  const obtenerColorConfianza = (value) => {
    const confidence = Number(value || 0)

    if (confidence >= 0.8) return 'success'
    if (confidence >= 0.5) return 'warning'
    return 'danger'
  }

  const formatearConfianza = (value) => {
    const confidence = Number(value || 0)

    if (Number.isNaN(confidence)) return '-'

    return `${Math.round(confidence * 100)}%`
  }

  const formatearFechaHora = (value) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return String(value).replace('T', ' ')
    }

    return date.toLocaleString()
  }

  const limpiarFiltros = () => {
    setFechaFiltro('')
    setBotIntentId('')
    setSpecialtyId('')
    setRequiresHuman('')
  }

  const verSesionChat = (event) => {
    if (!event.chatSessionId) {
      setError('El evento no tiene sesión de chat asociada.')
      return
    }

    navigate(`/asistente-clinico/chat-en-vivo/${event.chatSessionId}`)
  }

  const verDetalle = (event) => {
    setSelectedEvent(event)
    setVisibleDetalle(true)
  }

  const cerrarDetalle = () => {
    setSelectedEvent(null)
    setVisibleDetalle(false)
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Eventos IA del Bot</strong>

          <div>
            <CButton color="secondary" variant="outline" className="me-2" onClick={limpiarFiltros}>
              Limpiar filtros
            </CButton>

            <CButton color="primary" onClick={cargarEventos}>
              Actualizar
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

          <CRow className="mb-3 g-3">
            <CCol md={3}>
              <CFormLabel>Filtro: Fecha</CFormLabel>
              <CFormInput
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
              />
            </CCol>

            <CCol md={3}>
              <CFormLabel>Filtro: Intención</CFormLabel>
              <CFormSelect value={botIntentId} onChange={(e) => setBotIntentId(e.target.value)}>
                <option value="">Todas</option>
                {intenciones
                  .filter((intent) => intent.isActive !== false)
                  .map((intent) => (
                    <option key={intent.id} value={intent.id}>
                      {intent.code} - {intent.name}
                    </option>
                  ))}
              </CFormSelect>
            </CCol>

            <CCol md={3}>
              <CFormLabel>Filtro: Especialidad</CFormLabel>
              <CFormSelect value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)}>
                <option value="">Todas</option>
                {especialidades
                  .filter((specialty) => specialty.isActive !== false)
                  .map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </option>
                  ))}
              </CFormSelect>
            </CCol>

            <CCol md={3}>
              <CFormLabel>Requiere humano</CFormLabel>
              <CFormSelect value={requiresHuman} onChange={(e) => setRequiresHuman(e.target.value)}>
                <option value="">Todos</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
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
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Fecha</CTableHeaderCell>
                  <CTableHeaderCell>Texto paciente</CTableHeaderCell>
                  <CTableHeaderCell>Intención IA</CTableHeaderCell>
                  <CTableHeaderCell>Especialidad sugerida</CTableHeaderCell>
                  <CTableHeaderCell>Confianza</CTableHeaderCell>
                  <CTableHeaderCell>Pidió humano</CTableHeaderCell>
                  <CTableHeaderCell>Respuesta IA</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {eventosFiltrados.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center">
                      No existen eventos IA para los filtros seleccionados.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  eventosFiltrados.map((event, index) => (
                    <CTableRow key={event.id}>
                      <CTableHeaderCell>{index + 1}</CTableHeaderCell>

                      <CTableDataCell>{formatearFechaHora(event.createdAt)}</CTableDataCell>

                      <CTableDataCell>
                        <div style={{ maxWidth: 260, whiteSpace: 'pre-wrap' }}>
                          {String(event.userText || '').length > 120
                            ? `${String(event.userText || '').slice(0, 120)}...`
                            : event.userText || '-'}
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>{obtenerNombreIntencion(event.botIntentId)}</CTableDataCell>

                      <CTableDataCell>{obtenerNombreEspecialidad(event.suggestedSpecialtyId)}</CTableDataCell>

                      <CTableDataCell>
                        <CBadge color={obtenerColorConfianza(event.confidenceLevel)}>
                          {formatearConfianza(event.confidenceLevel)}
                        </CBadge>
                      </CTableDataCell>

                      <CTableDataCell>
                        {event.requiresHuman ? (
                          <CBadge color="danger">Sí</CBadge>
                        ) : (
                          <CBadge color="success">No</CBadge>
                        )}
                      </CTableDataCell>

                      <CTableDataCell>
                        <div style={{ maxWidth: 300, whiteSpace: 'pre-wrap' }}>
                          {String(event.aiResponse || '').length > 140
                            ? `${String(event.aiResponse || '').slice(0, 140)}...`
                            : event.aiResponse || '-'}
                        </div>
                      </CTableDataCell>

                      <CTableDataCell className="text-end">
                        <CButton
                          color="info"
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => verDetalle(event)}
                        >
                          Ver detalle
                        </CButton>

                        <CButton
                          color="primary"
                          variant="outline"
                          size="sm"
                          className="mb-1"
                          onClick={() => verSesionChat(event)}
                        >
                          Ver sesión chat
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

      <CModal visible={visibleDetalle} onClose={cerrarDetalle} size="xl">
        <CModalHeader>
          <CModalTitle>Detalle del evento IA</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {selectedEvent && (
            <>
              <CAlert color="info">
                <strong>Sesión:</strong> {obtenerTextoSesion(selectedEvent.chatSessionId)}
                <br />
                <strong>Fecha:</strong> {formatearFechaHora(selectedEvent.createdAt)}
              </CAlert>

              <CRow className="g-3">
                <CCol md={6}>
                  <CCard>
                    <CCardHeader>
                      <strong>Texto del paciente</strong>
                    </CCardHeader>
                    <CCardBody>
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedEvent.userText || '-'}
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>

                <CCol md={6}>
                  <CCard>
                    <CCardHeader>
                      <strong>Respuesta generada por IA</strong>
                    </CCardHeader>
                    <CCardBody>
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedEvent.aiResponse || '-'}
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>

                <CCol md={4}>
                  <p>
                    <strong>Intención detectada:</strong>
                    <br />
                    {obtenerNombreIntencion(selectedEvent.botIntentId)}
                  </p>
                </CCol>

                <CCol md={4}>
                  <p>
                    <strong>Especialidad sugerida:</strong>
                    <br />
                    {obtenerNombreEspecialidad(selectedEvent.suggestedSpecialtyId)}
                  </p>
                </CCol>

                <CCol md={4}>
                  <p>
                    <strong>Nivel de confianza:</strong>
                    <br />
                    <CBadge color={obtenerColorConfianza(selectedEvent.confidenceLevel)}>
                      {formatearConfianza(selectedEvent.confidenceLevel)}
                    </CBadge>
                  </p>
                </CCol>

                <CCol md={4}>
                  <p>
                    <strong>Requiere humano:</strong>
                    <br />
                    {selectedEvent.requiresHuman ? (
                      <CBadge color="danger">Sí</CBadge>
                    ) : (
                      <CBadge color="success">No</CBadge>
                    )}
                  </p>
                </CCol>
              </CRow>
            </>
          )}
        </CModalBody>

        <CModalFooter>
          {selectedEvent && (
            <CButton color="primary" onClick={() => verSesionChat(selectedEvent)}>
              Ver sesión chat
            </CButton>
          )}

          <CButton color="secondary" variant="outline" onClick={cerrarDetalle}>
            Cerrar
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default EventosIA
