import React, { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
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
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import { whatsappLineService } from '../../../services/whatsappLineService'
import { whatsappWorkerService } from '../../../services/webhook/whatsappWorkerService'

const initialForm = {
  id: null,
  code: '',
  name: '',
  phoneNumber: '',
  description: '',
  isActive: true,
}

const LineasWhatsapp = () => {
  const [lineas, setLineas] = useState([])
  const [workerEstados, setWorkerEstados] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [visibleForm, setVisibleForm] = useState(false)
  const [visibleQr, setVisibleQr] = useState(false)
  const [visibleTest, setVisibleTest] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [selectedLine, setSelectedLine] = useState(null)

  const [form, setForm] = useState(initialForm)

  const [testMessage, setTestMessage] = useState({
    to: '',
    message: '',
  })

  const [modalError, setModalError] = useState('')

  useEffect(() => {
    cargarLineas()
  }, [])

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_WHATSAPP_WORKER_URL || 'http://localhost:3978'

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.log('Socket conectado al worker WhatsApp:', socket.id)
    })

    socket.on('whatsapp:ready', (data) => {
      console.log('Evento whatsapp:ready recibido:', data)

      const lineaId = data?.id || data?.lineaId || data?.lineId || data?.whatsappLineId

      if (!lineaId) {
        console.warn('Evento whatsapp:ready sin lineaId:', data)
        return
      }

      setWorkerEstados((prev) => ({
        ...prev,
        [lineaId]: {
          ...(prev[lineaId] || {}),
          ...data,
          id: lineaId,
          lineaId,
          estado: 'CONECTADO',
          conectado: true,
          inicializado: true,
          tieneQr: false,
          qr: null,
        },
      }))

      setSuccess(`La línea ${lineaId} se conectó correctamente.`)

      setSelectedLine((prev) => {
        if (!prev) return prev

        const selectedLineaId = getWorkerLineId(prev)

        if (selectedLineaId !== lineaId) return prev

        return {
          ...prev,
          qrCode: null,
          tieneQr: false,
          qrStatus: 'La línea ya está conectada correctamente.',
          workerStatus: 'CONECTADO',
        }
      })
    })

    socket.on('whatsapp:qr', (data) => {
      console.log('Evento whatsapp:qr recibido:', data)

      const lineaId = data?.id || data?.lineaId || data?.lineId || data?.whatsappLineId

      if (!lineaId) return

      setWorkerEstados((prev) => ({
        ...prev,
        [lineaId]: {
          ...(prev[lineaId] || {}),
          ...data,
          id: lineaId,
          lineaId,
          estado: 'QR_GENERADO',
          conectado: false,
          inicializado: false,
          tieneQr: Boolean(data?.qr),
          qr: data?.qr || null,
        },
      }))
    })

    socket.on('whatsapp:disconnected', (data) => {
      console.log('Evento whatsapp:disconnected recibido:', data)

      const lineaId = data?.id || data?.lineaId || data?.lineId || data?.whatsappLineId

      if (!lineaId) return

      setWorkerEstados((prev) => ({
        ...prev,
        [lineaId]: {
          ...(prev[lineaId] || {}),
          ...data,
          id: lineaId,
          lineaId,
          estado: 'DESCONECTADO',
          conectado: false,
          inicializado: false,
        },
      }))

      setError(`La línea ${lineaId} se desconectó.`)
    })

    socket.on('connect_error', (error) => {
      console.error('Error conectando socket al worker WhatsApp:', error.message)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const normalizarLineaDb = (linea) => {
    return {
      id: linea.id,
      code: linea.code || linea.codigo || '',
      name: linea.name || linea.nombre || '',
      phoneNumber: linea.phoneNumber || linea.phone || linea.telefono || '',
      description: linea.description || linea.descripcion || '',
      isActive: linea.isActive ?? linea.activo ?? true,
      createdAt: linea.createdAt || linea.fechaCreacion || null,
      updatedAt: linea.updatedAt || linea.fechaActualizacion || null,
      raw: linea,
    }
  }

  const getWorkerLineId = (linea) => {
    return (
      linea?.code ||
      linea?.codigo ||
      linea?.workerLineId ||
      linea?.lineaId ||
      linea?.id
    )
  }

  const obtenerEstadoWorker = (linea) => {
    const lineaId = getWorkerLineId(linea)
    return workerEstados[lineaId] || null
  }

  const estaConectada = (linea) => {
    const worker = obtenerEstadoWorker(linea)

    return Boolean(
      worker?.conectado ||
      worker?.inicializado ||
      worker?.estado === 'CONECTADO' ||
      worker?.estado === 'CONNECTED',
    )
  }

  const obtenerEstadoConexion = (linea) => {
    const worker = obtenerEstadoWorker(linea)

    if (!worker) return 'Sin consultar'

    if (
      worker.estado === 'CONECTADO' ||
      worker.estado === 'CONNECTED' ||
      worker.conectado
    ) {
      return 'Conectada'
    }

    if (worker.estado === 'QR_GENERADO') return 'QR generado'
    if (worker.estado === 'INICIALIZANDO') return 'Inicializando'
    if (worker.estado === 'DESCONECTADO' || worker.estado === 'DISCONNECTED') {
      return 'Desconectada'
    }

    return worker.estado || 'Sin conexión'
  }

  const obtenerColorConexion = (linea) => {
    const worker = obtenerEstadoWorker(linea)

    if (!worker) return 'secondary'

    if (
      worker.estado === 'CONECTADO' ||
      worker.estado === 'CONNECTED' ||
      worker.conectado
    ) {
      return 'success'
    }

    if (worker.estado === 'QR_GENERADO') return 'warning'
    if (worker.estado === 'INICIALIZANDO') return 'info'

    return 'secondary'
  }

  const cargarLineas = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const data = await whatsappLineService.listar()
      const normalizadas = Array.isArray(data) ? data.map(normalizarLineaDb) : []

      setLineas(normalizadas)
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'No se pudieron cargar las líneas de WhatsApp.',
      )
    } finally {
      setLoading(false)
    }
  }

  const refrescarEstadoWorker = async (linea) => {
    const lineaId = getWorkerLineId(linea)

    if (!lineaId) return null

    try {
      const estado = await whatsappWorkerService.obtenerEstado(lineaId)

      setWorkerEstados((prev) => ({
        ...prev,
        [lineaId]: estado,
      }))

      return estado
    } catch (err) {
      console.error(err)

      setWorkerEstados((prev) => ({
        ...prev,
        [lineaId]: {
          estado: 'NO_INICIALIZADA',
          conectado: false,
          inicializado: false,
          tieneQr: false,
          qr: null,
        },
      }))

      return null
    }
  }

  const refrescarTodosEstados = async () => {
    try {
      setLoading(true)
      setError('')

      await Promise.all(lineas.map((linea) => refrescarEstadoWorker(linea)))
    } catch (err) {
      console.error(err)
      setError('No se pudieron refrescar los estados del worker.')
    } finally {
      setLoading(false)
    }
  }

  const abrirCrear = () => {
    setIsEditing(false)
    setSelectedLine(null)
    setForm(initialForm)
    setModalError('')
    setVisibleForm(true)
  }

  const abrirEditar = (linea) => {
    setIsEditing(true)
    setSelectedLine(linea)
    setForm({
      id: linea.id,
      code: linea.code || '',
      name: linea.name || '',
      phoneNumber: linea.phoneNumber || '',
      description: linea.description || '',
      isActive: linea.isActive ?? true,
    })
    setModalError('')
    setVisibleForm(true)
  }

  const cerrarForm = () => {
    setVisibleForm(false)
    setIsEditing(false)
    setSelectedLine(null)
    setForm(initialForm)
    setModalError('')
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validarFormulario = () => {
    if (!form.code || !form.code.trim()) {
      return 'El código de la línea es requerido.'
    }

    if (!form.name || !form.name.trim()) {
      return 'El nombre de la línea es requerido.'
    }

    if (!form.phoneNumber || !form.phoneNumber.trim()) {
      return 'El número de teléfono es requerido.'
    }

    return ''
  }

  const guardarLinea = async () => {
    try {
      const validation = validarFormulario()

      if (validation) {
        setModalError(validation)
        return
      }

      setSaving(true)
      setModalError('')
      setError('')
      setSuccess('')

      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        description: form.description?.trim() || null,
        isActive: Boolean(form.isActive),
      }

      if (isEditing && selectedLine?.id) {
        await whatsappLineService.actualizar(selectedLine.id, payload)
        setSuccess('Línea actualizada correctamente.')
      } else {
        await whatsappLineService.crear(payload)
        setSuccess('Línea creada correctamente. Ahora puedes conectarla con WhatsApp Web.')
      }

      cerrarForm()
      await cargarLineas()
    } catch (err) {
      console.error(err)
      setModalError(
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo guardar la línea.',
      )
    } finally {
      setSaving(false)
    }
  }

  const conectarLinea = async (linea) => {
    const lineaId = getWorkerLineId(linea)

    if (!lineaId) {
      setError('La línea no tiene identificador para el worker.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const data = await whatsappWorkerService.crear({
        lineaId,
        nombre: linea.name,
      })

      setWorkerEstados((prev) => ({
        ...prev,
        [lineaId]: data,
      }))

      setSuccess('Línea inicializada. Usa el botón Estado para validar conexión o QR si necesita vinculación.')
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo conectar la línea con WhatsApp Web.',
      )
    } finally {
      setLoading(false)
    }
  }

  const verQr = async (linea) => {
    const lineaId = getWorkerLineId(linea)

    if (!lineaId) {
      setError('La línea no tiene identificador para consultar QR.')
      return
    }

    try {
      setModalError('')
      setSelectedLine({
        ...linea,
        workerLineId: lineaId,
        qrCode: null,
        qrStatus: 'Cargando QR...',
        tieneQr: false,
      })
      setVisibleQr(true)

      const qrData = await whatsappWorkerService.obtenerQr(lineaId)

      setWorkerEstados((prev) => ({
        ...prev,
        [lineaId]: {
          ...(prev[lineaId] || {}),
          ...qrData,
        },
      }))

      setSelectedLine((prev) => ({
        ...prev,
        qrCode: qrData?.qr || null,
        tieneQr: Boolean(qrData?.tieneQr),
        qrStatus: qrData?.tieneQr
          ? 'QR generado. Escanéalo desde WhatsApp.'
          : qrData?.estado === 'CONECTADO'
            ? 'La línea ya está conectada.'
            : 'QR pendiente. Presiona conectar o espera unos segundos.',
        workerStatus: qrData?.estado,
      }))
    } catch (err) {
      console.error(err)
      setSelectedLine((prev) => ({
        ...prev,
        qrStatus: 'No se pudo obtener el QR.',
      }))
      setModalError(
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo obtener el QR.',
      )
    }
  }

  const desconectarLinea = async (linea) => {
    const lineaId = getWorkerLineId(linea)
    const confirmar = window.confirm(`¿Seguro que deseas desconectar la línea ${linea.name}?`)

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await whatsappWorkerService.desconectar(lineaId)

      setWorkerEstados((prev) => ({
        ...prev,
        [lineaId]: {
          estado: 'DESCONECTADO',
          conectado: false,
          inicializado: false,
          tieneQr: false,
          qr: null,
        },
      }))

      setSuccess('Línea desconectada de WhatsApp correctamente.')
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo desconectar la línea.',
      )
    } finally {
      setLoading(false)
    }
  }

  const eliminarLinea = async (linea) => {
    const confirmar = window.confirm(`¿Seguro que deseas eliminar la línea ${linea.name}?`)

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await whatsappLineService.eliminar(linea.id)

      setSuccess('Línea eliminada correctamente.')
      await cargarLineas()
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo eliminar la línea.',
      )
    } finally {
      setLoading(false)
    }
  }

  const cambiarEstado = async (linea) => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const nuevoEstado = !(linea.isActive ?? true)

      if (whatsappLineService.cambiarEstado) {
        await whatsappLineService.cambiarEstado(linea.id, nuevoEstado)
      } else {
        await whatsappLineService.actualizar(linea.id, {
          code: linea.code,
          name: linea.name,
          phoneNumber: linea.phoneNumber,
          description: linea.description,
          isActive: nuevoEstado,
        })
      }

      setSuccess(nuevoEstado ? 'Línea activada correctamente.' : 'Línea inactivada correctamente.')
      await cargarLineas()
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo cambiar el estado de la línea.',
      )
    } finally {
      setLoading(false)
    }
  }

  const abrirPruebaMensaje = (linea) => {
    setSelectedLine(linea)
    setTestMessage({
      to: '',
      message: '',
    })
    setModalError('')
    setVisibleTest(true)
  }

  const enviarMensajePrueba = async () => {
    const lineaId = getWorkerLineId(selectedLine)

    if (!testMessage.to.trim()) {
      setModalError('Ingresa el número destino.')
      return
    }

    if (!testMessage.message.trim()) {
      setModalError('Ingresa el mensaje.')
      return
    }

    const numeroDestino = normalizarNumeroWhatsapp(testMessage.to)

    try {
      setSaving(true)
      setModalError('')

      await whatsappWorkerService.enviarTexto({
        lineaId,
        to: numeroDestino,
        message: testMessage.message.trim(),
      })

      setVisibleTest(false)
      setSuccess(`Mensaje de prueba enviado correctamente a ${numeroDestino}.`)
    } catch (err) {
      console.error(err)
      setModalError(
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo enviar el mensaje.',
      )
    } finally {
      setSaving(false)
    }
  }

  const lineasOrdenadas = useMemo(() => {
    return [...lineas].sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [lineas])

  const normalizarNumeroWhatsapp = (numero) => {
    let limpio = String(numero || '').replace(/\D/g, '')

    if (!limpio) {
      return ''
    }

    if (limpio.startsWith('0')) {
      limpio = `593${limpio.substring(1)}`
    }

    if (limpio.length === 9 && limpio.startsWith('9')) {
      limpio = `593${limpio}`
    }

    if (!limpio.startsWith('593')) {
      limpio = `593${limpio}`
    }

    return `${limpio}@c.us`
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Líneas WhatsApp</strong>
            <div className="text-body-secondary small">
              Administra las líneas guardadas y su conexión real con WhatsApp Web.
            </div>
          </div>

          <div>
            <CButton
              color="secondary"
              variant="outline"
              className="me-2"
              onClick={refrescarTodosEstados}
              disabled={loading || !lineas.length}
            >
              Refrescar estados
            </CButton>

            <CButton color="primary" onClick={abrirCrear}>
              Nueva línea
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

          {loading && (
            <div className="text-center my-3">
              <CSpinner size="sm" className="me-2" />
              Cargando...
            </div>
          )}

          <CTable responsive hover align="middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Código</CTableHeaderCell>
                <CTableHeaderCell>Nombre</CTableHeaderCell>
                <CTableHeaderCell>Teléfono DB</CTableHeaderCell>
                <CTableHeaderCell>Estado DB</CTableHeaderCell>
                <CTableHeaderCell>Estado WhatsApp</CTableHeaderCell>
                <CTableHeaderCell>Acciones</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {lineasOrdenadas.length === 0 && !loading && (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center text-body-secondary">
                    No existen líneas registradas.
                  </CTableDataCell>
                </CTableRow>
              )}

              {lineasOrdenadas.map((linea) => (
                <CTableRow key={linea.id}>
                  <CTableDataCell>
                    <strong>{linea.code}</strong>
                    <div className="text-body-secondary small">
                      Worker ID: {getWorkerLineId(linea)}
                    </div>
                  </CTableDataCell>

                  <CTableDataCell>
                    {linea.name}
                    {linea.description && (
                      <div className="text-body-secondary small">{linea.description}</div>
                    )}
                  </CTableDataCell>

                  <CTableDataCell>{linea.phoneNumber || '-'}</CTableDataCell>

                  <CTableDataCell>
                    <CBadge color={linea.isActive ? 'success' : 'secondary'}>
                      {linea.isActive ? 'Activa' : 'Inactiva'}
                    </CBadge>
                  </CTableDataCell>

                  <CTableDataCell>
                    <CBadge color={obtenerColorConexion(linea)}>
                      {obtenerEstadoConexion(linea)}
                    </CBadge>

                    {obtenerEstadoWorker(linea)?.telefono && (
                      <div className="small text-body-secondary mt-1">
                        {obtenerEstadoWorker(linea)?.telefono}
                      </div>
                    )}
                  </CTableDataCell>

                  <CTableDataCell>
                    <CButton
                      color="info"
                      variant="outline"
                      size="sm"
                      className="me-2 mb-1"
                      onClick={() => refrescarEstadoWorker(linea)}
                    >
                      Estado
                    </CButton>

                    <CButton
                      color="success"
                      variant="outline"
                      size="sm"
                      className="me-2 mb-1"
                      onClick={() => conectarLinea(linea)}
                    >
                      Conectar
                    </CButton>

                    <CButton
                      color="warning"
                      variant="outline"
                      size="sm"
                      className="me-2 mb-1"
                      onClick={() => verQr(linea)}
                    >
                      QR
                    </CButton>

                    <CButton
                      color="primary"
                      variant="outline"
                      size="sm"
                      className="me-2 mb-1"
                      onClick={() => abrirPruebaMensaje(linea)}
                      disabled={!estaConectada(linea)}
                    >
                      Probar envío
                    </CButton>

                    <CButton
                      color="secondary"
                      variant="outline"
                      size="sm"
                      className="me-2 mb-1"
                      onClick={() => desconectarLinea(linea)}
                    >
                      Desconectar
                    </CButton>

                    <CButton
                      color="dark"
                      variant="outline"
                      size="sm"
                      className="me-2 mb-1"
                      onClick={() => abrirEditar(linea)}
                    >
                      Editar
                    </CButton>

                    <CButton
                      color={linea.isActive ? 'danger' : 'success'}
                      variant="outline"
                      size="sm"
                      className="me-2 mb-1"
                      onClick={() => cambiarEstado(linea)}
                    >
                      {linea.isActive ? 'Inactivar' : 'Activar'}
                    </CButton>

                    <CButton
                      color="danger"
                      variant="outline"
                      size="sm"
                      className="mb-1"
                      onClick={() => eliminarLinea(linea)}
                    >
                      Eliminar
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CModal visible={visibleForm} onClose={cerrarForm} backdrop="static">
        <CModalHeader>
          <CModalTitle>{isEditing ? 'Editar línea' : 'Nueva línea'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && <CAlert color="danger">{modalError}</CAlert>}

          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Código</CFormLabel>
                <CFormInput
                  value={form.code}
                  placeholder="line-main"
                  disabled={isEditing}
                  onChange={(e) => handleChange('code', e.target.value)}
                />
                <div className="form-text">
                  Este código se usará también como ID del worker.
                </div>
              </CCol>

              <CCol md={6}>
                <CFormLabel>Nombre</CFormLabel>
                <CFormInput
                  value={form.name}
                  placeholder="Línea principal"
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel>Teléfono</CFormLabel>
                <CFormInput
                  value={form.phoneNumber}
                  placeholder="593959715670"
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel>Descripción</CFormLabel>
                <CFormTextarea
                  rows={3}
                  value={form.description || ''}
                  placeholder="Línea para atención de pacientes"
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </CCol>
            </CRow>

            <CFormCheck
              id="isActive"
              label="Activa"
              checked={Boolean(form.isActive)}
              onChange={(e) => handleChange('isActive', e.target.checked)}
            />
          </CForm>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarForm} disabled={saving}>
            Cancelar
          </CButton>

          <CButton color="primary" onClick={guardarLinea} disabled={saving}>
            {saving && <CSpinner size="sm" className="me-2" />}
            Guardar
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={visibleQr} onClose={() => setVisibleQr(false)} size="lg">
        <CModalHeader>
          <CModalTitle>QR WhatsApp</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && <CAlert color="danger">{modalError}</CAlert>}

          {selectedLine && (
            <>
              <CAlert color={selectedLine.tieneQr ? 'success' : 'warning'}>
                {selectedLine.qrStatus || 'Consulta el QR para vincular la línea.'}
              </CAlert>

              <div className="mb-3">
                <strong>Línea:</strong> {selectedLine.name}
                <br />
                <strong>Worker ID:</strong> {selectedLine.workerLineId || getWorkerLineId(selectedLine)}
                <br />
                <strong>Estado:</strong> {selectedLine.workerStatus || '-'}
              </div>

              {selectedLine.qrCode ? (
                <div className="text-center">
                  <img
                    src={selectedLine.qrCode}
                    alt="QR WhatsApp"
                    style={{
                      width: 300,
                      height: 300,
                      maxWidth: '100%',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      padding: 8,
                    }}
                  />

                  <div className="text-body-secondary mt-3">
                    Escanea desde WhatsApp &gt; Dispositivos vinculados.
                  </div>
                </div>
              ) : (
                <div className="text-center text-body-secondary py-4">
                  No hay QR disponible todavía.
                </div>
              )}
            </>
          )}
        </CModalBody>

        <CModalFooter>
          {selectedLine && (
            <CButton
              color="primary"
              variant="outline"
              onClick={() => verQr(selectedLine)}
            >
              Refrescar QR
            </CButton>
          )}

          <CButton color="secondary" onClick={() => setVisibleQr(false)}>
            Cerrar
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={visibleTest} onClose={() => setVisibleTest(false)}>
        <CModalHeader>
          <CModalTitle>Enviar mensaje de prueba</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && <CAlert color="danger">{modalError}</CAlert>}

          <div className="mb-3">
            <CFormLabel>Destino</CFormLabel>
            <CFormInput
              value={testMessage.to}
              placeholder="0996631782"
              onChange={(e) =>
                setTestMessage((prev) => ({
                  ...prev,
                  to: e.target.value,
                }))
              }
            />
            <div className="form-text">
              Puedes escribir 0996631782, 996631782 o 593996631782. El sistema lo enviará como 593996631782@c.us.
            </div>
          </div>

          <div className="mb-3">
            <CFormLabel>Mensaje</CFormLabel>
            <CFormTextarea
              rows={4}
              value={testMessage.message}
              placeholder="Hola, este es un mensaje de prueba"
              onChange={(e) =>
                setTestMessage((prev) => ({
                  ...prev,
                  message: e.target.value,
                }))
              }
            />
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setVisibleTest(false)}>
            Cancelar
          </CButton>

          <CButton color="primary" onClick={enviarMensajePrueba} disabled={saving}>
            {saving && <CSpinner size="sm" className="me-2" />}
            Enviar
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default LineasWhatsapp
