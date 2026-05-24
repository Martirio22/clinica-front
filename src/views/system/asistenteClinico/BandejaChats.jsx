import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
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
import { useNavigate } from 'react-router-dom'

import { chatSessionService } from '../../../services/chatSessionService'

const BandejaChats = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const [chats, setChats] = useState([])
  const [filtro, setFiltro] = useState('esperando')
  const [busqueda, setBusqueda] = useState('')

  const [modalChat, setModalChat] = useState(false)
  const [chatSeleccionado, setChatSeleccionado] = useState(null)

  const assistantIdActual =
    localStorage.getItem('assistantId') ||
    localStorage.getItem('clinicalAssistantId') ||
    localStorage.getItem('asistenteId') ||
    localStorage.getItem('userId') ||
    ''

  const cargarChats = async () => {
    try {
      setLoading(true)
      setError(null)
      setMensaje(null)

      const data = await chatSessionService.listar()
      setChats(data || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al cargar la bandeja de chats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarChats()
  }, [])

  const getEstadoCode = (chat) => {
    return chat.status?.code || chat.statusCode || ''
  }

  const getEstadoName = (chat) => {
    return chat.status?.name || chat.statusName || 'Sin estado'
  }

  const esChatCerrado = (chat) => {
    const code = getEstadoCode(chat).toUpperCase()
    const name = getEstadoName(chat).toLowerCase()

    return (
      !!chat.closeDate ||
      code === 'CERRADO' ||
      code === 'FINALIZADO' ||
      name.includes('cerrado') ||
      name.includes('finalizado')
    )
  }

  const esChatEsperando = (chat) => {
    const code = getEstadoCode(chat).toUpperCase()
    const name = getEstadoName(chat).toLowerCase()

    return (
      !esChatCerrado(chat) &&
      !chat.assignedAssistantId &&
      (
        chat.handledByBot === false ||
        code === 'ESPERANDO_ASISTENTE' ||
        code === 'PENDIENTE_HUMANO' ||
        code === 'HUMANO_PENDIENTE' ||
        code === 'BOT_ACTIVO' ||
        name.includes('esperando') ||
        name.includes('pendiente')
      )
    )
  }

  const esMiChat = (chat) => {
    return (
      !esChatCerrado(chat) &&
      assistantIdActual &&
      chat.assignedAssistantId === assistantIdActual
    )
  }

  const esChatActivo = (chat) => {
    return !esChatCerrado(chat)
  }

  const chatsFiltrados = useMemo(() => {
    let resultado = chats

    if (filtro === 'esperando') {
      resultado = chats.filter(esChatEsperando)
    }

    if (filtro === 'mis') {
      resultado = chats.filter(esMiChat)
    }

    if (filtro === 'activos') {
      resultado = chats.filter(esChatActivo)
    }

    if (filtro === 'cerrados') {
      resultado = chats.filter(esChatCerrado)
    }

    if (busqueda.trim()) {
      const texto = busqueda.trim().toLowerCase()

      resultado = resultado.filter((chat) => {
        const nombre = getNombrePaciente(chat).toLowerCase()
        const numero = getNumeroWhatsapp(chat).toLowerCase()
        const estado = getEstadoName(chat).toLowerCase()

        return (
          nombre.includes(texto) ||
          numero.includes(texto) ||
          estado.includes(texto)
        )
      })
    }

    return resultado
  }, [chats, filtro, busqueda, assistantIdActual])

  const resumen = useMemo(() => {
    return {
      esperando: chats.filter(esChatEsperando).length,
      mis: chats.filter(esMiChat).length,
      activos: chats.filter(esChatActivo).length,
      cerrados: chats.filter(esChatCerrado).length,
    }
  }, [chats, assistantIdActual])

  const getNombrePaciente = (chat) => {
    if (chat.patient) {
      return `${chat.patient.firstName || ''} ${chat.patient.lastName || ''}`.trim() || 'Paciente'
    }

    return chat.patientWhatsappName || 'Contacto WhatsApp'
  }

  const getNumeroWhatsapp = (chat) => {
    return chat.patientWhatsappNumber || '-'
  }

  const getIdentificacionPaciente = (chat) => {
    return chat.patient?.identification || '-'
  }

  const getUltimaFechaMensaje = (chat) => {
    return (
      chat.lastMessageDate ||
      chat.lastMessageAt ||
      chat.updatedAt ||
      chat.humanAssignmentDate ||
      chat.startDate ||
      '-'
    )
  }

  const formatFechaHora = (dateValue) => {
    if (!dateValue || dateValue === '-') return '-'

    return new Date(dateValue).toLocaleString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getBadgeEstadoColor = (chat) => {
    if (esChatCerrado(chat)) return 'secondary'
    if (esMiChat(chat)) return 'success'
    if (esChatEsperando(chat)) return 'warning'

    return 'info'
  }

  const tomarChat = async (chat) => {
    try {
      setSaving(true)
      setError(null)
      setMensaje(null)

      if (!assistantIdActual) {
        setError('No se encontró el ID del asistente en localStorage')
        return
      }

      await chatSessionService.asignarAsistente(chat.id, assistantIdActual)

      navigate(`/asistente-clinico/chat-en-vivo/${chat.id}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo tomar el chat')
    } finally {
      setSaving(false)
    }
  }

  const abrirChat = (chat) => {
    setChatSeleccionado(chat)
    setModalChat(true)
  }

  const verPaciente = (chat) => {
    if (!chat.patientId) {
      setError('Este chat todavía no tiene un paciente vinculado')
      return
    }

    navigate(`/pacientes/perfil-paciente/${chat.patientId}`)
  }

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h5 className="mb-0">Bandeja de Chats</h5>
            <small className="text-body-secondary">
              Chats esperando asistente, asignados, activos y cerrados
            </small>
          </div>

          <CButton color="primary" variant="outline" onClick={cargarChats}>
            Refrescar
          </CButton>
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

          <CRow className="mb-3">
            <CCol xs={12} md={6} xl={3} className="mb-3">
              <CCard className="h-100">
                <CCardBody>
                  <div className="text-body-secondary">Esperando asistente</div>
                  <h2 className="mb-0">{resumen.esperando}</h2>
                  <CBadge color="warning" className="mt-2">
                    Pendientes
                  </CBadge>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} md={6} xl={3} className="mb-3">
              <CCard className="h-100">
                <CCardBody>
                  <div className="text-body-secondary">Mis chats</div>
                  <h2 className="mb-0">{resumen.mis}</h2>
                  <CBadge color="success" className="mt-2">
                    Asignados a mí
                  </CBadge>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} md={6} xl={3} className="mb-3">
              <CCard className="h-100">
                <CCardBody>
                  <div className="text-body-secondary">Chats activos</div>
                  <h2 className="mb-0">{resumen.activos}</h2>
                  <CBadge color="info" className="mt-2">
                    Activos
                  </CBadge>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} md={6} xl={3} className="mb-3">
              <CCard className="h-100">
                <CCardBody>
                  <div className="text-body-secondary">Chats cerrados</div>
                  <h2 className="mb-0">{resumen.cerrados}</h2>
                  <CBadge color="secondary" className="mt-2">
                    Cerrados
                  </CBadge>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <CButtonGroup>
              <CButton
                color={filtro === 'esperando' ? 'primary' : 'secondary'}
                variant={filtro === 'esperando' ? undefined : 'outline'}
                onClick={() => setFiltro('esperando')}
              >
                Esperando asistente
              </CButton>

              <CButton
                color={filtro === 'mis' ? 'primary' : 'secondary'}
                variant={filtro === 'mis' ? undefined : 'outline'}
                onClick={() => setFiltro('mis')}
              >
                Mis chats
              </CButton>

              <CButton
                color={filtro === 'activos' ? 'primary' : 'secondary'}
                variant={filtro === 'activos' ? undefined : 'outline'}
                onClick={() => setFiltro('activos')}
              >
                Activos
              </CButton>

              <CButton
                color={filtro === 'cerrados' ? 'primary' : 'secondary'}
                variant={filtro === 'cerrados' ? undefined : 'outline'}
                onClick={() => setFiltro('cerrados')}
              >
                Cerrados
              </CButton>
            </CButtonGroup>

            <CFormInput
              style={{ maxWidth: 320 }}
              placeholder="Buscar por paciente, número o estado"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-5">
              <CSpinner />
              <div className="mt-2">Cargando chats...</div>
            </div>
          ) : (
            <CTable responsive hover align="middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Paciente / Contacto</CTableHeaderCell>
                  <CTableHeaderCell>WhatsApp</CTableHeaderCell>
                  <CTableHeaderCell>Estado sesión</CTableHeaderCell>
                  <CTableHeaderCell>Último mensaje</CTableHeaderCell>
                  <CTableHeaderCell>Asignado</CTableHeaderCell>
                  <CTableHeaderCell>Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {chatsFiltrados.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center text-body-secondary py-4">
                      No hay chats para este filtro.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  chatsFiltrados.map((chat) => (
                    <CTableRow key={chat.id}>
                      <CTableDataCell>
                        <strong>{getNombrePaciente(chat)}</strong>
                        <div className="small text-body-secondary">
                          Identificación: {getIdentificacionPaciente(chat)}
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>{getNumeroWhatsapp(chat)}</CTableDataCell>

                      <CTableDataCell>
                        <CBadge color={getBadgeEstadoColor(chat)}>
                          {getEstadoName(chat)}
                        </CBadge>
                      </CTableDataCell>

                      <CTableDataCell>{formatFechaHora(getUltimaFechaMensaje(chat))}</CTableDataCell>

                      <CTableDataCell>
                        {chat.assignedAssistantId ? (
                          <CBadge color={esMiChat(chat) ? 'success' : 'info'}>
                            {esMiChat(chat) ? 'Asignado a mí' : 'Asignado'}
                          </CBadge>
                        ) : (
                          <CBadge color="warning">Sin asignar</CBadge>
                        )}
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="d-flex flex-wrap gap-2">
                          {!chat.assignedAssistantId && !esChatCerrado(chat) && (
                            <CButton
                              size="sm"
                              color="success"
                              variant="outline"
                              disabled={saving}
                              onClick={() => tomarChat(chat)}
                            >
                              Tomar chat
                            </CButton>
                          )}

                          <CButton
                            size="sm"
                            color="primary"
                            variant="outline"
                            onClick={() => abrirChat(chat)}
                          >
                            Abrir chat
                          </CButton>

                          <CButton
                            size="sm"
                            color="secondary"
                            variant="outline"
                            onClick={() => verPaciente(chat)}
                          >
                            Ver paciente
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={modalChat} onClose={() => setModalChat(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Detalle del chat</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {chatSeleccionado && (
            <CRow>
              <CCol md={6} className="mb-3">
                <strong>Paciente / Contacto</strong>
                <div>{getNombrePaciente(chatSeleccionado)}</div>
              </CCol>

              <CCol md={6} className="mb-3">
                <strong>WhatsApp</strong>
                <div>{getNumeroWhatsapp(chatSeleccionado)}</div>
              </CCol>

              <CCol md={6} className="mb-3">
                <strong>Estado de sesión</strong>
                <div>
                  <CBadge color={getBadgeEstadoColor(chatSeleccionado)}>
                    {getEstadoName(chatSeleccionado)}
                  </CBadge>
                </div>
              </CCol>

              <CCol md={6} className="mb-3">
                <strong>Última fecha de mensaje</strong>
                <div>{formatFechaHora(getUltimaFechaMensaje(chatSeleccionado))}</div>
              </CCol>

              <CCol md={6} className="mb-3">
                <strong>Atendido por bot</strong>
                <div>{chatSeleccionado.handledByBot ? 'Sí' : 'No'}</div>
              </CCol>

              <CCol md={6} className="mb-3">
                <strong>Asignado</strong>
                <div>{chatSeleccionado.assignedAssistantId ? 'Sí' : 'No'}</div>
              </CCol>

              <CCol md={12} className="mb-3">
                <strong>Resumen de conversación</strong>
                <div>{chatSeleccionado.conversationSummary || 'Sin resumen registrado'}</div>
              </CCol>

              <CCol md={12}>
                <strong>Motivo de cierre</strong>
                <div>{chatSeleccionado.closeReason || 'No cerrado'}</div>
              </CCol>
            </CRow>
          )}
        </CModalBody>

        <CModalFooter>
          {chatSeleccionado && !chatSeleccionado.assignedAssistantId && !esChatCerrado(chatSeleccionado) && (
            <CButton
              color="success"
              variant="outline"
              disabled={saving}
              onClick={() => tomarChat(chatSeleccionado)}
            >
              Tomar chat
            </CButton>
          )}

          {chatSeleccionado?.patientId && (
            <CButton color="secondary" variant="outline" onClick={() => verPaciente(chatSeleccionado)}>
              Ver paciente
            </CButton>
          )}

          <CButton color="primary" onClick={() => setModalChat(false)}>
            Cerrar
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default BandejaChats
