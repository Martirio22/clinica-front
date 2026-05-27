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

import { botMenuService } from '../../../services/botMenuService'

const initialForm = {
  code: '',
  name: '',
  message: '',
  isMainMenu: false,
}

const MenusBot = () => {
  const navigate = useNavigate()

  const [menus, setMenus] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingMenu, setEditingMenu] = useState(null)
  const [selectedMenu, setSelectedMenu] = useState(null)

  const [search, setSearch] = useState('')
  const [visibleForm, setVisibleForm] = useState(false)
  const [visiblePreview, setVisiblePreview] = useState(false)

  // Estado para el modal de confirmación
  const [confirmData, setConfirmData] = useState({ visible: false, message: '', onConfirm: null })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [success, setSuccess] = useState('')

  const cargarMenus = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await botMenuService.listar()
      setMenus(data || [])
    } catch (err) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'No se pudieron cargar los menús del bot.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarMenus()
  }, [])

  const menusFiltrados = useMemo(() => {
    const texto = String(search || '').toLowerCase().trim()

    if (!texto) return menus

    return menus.filter((menu) => {
      const code = String(menu.code || '').toLowerCase()
      const name = String(menu.name || '').toLowerCase()
      const message = String(menu.message || '').toLowerCase()

      return code.includes(texto) || name.includes(texto) || message.includes(texto)
    })
  }, [menus, search])

  const abrirCrear = () => {
    setEditingMenu(null)
    setForm(initialForm)
    setModalError('')
    setVisibleForm(true)
  }

  const abrirEditar = (menu) => {
    setEditingMenu(menu)

    setForm({
      code: menu.code || '',
      name: menu.name || '',
      message: menu.message || '',
      isMainMenu: menu.isMainMenu === true,
    })

    setModalError('')
    setVisibleForm(true)
  }

  const cerrarForm = () => {
    setVisibleForm(false)
    setEditingMenu(null)
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

  const handleCheck = (e) => {
    const { name, checked } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const validarFormulario = () => {
    if (!String(form.code || '').trim()) return 'El código del menú es requerido.'
    if (!String(form.name || '').trim()) return 'El nombre del menú es requerido.'
    if (!String(form.message || '').trim()) return 'El mensaje del menú es requerido.'

    return ''
  }

  const guardarMenu = async () => {
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
        code: String(form.code || '').trim().toUpperCase(),
        name: String(form.name || '').trim(),
        message: String(form.message || '').trim(),
        isMainMenu: form.isMainMenu === true,
      }

      if (editingMenu) {
        await botMenuService.actualizar(editingMenu.id, payload)
        setSuccess('Menú actualizado correctamente.')
      } else {
        await botMenuService.crear(payload)
        setSuccess('Menú creado correctamente.')
      }

      cerrarForm()
      await cargarMenus()
    } catch (err) {
      console.error(err)
      setModalError(err?.data?.message || err?.message || 'No se pudo guardar el menú.')
    } finally {
      setSaving(false)
    }
  }

  const cambiarEstado = (menu) => {
    const nuevoEstado = menu.isActive === false
    setConfirmData({
      visible: true,
      message: `¿Seguro que deseas ${nuevoEstado ? 'activar' : 'inactivar'} este menú?`,
      onConfirm: async () => {
        try {
          setLoading(true)
          setError('')
          setSuccess('')
          await botMenuService.actualizar(menu.id, {
            code: menu.code,
            name: menu.name,
            message: menu.message,
            isMainMenu: menu.isMainMenu,
            isActive: nuevoEstado,
          })
          setSuccess(`Menú ${nuevoEstado ? 'activado' : 'inactivado'} correctamente.`)
          await cargarMenus()
        } catch (err) {
          setError(err?.data?.message || err?.message || 'No se pudo cambiar el estado del menú.')
        } finally {
          setLoading(false)
          setConfirmData({ ...confirmData, visible: false })
        }
      }
    })
  }

  const definirPrincipal = (menu) => {
    setConfirmData({
      visible: true,
      message: `¿Deseas definir "${menu.name}" como menú principal?`,
      onConfirm: async () => {
        try {
          setLoading(true)
          setError('')
          setSuccess('')
          await botMenuService.actualizar(menu.id, {
            code: menu.code,
            name: menu.name,
            message: menu.message,
            isMainMenu: true,
            isActive: menu.isActive !== false,
          })
          setSuccess('Menú definido como principal correctamente.')
          await cargarMenus()
        } catch (err) {
          setError(err?.data?.message || err?.message || 'No se pudo definir el menú principal.')
        } finally {
          setLoading(false)
          setConfirmData({ ...confirmData, visible: false })
        }
      }
    })
  }

  const configurarOpciones = (menu) => {
    navigate(`/whatsapp-bot/menus-bot/${menu.id}/opciones`)
  }

  const verMensaje = (menu) => {
    setSelectedMenu(menu)
    setVisiblePreview(true)
  }

  const cerrarPreview = () => {
    setVisiblePreview(false)
    setSelectedMenu(null)
  }

  const eliminarMenu = (menu) => {
    setConfirmData({
      visible: true,
      message: `¿Seguro que deseas eliminar o inactivar el menú ${menu.name}?`,
      onConfirm: async () => {
        try {
          setLoading(true)
          setError('')
          setSuccess('')
          await botMenuService.eliminar(menu.id)
          setSuccess('Menú inactivado correctamente.')
          await cargarMenus()
        } catch (err) {
          setError(err?.data?.message || err?.message || 'No se pudo eliminar el menú.')
        } finally {
          setLoading(false)
          setConfirmData({ ...confirmData, visible: false })
        }
      }
    })
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Menús del Bot</strong>
          <CButton color="primary" onClick={abrirCrear}>Nuevo menú</CButton>
        </CCardHeader>
        <CCardBody>
          {error && <CAlert color="danger" dismissible onClose={() => setError('')}>{error}</CAlert>}
          {success && <CAlert color="success" dismissible onClose={() => setSuccess('')}>{success}</CAlert>}

          <CRow className="mb-3">
            <CCol md={5}>
              <CFormLabel>Buscar menú</CFormLabel>
              <CFormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código, nombre o mensaje" />
            </CCol>
            <CCol md={3} className="d-flex align-items-end">
              <CButton color="primary" variant="outline" className="w-100" onClick={cargarMenus}>Actualizar</CButton>
            </CCol>
          </CRow>

          {loading ? (
            <div className="text-center my-4"><CSpinner color="primary" /></div>
          ) : (
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Código</CTableHeaderCell>
                  <CTableHeaderCell>Nombre</CTableHeaderCell>
                  <CTableHeaderCell>Mensaje</CTableHeaderCell>
                  <CTableHeaderCell>Principal</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {menusFiltrados.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center">No existen menús registrados.</CTableDataCell>
                  </CTableRow>
                ) : (
                  menusFiltrados.map((menu, index) => (
                    <CTableRow key={menu.id}>
                      <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{menu.code || '-'}</CTableDataCell>
                      <CTableDataCell>{menu.name || '-'}</CTableDataCell>
                      <CTableDataCell>
                        <div style={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>
                          {String(menu.message || '').length > 120 ? `${String(menu.message || '').slice(0, 120)}...` : menu.message || '-'}
                        </div>
                        <CButton color="info" variant="ghost" size="sm" className="px-0" onClick={() => verMensaje(menu)}>Ver mensaje completo</CButton>
                      </CTableDataCell>
                      <CTableDataCell>
                        {menu.isMainMenu ? <CBadge color="success">Principal</CBadge> : <CBadge color="secondary">No</CBadge>}
                      </CTableDataCell>
                      <CTableDataCell>
                        {menu.isActive === false ? <CBadge color="danger">Inactivo</CBadge> : <CBadge color="success">Activo</CBadge>}
                      </CTableDataCell>
                      <CTableDataCell className="text-end">
                        <CButton color="warning" variant="outline" size="sm" className="me-2 mb-1" onClick={() => abrirEditar(menu)}>Editar</CButton>
                        <CButton color="primary" variant="outline" size="sm" className="me-2 mb-1" onClick={() => configurarOpciones(menu)}>Configurar opciones</CButton>
                        <CButton color="success" variant="outline" size="sm" className="me-2 mb-1" disabled={menu.isMainMenu === true} onClick={() => definirPrincipal(menu)}>Definir principal</CButton>
                        <CButton color={menu.isActive === false ? 'success' : 'danger'} variant="outline" size="sm" className="me-2 mb-1" onClick={() => cambiarEstado(menu)}>{menu.isActive === false ? 'Activar' : 'Inactivar'}</CButton>
                        {/* <CButton color="danger" variant="outline" size="sm" className="mb-1" onClick={() => eliminarMenu(menu)}>Eliminar</CButton> */}
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Modal Confirmación General */}
      <CModal visible={confirmData.visible} onClose={() => setConfirmData({ ...confirmData, visible: false })}>
        <CModalHeader><CModalTitle>Confirmar acción</CModalTitle></CModalHeader>
        <CModalBody>{confirmData.message}</CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setConfirmData({ ...confirmData, visible: false })}>Cancelar</CButton>
          <CButton color="primary" onClick={confirmData.onConfirm}>Confirmar</CButton>
        </CModalFooter>
      </CModal>

      {/* Modales Originales */}
      <CModal visible={visibleForm} onClose={cerrarForm} backdrop="static" size="lg">
        <CModalHeader><CModalTitle>{editingMenu ? 'Editar menú' : 'Nuevo menú'}</CModalTitle></CModalHeader>
        <CModalBody>
          {modalError && <CAlert color="danger" dismissible onClose={() => setModalError('')}>{modalError}</CAlert>}
          <CRow className="g-3">
            <CCol md={6}>
              <CFormLabel>Código</CFormLabel>
              <CFormInput name="code" value={form.code} onChange={handleChange} placeholder="MENU_HORARIOS" disabled={editingMenu !== null} />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Nombre</CFormLabel>
              <CFormInput name="name" value={form.name} onChange={handleChange} placeholder="Menú de Consulta de Horarios" />
            </CCol>
            <CCol md={12}>
              <CFormLabel>Mensaje del menú</CFormLabel>
              <CFormTextarea rows={7} name="message" value={form.message} onChange={handleChange} placeholder="Bienvenido..." />
            </CCol>
            <CCol md={12}>
              <CFormCheck id="isMainMenu" name="isMainMenu" checked={form.isMainMenu} onChange={handleCheck} label="Es menú principal" />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarForm}>Cancelar</CButton>
          <CButton color="primary" onClick={guardarMenu} disabled={saving}>{saving ? <><CSpinner size="sm" className="me-2" /> Guardando...</> : 'Guardar'}</CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={visiblePreview} onClose={cerrarPreview} size="lg">
        <CModalHeader><CModalTitle>Mensaje del menú</CModalTitle></CModalHeader>
        <CModalBody>
          {selectedMenu && (
            <>
              <CAlert color="info"><strong>{selectedMenu.name}</strong><br />Código: {selectedMenu.code}</CAlert>
              <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, background: '#fafafa', whiteSpace: 'pre-wrap' }}>{selectedMenu.message || '-'}</div>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarPreview}>Cerrar</CButton>
          {selectedMenu && <CButton color="primary" onClick={() => configurarOpciones(selectedMenu)}>Configurar opciones</CButton>}
        </CModalFooter>
      </CModal>
    </>
  )
}

export default MenusBot