import React, { useEffect, useMemo, useState } from 'react'
import {
  CRow, CCol, CCard, CCardBody, CCardHeader,
  CSpinner, CTable, CTableHead, CTableHeaderCell,
  CTableRow, CTableBody, CTableDataCell, CBadge
} from '@coreui/react'
import { CChartLine, CChartDoughnut } from '@coreui/react-chartjs'
import { appointmentService } from 'src/services/appointmentService'
import { patientService } from 'src/services/patientService'
import { doctorService } from 'src/services/doctorService'
import { specialtyService } from 'src/services/specialtyService'
import { whatsappLineService } from 'src/services/whatsappLineService'

// ─── helpers ────────────────────────────────────────────────────────────────

const badgeColor = (estado) => {
  const map = {
    Confirmada: 'success',
    Cancelada: 'danger',
    Pendiente: 'warning',
    Finalizada: 'info',
  }
  return map[estado] || 'secondary'
}

const initials = (first = '', last = '') =>
  `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()

const AVATAR_COLORS = [
  { bg: '#E6F1FB', color: '#185FA5' },
  { bg: '#E1F5EE', color: '#0F6E56' },
  { bg: '#EEEDFE', color: '#534AB7' },
  { bg: '#FAEEDA', color: '#854F0B' },
  { bg: '#FAECE7', color: '#993C1D' },
  { bg: '#FCEBEB', color: '#A32D2D' },
]
const avatarStyle = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length]

const last7Days = () => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Hoy']

const SPECIALTY_BAR_COLORS = ['#378ADD', '#1D9E75', '#7F77DD', '#EF9F27', '#D85A30']

// ─── sub-components ─────────────────────────────────────────────────────────

const KpiCard = ({ icon, label, value, sub, iconBg, iconColor }) => (
  <div style={styles.kpiCard}>
    <div style={{ ...styles.kpiIcon, background: iconBg, color: iconColor }}>
      {icon}
    </div>
    <p style={styles.kpiLabel}>{label}</p>
    <p style={styles.kpiValue}>{value}</p>
    {sub && <p style={styles.kpiSub}>{sub}</p>}
  </div>
)

const Avatar = ({ first, last, index }) => {
  const { bg, color } = avatarStyle(index)
  return (
    <span style={{ ...styles.avatar, background: bg, color }}>
      {initials(first, last)}
    </span>
  )
}

const SpecialtyBar = ({ name, count, max, colorIndex }) => (
  <li style={styles.specItem}>
    <span style={styles.specName}>{name}</span>
    <div style={styles.specRight}>
      <div style={styles.specBarWrap}>
        <div
          style={{
            ...styles.specBarFill,
            width: `${Math.round((count / max) * 100)}%`,
            background: SPECIALTY_BAR_COLORS[colorIndex % SPECIALTY_BAR_COLORS.length],
          }}
        />
      </div>
      <span style={styles.specCount}>{count}</span>
    </div>
  </li>
)

// ─── main component ──────────────────────────────────────────────────────────

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [whatsappLines, setWhatsappLines] = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [apts, pats, docs, specs, lines] = await Promise.all([
          appointmentService.listar(),
          patientService.listar(),
          doctorService.listar(),
          specialtyService.listar(),
          whatsappLineService.listar(),
        ])
        setAppointments(apts ?? [])
        setPatients(pats ?? [])
        setDoctors(docs ?? [])
        setSpecialties(specs ?? [])
        setWhatsappLines(lines ?? [])
      } catch (err) {
        console.error('Error cargando dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── derived data ──────────────────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0]

  const citasHoy = useMemo(
    () => appointments.filter((a) => a.startDate?.startsWith(today)).length,
    [appointments, today],
  )

  const citasPorEstado = useMemo(() => {
    const map = {}
    appointments.forEach((a) => {
      const e = a.status?.name || 'Sin estado'
      map[e] = (map[e] || 0) + 1
    })
    return map
  }, [appointments])

  const tasaConfirmacion = useMemo(() => {
    if (!appointments.length) return 0
    const conf = appointments.filter((a) => a.status?.name === 'Confirmada').length
    return Math.round((conf / appointments.length) * 100)
  }, [appointments])

  const citasTrend = useMemo(() => {
    const days = last7Days()
    return days.map((d) => appointments.filter((a) => a.startDate?.startsWith(d)).length)
  }, [appointments])

  const confirmadasTrend = useMemo(() => {
    const days = last7Days()
    return days.map(
      (d) =>
        appointments.filter(
          (a) => a.startDate?.startsWith(d) && a.status?.name === 'Confirmada',
        ).length,
    )
  }, [appointments])

  const proximasCitas = useMemo(() => {
    // Obtenemos la fecha de hoy a las 00:00:00 para comparar correctamente
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return [...appointments]
      .filter((a) => {
        if (!a.startDate) return false;
        // Comparamos si la fecha de la cita es mayor o igual a hoy
        return new Date(a.startDate) >= now;
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5);
  }, [appointments]);

  const specialtyCounts = useMemo(() => {
    const map = {}
    appointments.forEach((a) => {
      const name = a.doctor?.specialty?.name || 'Sin especialidad'
      map[name] = (map[name] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [appointments])

  const maxSpecCount = specialtyCounts[0]?.[1] || 1

  // ── chart data ────────────────────────────────────────────────────────────

  const lineData = {
    labels: DAY_LABELS,
    datasets: [
      {
        label: 'Citas',
        data: citasTrend,
        borderColor: '#378ADD',
        backgroundColor: 'rgba(55,138,221,0.09)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#378ADD',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: 'Confirmadas',
        data: confirmadasTrend,
        borderColor: '#1D9E75',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        borderDash: [5, 3],
        pointBackgroundColor: '#1D9E75',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  }

  const doughnutData = {
    labels: Object.keys(citasPorEstado),
    datasets: [
      {
        data: Object.values(citasPorEstado),
        backgroundColor: ['#639922', '#BA7517', '#E24B4A', '#378ADD', '#888780'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888780', font: { size: 11 } } },
      y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: '#888780', font: { size: 11 } }, beginAtZero: true },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: { legend: { display: false } },
  }

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <div style={styles.root}>

      {/* ── KPIs ── */}
      <div style={styles.kpiGrid}>
        <KpiCard
          icon={<i className="ti ti-users" style={{ fontSize: 16 }} />}
          label="Pacientes"
          value={patients.length.toLocaleString()}
          sub="Total registrados"
          iconBg="#E6F1FB" iconColor="#185FA5"
        />
        <KpiCard
          icon={<i className="ti ti-stethoscope" style={{ fontSize: 16 }} />}
          label="Médicos"
          value={doctors.length.toLocaleString()}
          sub={`${specialties.length} especialidades`}
          iconBg="#E1F5EE" iconColor="#0F6E56"
        />
        <KpiCard
          icon={<i className="ti ti-calendar-event" style={{ fontSize: 16 }} />}
          label="Citas hoy"
          value={citasHoy.toLocaleString()}
          sub={`${citasPorEstado['Pendiente'] ?? 0} pendientes`}
          iconBg="#FAEEDA" iconColor="#854F0B"
        />
        <KpiCard
          icon={<i className="ti ti-check" style={{ fontSize: 16 }} />}
          label="Confirmadas"
          value={`${tasaConfirmacion}%`}
          sub="Tasa general"
          iconBg="#EEEDFE" iconColor="#534AB7"
        />
        <KpiCard
          icon={<i className="ti ti-brand-whatsapp" style={{ fontSize: 16 }} />}
          label="Líneas WhatsApp"
          value={whatsappLines.length.toLocaleString()}
          sub="Bot activo"
          iconBg="#FAECE7" iconColor="#993C1D"
        />
      </div>

      {/* ── Charts row ── */}
      <CRow className="mb-3 g-3">
        <CCol lg={8}>
          <CCard style={styles.card}>
            <CCardHeader style={styles.cardHeader}>
              <span style={styles.cardTitle}>
                <i className="ti ti-chart-line" style={styles.titleIcon} />
                Tendencia de citas — últimos 7 días
              </span>
              <div style={styles.chartLegend}>
                <span style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: '#378ADD' }} />
                  Citas
                </span>
                <span style={styles.legendItem}>
                  <span style={{ ...styles.legendDash, borderColor: '#1D9E75' }} />
                  Confirmadas
                </span>
              </div>
            </CCardHeader>
            <CCardBody>
              <div style={{ position: 'relative', height: 200 }}>
                <CChartLine data={lineData} options={chartOptions} />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={4}>
          <CCard style={{ ...styles.card, height: '100%' }}>
            <CCardHeader style={styles.cardHeader}>
              <span style={styles.cardTitle}>
                <i className="ti ti-chart-donut" style={styles.titleIcon} />
                Estado de citas
              </span>
            </CCardHeader>
            <CCardBody>
              <div style={styles.doughnutLegend}>
                {Object.entries(citasPorEstado).map(([label, val], i) => (
                  <span key={label} style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, background: doughnutData.datasets[0].backgroundColor[i] }} />
                    {label} {Math.round((val / appointments.length) * 100)}%
                  </span>
                ))}
              </div>
              <div style={{ position: 'relative', height: 170 }}>
                <CChartDoughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ── Table + Panels ── */}
      <CRow className="g-3">
        <CCol xs={12}>
          <CCard style={styles.card}>
            <CCardHeader style={styles.cardHeader}>
              <span style={styles.cardTitle}>
                <i className="ti ti-clock" style={styles.titleIcon} />
                Próximas citas
              </span>
            </CCardHeader>
            <CCardBody style={{ padding: 0 }}>
              <CTable hover responsive align="middle" style={styles.table}>
                <CTableHead>
                  <CTableRow>
                    {['Paciente', 'Médico', 'Especialidad', 'Fecha', 'Estado'].map((h) => (
                      <CTableHeaderCell key={h} style={styles.th}>{h}</CTableHeaderCell>
                    ))}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {proximasCitas.map((cita, i) => (
                    <CTableRow key={cita.id ?? i} style={styles.tr}>
                      <CTableDataCell style={styles.td}>
                        <div style={styles.patientCell}>
                          <Avatar
                            first={cita.patient?.firstName}
                            last={cita.patient?.lastName}
                            index={i}
                          />
                          {cita.patient?.firstName} {cita.patient?.lastName}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell style={styles.td}>
                        {cita.doctor?.user?.firstName
                          ? `Dr. ${cita.doctor.user.firstName}`
                          : '—'}
                      </CTableDataCell>
                      <CTableDataCell style={styles.td}>
                        {cita.doctor?.specialty?.name || '—'}
                      </CTableDataCell>
                      <CTableDataCell style={styles.td}>
                        {new Date(cita.startDate).toLocaleString('es-EC', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </CTableDataCell>
                      <CTableDataCell style={styles.td}>
                        <CBadge color={badgeColor(cita.status?.name)} shape="rounded-pill">
                          {cita.status?.name || 'N/A'}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                  {proximasCitas.length === 0 && (
                    <CTableRow>
                      <CTableDataCell colSpan={5} style={{ ...styles.td, textAlign: 'center', color: 'var(--cui-secondary-color)' }}>
                        Sin citas próximas
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Specialties */}
        <CCol md={6}>
          <CCard style={styles.card}>
            <CCardHeader style={styles.cardHeader}>
              <span style={styles.cardTitle}>
                <i className="ti ti-building-hospital" style={styles.titleIcon} />
                Especialidades más activas
              </span>
            </CCardHeader>
            <CCardBody>
              <ul style={styles.specList}>
                {specialtyCounts.length > 0
                  ? specialtyCounts.map(([name, count], i) => (
                      <SpecialtyBar key={name} name={name} count={count} max={maxSpecCount} colorIndex={i} />
                    ))
                  : specialties.slice(0, 5).map((s, i) => (
                      <SpecialtyBar key={s.id} name={s.name} count={0} max={1} colorIndex={i} />
                    ))}
              </ul>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Quick stats */}
        <CCol md={6}>
          <CCard style={styles.card}>
            <CCardHeader style={styles.cardHeader}>
              <span style={styles.cardTitle}>
                <i className="ti ti-report-analytics" style={styles.titleIcon} />
                Resumen general
              </span>
            </CCardHeader>
            <CCardBody>
              <ul style={styles.specList}>
                {[
                  { label: 'Total de citas', value: appointments.length, icon: 'ti-calendar' },
                  { label: 'Citas confirmadas', value: citasPorEstado['Confirmada'] ?? 0, icon: 'ti-circle-check' },
                  { label: 'Citas canceladas', value: citasPorEstado['Cancelada'] ?? 0, icon: 'ti-circle-x' },
                  { label: 'Citas pendientes', value: citasPorEstado['Pendiente'] ?? 0, icon: 'ti-clock' },
                  { label: 'Citas finalizadas', value: citasPorEstado['Finalizada'] ?? 0, icon: 'ti-checks' },
                ].map(({ label, value, icon }) => (
                  <li key={label} style={styles.specItem}>
                    <span style={styles.specName}>
                      <i className={`ti ${icon}`} style={{ marginRight: 8, opacity: 0.6 }} />
                      {label}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{value.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = {
  root: {
    padding: '0 0 2rem',
  },
  loadingWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem 0',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 10,
    marginBottom: '1.25rem',
  },
  kpiCard: {
    background: 'var(--cui-tertiary-bg)',
    borderRadius: 12,
    padding: '14px 16px',
    border: '1px solid var(--cui-border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: 'var(--cui-secondary-color)',
    margin: 0,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: 500,
    margin: 0,
    lineHeight: 1.1,
  },
  kpiSub: {
    fontSize: 11,
    color: 'var(--cui-tertiary-color)',
    margin: 0,
  },
  card: {
    border: '1px solid var(--cui-border-color)',
    borderRadius: 12,
    boxShadow: 'none',
  },
  cardHeader: {
    background: 'transparent',
    borderBottom: '1px solid var(--cui-border-color)',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--cui-secondary-color)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  titleIcon: {
    fontSize: 15,
    opacity: 0.7,
  },
  chartLegend: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
  },
  doughnutLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    color: 'var(--cui-secondary-color)',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    display: 'inline-block',
    flexShrink: 0,
  },
  legendDash: {
    width: 16,
    height: 0,
    borderTop: '2px dashed',
    display: 'inline-block',
    flexShrink: 0,
  },
  table: {
    fontSize: 13,
    marginBottom: 0,
  },
  th: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--cui-tertiary-color)',
    padding: '10px 14px',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 14px',
    fontSize: 13,
  },
  tr: {
    transition: 'background 0.15s',
  },
  patientCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 500,
    marginRight: 8,
    flexShrink: 0,
  },
  specList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  specItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: 13,
    borderBottom: '1px solid var(--cui-border-color)',
  },
  specName: {
    color: 'var(--cui-body-color)',
    display: 'flex',
    alignItems: 'center',
  },
  specRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  specBarWrap: {
    width: 80,
    height: 4,
    background: 'var(--cui-tertiary-bg)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  specBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.4s ease',
  },
  specCount: {
    fontSize: 12,
    color: 'var(--cui-secondary-color)',
    minWidth: 24,
    textAlign: 'right',
  },
}

export default Dashboard