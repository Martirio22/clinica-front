import { patientService } from './patientService';
import { doctorService } from './doctorService';
import { appointmentService } from './appointmentService';
import { aiBotEventService } from './aiBotEventService';
import { specialtyService } from './specialtyService';

export const dashboardService = {
  obtenerDashboard: async () => {
    // Usamos allSettled para que si un servicio falla, el dashboard cargue igual
    const [patients, doctors, appointments, botEvents, specialties] = await Promise.all([
      patientService.listar().catch(() => []),
      doctorService.listar().catch(() => []),
      appointmentService.listar().catch(() => []),
      aiBotEventService.listar().catch(() => []),
      specialtyService.listar().catch(() => []),
    ]);

    return {
      patients: patients || [],
      doctors: doctors || [],
      appointments: appointments || [],
      botEvents: botEvents || [],
      specialties: specialties || [],
    };
  },
};