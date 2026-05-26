import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
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

const PerfilPaciente = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [proximasCitas] = useState([])
  const [citasPasadas] = useState([])
  const [atencionesMedicas] = useState([])
  const [recetas] = useState([])
  const [conversaciones] = useState([])

  const cargarPaciente = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await patientService.obtener(id)
      setPaciente(data)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar el perfil del paciente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPaciente()
  }, [id])

  const editarPaciente = () => {
    alert(`Aquí puedes abrir edición o navegar a editar paciente: ${id}`)
  }

  const crearCita = () => {
    alert(`Aquí puedes crear una cita para el paciente: ${id}`)
  }

  const verReceta = (receta) => {
    alert(`Aquí puedes ver la receta: ${receta.id}`)
  }

  const verAtencion = (atencion) => {
    alert(`Aquí puedes ver la atención médica: ${atencion.id}`)
  }

  const verChat = (chat) => {
    alert(`Aquí puedes ver el chat: ${chat.id}`)
  }

  const volver = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="text-center my-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error) {
    return (
      <CAlert color="danger" dismissible onClose={() => setError('')}>
        {error}
      </CAlert>
    )
  }

  if (!paciente) {
    return (
      <CAlert color="warning">
        No se encontró información del paciente.
      </CAlert>
    )
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Perfil del Paciente</strong>

          <div>
            <CButton color="secondary" variant="outline" className="me-2" onClick={volver}>
              Volver
            </CButton>

            <CButton color="warning" variant="outline" className="me-2" onClick={editarPaciente}>
              Editar paciente
            </CButton>

            <CButton color="primary" onClick={crearCita}>
              Crear cita
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          <CRow className="g-3">
            <CCol md={6}>
              <CCard>
                <CCardHeader>
                  <strong>Datos personales</strong>
                </CCardHeader>

                <CCardBody>
                  <p>
                    <strong>Paciente:</strong> {paciente.firstName} {paciente.lastName}
                  </p>

                  <p>
                    <strong>Identificación:</strong>{' '}
                    {paciente.identificationType || '-'} {paciente.identification || '-'}
                  </p>

                  <p>
                    <strong>Fecha de nacimiento:</strong> {paciente.birthDate || '-'}
                  </p>

                  <p>
                    <strong>Género:</strong> {paciente.gender || '-'}
                  </p>

                  <p>
                    <strong>Email:</strong> {paciente.email || '-'}
                  </p>

                  <p>
                    <strong>Dirección:</strong> {paciente.address || '-'}
                  </p>

                  <p>
                    <strong>Estado:</strong>{' '}
                    {paciente.isActive ? (
                      <CBadge color="success">Activo</CBadge>
                    ) : (
                      <CBadge color="secondary">Inactivo</CBadge>
                    )}
                  </p>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={6}>
              <CCard>
                <CCardHeader>
                  <strong>WhatsApp registrado</strong>
                </CCardHeader>

                <CCardBody>
                  <p>
                    <strong>Número:</strong> {paciente.whatsappPhone || '-'}
                  </p>

                  <p className="text-body-secondary">
                    Este número será usado para comunicación por WhatsApp, recordatorios,
                    citas y seguimiento del paciente.
                  </p>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Próximas citas</strong>
        </CCardHeader>

        <CCardBody>
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell>Médico</CTableHeaderCell>
                <CTableHeaderCell>Especialidad</CTableHeaderCell>
                <CTableHeaderCell>Estado</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {proximasCitas.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    No existen próximas citas registradas.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                proximasCitas.map((cita, index) => (
                  <CTableRow key={cita.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{cita.date}</CTableDataCell>
                    <CTableDataCell>{cita.doctor}</CTableDataCell>
                    <CTableDataCell>{cita.specialty}</CTableDataCell>
                    <CTableDataCell>{cita.status}</CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Citas pasadas</strong>
        </CCardHeader>

        <CCardBody>
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell>Médico</CTableHeaderCell>
                <CTableHeaderCell>Especialidad</CTableHeaderCell>
                <CTableHeaderCell>Estado</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {citasPasadas.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    No existen citas pasadas registradas.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                citasPasadas.map((cita, index) => (
                  <CTableRow key={cita.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{cita.date}</CTableDataCell>
                    <CTableDataCell>{cita.doctor}</CTableDataCell>
                    <CTableDataCell>{cita.specialty}</CTableDataCell>
                    <CTableDataCell>{cita.status}</CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Atenciones médicas</strong>
        </CCardHeader>

        <CCardBody>
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell>Médico</CTableHeaderCell>
                <CTableHeaderCell>Motivo</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Acción</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {atencionesMedicas.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    No existen atenciones médicas registradas.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                atencionesMedicas.map((atencion, index) => (
                  <CTableRow key={atencion.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{atencion.date}</CTableDataCell>
                    <CTableDataCell>{atencion.doctor}</CTableDataCell>
                    <CTableDataCell>{atencion.reason}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButton
                        color="info"
                        variant="outline"
                        size="sm"
                        onClick={() => verAtencion(atencion)}
                      >
                        Ver atención
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Recetas</strong>
        </CCardHeader>

        <CCardBody>
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell>Médico</CTableHeaderCell>
                <CTableHeaderCell>Indicaciones</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Acción</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {recetas.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    No existen recetas registradas.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                recetas.map((receta, index) => (
                  <CTableRow key={receta.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{receta.date}</CTableDataCell>
                    <CTableDataCell>{receta.doctor}</CTableDataCell>
                    <CTableDataCell>{receta.instructions}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButton
                        color="info"
                        variant="outline"
                        size="sm"
                        onClick={() => verReceta(receta)}
                      >
                        Ver receta
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Historial de conversaciones</strong>
        </CCardHeader>

        <CCardBody>
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell>Canal</CTableHeaderCell>
                <CTableHeaderCell>Último mensaje</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Acción</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {conversaciones.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    No existen conversaciones registradas.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                conversaciones.map((chat, index) => (
                  <CTableRow key={chat.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{chat.date}</CTableDataCell>
                    <CTableDataCell>{chat.channel}</CTableDataCell>
                    <CTableDataCell>{chat.lastMessage}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButton
                        color="success"
                        variant="outline"
                        size="sm"
                        onClick={() => verChat(chat)}
                      >
                        Ver chat
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default PerfilPaciente
