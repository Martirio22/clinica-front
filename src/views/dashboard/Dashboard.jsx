import React, { useEffect, useMemo, useState } from 'react';
import {
  CRow, CCol, CCard, CCardBody, CCardHeader, CSpinner, CTable,
  CTableHead, CTableHeaderCell, CTableRow, CTableBody, CTableDataCell,
  CBadge, CButton, CWidgetStatsA
} from '@coreui/react';
import { CChartBar, CChartDoughnut, CChartLine } from '@coreui/react-chartjs';
import { cilPeople, cilMedicalCross, cilCalendar, cilHospital } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { dashboardService } from 'src/services/dashboardService';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    patients: [], doctors: [], appointments: [], botEvents: [], specialties: []
  });

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const res = await dashboardService.obtenerDashboard();
      setData(res);
      setLoading(false);
    };
    cargar();
  }, []);

  const citasHoy = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return data.appointments.filter((a) => {
      if (!a.startDate) return false;
      return new Date(a.startDate).toISOString().split('T')[0] === hoy;
    }).length;
  }, [data.appointments]);

  const citasPorEstado = useMemo(() => {
    const estados = {};
    data.appointments.forEach((a) => {
      const estado = a.status?.name || 'Sin estado';
      estados[estado] = (estados[estado] || 0) + 1;
    });
    return estados;
  }, [data.appointments]);

  const citasUltimos7Dias = useMemo(() => {
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const formato = fecha.toISOString().split('T')[0];
      const total = data.appointments.filter(a => a.startDate?.startsWith(formato)).length;
      dias.push({ fecha: formato, total });
    }
    return dias;
  }, [data.appointments]);

  const proximasCitas = useMemo(() => 
    [...data.appointments].sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 5), 
    [data.appointments]);

  const obtenerBadgeEstado = (estado) => {
    const map = { Confirmada: 'success', Cancelada: 'danger', Pendiente: 'warning', Finalizada: 'info' };
    return map[estado] || 'secondary';
  };

  if (loading) return <div className="d-flex justify-content-center py-5"><CSpinner color="primary" /></div>;

  return (
    <>
      <CRow className="mb-4 g-4">
        <CCol sm={6} lg={4}><CWidgetStatsA color="primary" value={data.patients.length} title="Pacientes" action={<CIcon icon={cilPeople} height={24} />} /></CCol>
        <CCol sm={6} lg={4}><CWidgetStatsA color="success" value={data.doctors.length} title="Médicos" action={<CIcon icon={cilMedicalCross} height={24} />} /></CCol>
        <CCol sm={6} lg={4}><CWidgetStatsA color="warning" value={citasHoy} title="Citas Hoy" action={<CIcon icon={cilCalendar} height={24} />} /></CCol>
      </CRow>

      <CRow className="mb-4 g-4">
        <CCol lg={8}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader><strong>Tendencia de Citas (7 días)</strong></CCardHeader>
            <CCardBody><CChartLine data={{ labels: citasUltimos7Dias.map(d => d.fecha), datasets: [{ label: 'Citas', data: citasUltimos7Dias.map(d => d.total), fill: true, tension: 0.4 }] }} /></CCardBody>
          </CCard>
        </CCol>
        <CCol lg={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader><strong>Citas por Estado</strong></CCardHeader>
            <CCardBody className="d-flex align-items-center justify-content-center">
              <div style={{ width: '200px' }}><CChartDoughnut data={{ labels: Object.keys(citasPorEstado), datasets: [{ data: Object.values(citasPorEstado) }] }} /></div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="border-0 shadow-sm mb-4">
            <CCardHeader><strong>Próximas Citas</strong></CCardHeader>
            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead><CTableRow><CTableHeaderCell>Paciente</CTableHeaderCell><CTableHeaderCell>Doctor</CTableHeaderCell><CTableHeaderCell>Fecha</CTableHeaderCell><CTableHeaderCell>Estado</CTableHeaderCell></CTableRow></CTableHead>
                <CTableBody>
                  {proximasCitas.map((cita, i) => (
                    <CTableRow key={i}>
                      <CTableDataCell>{cita.patient?.firstName} {cita.patient?.lastName}</CTableDataCell>
                      <CTableDataCell>{cita.doctor?.user?.firstName || '---'}</CTableDataCell>
                      <CTableDataCell>{new Date(cita.startDate).toLocaleString()}</CTableDataCell>
                      <CTableDataCell><CBadge color={obtenerBadgeEstado(cita.status?.name)}>{cita.status?.name || 'N/A'}</CBadge></CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default Dashboard;