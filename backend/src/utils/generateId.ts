import Patient from '../models/Patient.model.js';
import Prescription from '../models/Prescription.model.js';

/**
 * Generate unique Patient ID (EH-YYYY-XXXX)
 */
export const generatePatientId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `EH-${year}-`;

  // Find the highest patient ID for this year
  const lastPatient = await Patient.findOne({
    patientId: { $regex: `^${prefix}` },
  })
    .sort({ patientId: -1 })
    .select('patientId')
    .lean();

  let nextNumber = 1;
  if (lastPatient?.patientId) {
    const lastNumber = parseInt(lastPatient.patientId.split('-').pop() || '0', 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

/**
 * Generate unique Prescription Number (RX-YYYY-XXXX)
 */
export const generatePrescriptionNo = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `RX-${year}-`;

  // Find the highest prescription number for this year
  const lastPrescription = await Prescription.findOne({
    prescriptionNo: { $regex: `^${prefix}` },
  })
    .sort({ prescriptionNo: -1 })
    .select('prescriptionNo')
    .lean();

  let nextNumber = 1;
  if (lastPrescription?.prescriptionNo) {
    const lastNumber = parseInt(
      lastPrescription.prescriptionNo.split('-').pop() || '0',
      10
    );
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

