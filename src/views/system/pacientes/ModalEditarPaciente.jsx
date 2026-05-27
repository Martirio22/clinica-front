import React, { useState, useEffect } from 'react';
import { 
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, 
  CForm, CFormInput, CFormLabel, CFormSelect, CButton, CRow, CCol, CAlert, CSpinner 
} from '@coreui/react';
import { patientService } from '../../../services/patientService';

const ModalEditarPaciente = ({ visible, setVisible, patient, onSave }) => {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Sincronizar el formulario cuando el modal se abre con un paciente
  useEffect(() => {
    if (patient) {
      setForm({
        ...patient,
        isActive: patient.isActive ?? true
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Esta maneja específicamente el selector de estado (booleano)
  const handleChangeEstado = (e) => {
    const value = e.target.value === 'true';
    setForm((prev) => ({ ...prev, isActive: value }));
  };

  const guardarPaciente = async () => {
    try {
      setSaving(true);
      await patientService.actualizar(patient.id, form);
      onSave(); // Notifica al componente padre para recargar
    } catch (err) {
      setModalError('Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CModal visible={visible} onClose={() => setVisible(false)} size="lg" backdrop="static">
      <CModalHeader>
        <CModalTitle>Editar paciente</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {modalError && <CAlert color="danger">{modalError}</CAlert>}
        <CForm>
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
                        <CFormSelect 
  name="isActive"
  value={String(form.isActive)} 
  onChange={handleChangeEstado}
>
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
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setVisible(false)}>Cancelar</CButton>
        <CButton color="primary" onClick={guardarPaciente} disabled={saving}>
          {saving ? <CSpinner size="sm" /> : 'Guardar'}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default ModalEditarPaciente;