import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

import { botMenuOptionService } from '../../../services/botMenuOptionService'
import { botMenuService } from '../../../services/botMenuService'

const accionesBot = [
  { value: 'INFO_CLINICA', label: 'Información de la clínica' },
  { value: 'AGENDAR_CITA', label: 'Agendar cita' },
  { value: 'CONSULTAR_CITAS', label: 'Consultar citas' },
  { value: 'CONSULTAR_RECETA', label: 'Consultar receta' },
  { value: 'DERIVAR_ESPECIALISTA', label: 'Derivar especialista' },
  { value: 'TRANSFERIR_HUMANO', label: 'Transferir a humano' },
  { value: 'MOSTRAR_MENU', label: 'Mostrar otro menú' },
]

const initialForm = {
  code: '',
  optionText: '',
  action: '',
  targetMenuId: '',
  order: 1,
  isActive: true,
}

const OpcionesMenuBot = () => {
  const { menuId } = useParams()
  const navigate = useNavigate()

  const [menuActual, setMenuActual] = useState(null)
  const [menus, setMenus] = useState([])
  const [opciones, setOpciones] = useState([])

  const [form, setForm] = useState(initialForm)
  const [editingOption, setEditingOption] = useState(null)

  const [search, setSearch] = useState('')
  const [visibleForm, setVisibleForm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarMenuActual = async () => {
    try {
      const data = await botMenuService.obtener(menuId)
      setMenuActual(data || null)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar el menú seleccionado.')
    }
  }

  const cargarMenus = async () => {
    try {
      const data = await botMenuService.listar()
      setMenus(data || [])
    } catch (err) {
      console.error(err)
      setMenus([])
    }
  }

  const cargarOpciones = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await botMenuOptionService.listarPorMenu(menuId)

      const ordenadas = (data || []).sort((a, b) => Number(a.order || 0) - Number(b.order || 0))

      setOpciones(ordenadas)
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudieron cargar las opciones del menú.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarMenuActual()
    cargarMenus()
    cargarOpciones()
  }, [menuId])

  const opcionesFiltradas = useMemo(() => {
    const texto = String(search || '').toLowerCase().trim()

    if (!texto) return opciones

    return opciones.filter((option) => {
      const code = String(option.code || '').toLowerCase()
      const optionText = String(option.optionText || '').toLowerCase()
      const action = String(option.action || '').toLowerCase()

      return code.includes(texto) || optionText.includes(texto) || action.includes(texto)
    })
  }, [opciones, search])

  const obtenerNombreMenu = (id) => {
    const menu = menus.find((item) => item.id === id)
    return menu ? `${menu.code} - ${menu.name}` : '-'
  }

  const obtenerLabelAccion = (action) => {
    const found = accionesBot.find((item) => item.value === action)
    return found?.label || action || '-'
  }

  const abrirCrear = () => {
    const ultimoOrden = opciones.length > 0 ? Math.max(...opciones.map((item) => Number(item.order || 0))) : 0

    setEditingOption(null)
    setForm({
      ...initialForm,
      order: ultimoOrden + 1,
    })
    setModalError('')
    setVisibleForm(true)
  }

  const abrirEditar = (option) => {
    setEditingOption(option)

    setForm({
      code: option.code || '',
      optionText: option.optionText || '',
      action: option.action || '',
      targetMenuId: option.targetMenuId || '',
      order: option.order || 1,
      isActive: option.isActive !== false,
    })

    setModalError('')
    setVisibleForm(true)
  }

  const cerrarForm = () => {
    setVisibleForm(false)
    setEditingOption(null)
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

  const validarFormulario = () => {
    if (!String(form.code || '').trim()) return 'El código de la opción es requerido.'
    if (!String(form.optionText || '').trim()) return 'El texto de la opción es requerido.'
    if (!String(form.action || '').trim()) return 'La acción es requerida.'

    if (form.action === 'MOSTRAR_MENU' && !String(form.targetMenuId || '').trim()) {
      return 'Debe seleccionar un menú destino para la acción MOSTRAR_MENU.'
    }

    return ''
  }

  const armarPayload = (override = {}) => {
    return {
      menuBotId: menuId,
      code: String(form.code || '').trim(),
      optionText: String(form.optionText || '').trim(),
      action: String(form.action || '').trim(),
      targetMenuId: String(form.targetMenuId || '').trim() || null,
      order: Number(form.order || 1),
      isActive: form.isActive !== false,
      ...override,
    }
  }

  const guardarOpcion = async () => {
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

      const payload = armarPayload()

      if (editingOption) {
        await botMenuOptionService.actualizar(editingOption.id, payload)
        setSuccess('Opción actualizada correctamente.')
      } else {
        await botMenuOptionService.crear(payload)
        setSuccess('Opción creada correctamente.')
      }

      cerrarForm()
      await cargarOpciones()
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo guardar la opción.')
    } finally {
      setSaving(false)
    }
  }

  const cambiarEstado = async (option) => {
    const nuevoEstado = option.isActive === false

    const confirmar = window.confirm(
      `¿Seguro que deseas ${nuevoEstado ? 'activar' : 'inactivar'} esta opción?`,
    )

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await botMenuOptionService.actualizar(option.id, {
        menuBotId: option.menuBotId || menuId,
        code: option.code,
        optionText: option.optionText,
        action: option.action,
        targetMenuId: option.targetMenuId || null,
        order: option.order,
        isActive: nuevoEstado,
      })

      setSuccess(`Opción ${nuevoEstado ? 'activada' : 'inactivada'} correctamente.`)
      await cargarOpciones()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo cambiar el estado de la opción.')
    } finally {
      setLoading(false)
    }
  }

  const eliminarOpcion = async (option) => {
    const confirmar = window.confirm(`¿Seguro que deseas eliminar la opción ${option.code}?`)

    if (!confirmar) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await botMenuOptionService.eliminar(option.id)

      setSuccess('Opción eliminada correctamente.')
      await cargarOpciones()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo eliminar la opción.')
    } finally {
      setLoading(false)
    }
  }

  const moverOrden = async (option, direction) => {
    const ordenActual = Number(option.order || 0)
    const nuevoOrden = direction === 'UP' ? ordenActual - 1 : ordenActual + 1

    if (nuevoOrden < 1) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await botMenuOptionService.actualizar(option.id, {
        menuBotId: option.menuBotId || menuId,
        code: option.code,
        optionText: option.optionText,
        action: option.action,
        targetMenuId: option.targetMenuId || null,
        order: nuevoOrden,
        isActive: option.isActive !== false,
      })

      setSuccess('Orden actualizado correctamente.')
      await cargarOpciones()
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudo cambiar el orden de la opción.')
    } finally {
      setLoading(false)
    }
  }

  const volverMenus = () => {
    navigate('/whatsapp-bot/menus-bot')
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Opciones del Menú</strong>
            {menuActual && (
              <div className="small text-body-secondary">
                {menuActual.code} - {menuActual.name}
              </div>
            )}
          </div>

          <div>
            <CButton color="secondary" variant="outline" className="me-2" onClick={volverMenus}>
              Volver
            </CButton>

            <CButton color="primary" onClick={abrirCrear}>
              Nueva opción
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

          {menuActual && (
            <CAlert color="info">
              <strong>Mensaje del menú:</strong>
              <div style={{ whiteSpace: 'pre-wrap' }}>{menuActual.message}</div>
            </CAlert>
          )}

          <CRow className="mb-3">
            <CCol md={5}>
              <CFormLabel>Buscar opción</CFormLabel>
              <CFormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código, texto o acción"
              />
            </CCol>

            <CCol md={3} className="d-flex align-items-end">
              <CButton color="primary" variant="outline" className="w-100" onClick={cargarOpciones}>
                Actualizar
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
                  <CTableHeaderCell>Orden</CTableHeaderCell>
                  <CTableHeaderCell>Código</CTableHeaderCell>
                  <CTableHeaderCell>Texto opción</CTableHeaderCell>
                  <CTableHeaderCell>Acción</CTableHeaderCell>
                  <CTableHeaderCell>Menú destino</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {opcionesFiltradas.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center">
                      No existen opciones registradas para este menú.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  opcionesFiltradas.map((option) => (
                    <CTableRow key={option.id}>
                      <CTableDataCell>
                        <CBadge color="info">{option.order}</CBadge>
                      </CTableDataCell>

                      <CTableDataCell>{option.code || '-'}</CTableDataCell>

                      <CTableDataCell>{option.optionText || '-'}</CTableDataCell>

                      <CTableDataCell>
                        <CBadge color="primary">{obtenerLabelAccion(option.action)}</CBadge>
                      </CTableDataCell>

                      <CTableDataCell>{option.targetMenuId ? obtenerNombreMenu(option.targetMenuId) : '-'}</CTableDataCell>

                      <CTableDataCell>
                        {option.isActive === false ? (
                          <CBadge color="danger">Inactiva</CBadge>
                        ) : (
                          <CBadge color="success">Activa</CBadge>
                        )}
                      </CTableDataCell>

                      <CTableDataCell className="text-end">
                        <CButton
                          color="secondary"
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => moverOrden(option, 'UP')}
                        >
                          Subir
                        </CButton>

                        <CButton
                          color="secondary"
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => moverOrden(option, 'DOWN')}
                        >
                          Bajar
                        </CButton>

                        <CButton
                          color="warning"
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => abrirEditar(option)}
                        >
                          Editar
                        </CButton>

                        <CButton
                          color={option.isActive === false ? 'success' : 'danger'}
                          variant="outline"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => cambiarEstado(option)}
                        >
                          {option.isActive === false ? 'Activar' : 'Inactivar'}
                        </CButton>

                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          className="mb-1"
                          onClick={() => eliminarOpcion(option)}
                        >
                          Eliminar
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

      <CModal visible={visibleForm} onClose={cerrarForm} backdrop="static" size="lg">
        <CModalHeader>
          <CModalTitle>{editingOption ? 'Editar opción' : 'Nueva opción'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalError && (
            <CAlert color="danger" dismissible onClose={() => setModalError('')}>
              {modalError}
            </CAlert>
          )}

          <CRow className="g-3">
            <CCol md={4}>
              <CFormLabel>Código</CFormLabel>
              <CFormInput
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="Ej: 1"
              />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Orden</CFormLabel>
              <CFormInput
                type="number"
                name="order"
                value={form.order}
                onChange={handleChange}
                min={1}
              />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Estado</CFormLabel>
              <CFormSelect
                name="isActive"
                value={String(form.isActive)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: e.target.value === 'true',
                  }))
                }
              >
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </CFormSelect>
            </CCol>

            <CCol md={12}>
              <CFormLabel>Texto de opción</CFormLabel>
              <CFormInput
                name="optionText"
                value={form.optionText}
                onChange={handleChange}
                placeholder="Ej: Agendar cita médica"
              />
            </CCol>

            <CCol md={6}>
              <CFormLabel>Acción</CFormLabel>
              <CFormSelect name="action" value={form.action} onChange={handleChange}>
                <option value="">Seleccione una acción</option>
                {accionesBot.map((accion) => (
                  <option key={accion.value} value={accion.value}>
                    {accion.label}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormLabel>Menú destino</CFormLabel>
              <CFormSelect
                name="targetMenuId"
                value={form.targetMenuId || ''}
                onChange={handleChange}
              >
                <option value="">Sin menú destino</option>
                {menus
                  .filter((menu) => menu.id !== menuId && menu.isActive !== false)
                  .map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.code} - {menu.name}
                    </option>
                  ))}
              </CFormSelect>
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarForm}>
            Cancelar
          </CButton>

          <CButton color="primary" onClick={guardarOpcion} disabled={saving}>
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
    </>
  )
}

export default OpcionesMenuBot
