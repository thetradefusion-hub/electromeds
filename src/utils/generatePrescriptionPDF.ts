import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface PatientInfo {
  name: string;
  patient_id: string;
  age: number;
  gender: string;
  mobile: string;
  address?: string | null;
}

interface DoctorInfo {
  name: string;
  clinic_name: string | null;
  clinic_address: string | null;
  qualification: string;
  registration_no: string;
  specialization: string;
}

interface PrescriptionSymptom {
  name: string;
  severity: string;
  duration: number;
  durationUnit: string;
}

interface PrescriptionMedicine {
  name: string;
  category: string;
  modality?: 'electro_homeopathy' | 'classical_homeopathy';
  // Electro Homeopathy
  dosage?: string;
  duration?: string;
  // Classical Homeopathy
  potency?: string;
  repetition?: string;
  instructions?: string;
}

interface PrescriptionData {
  prescription_no: string;
  created_at: string;
  symptoms: PrescriptionSymptom[];
  medicines: PrescriptionMedicine[];
  diagnosis?: string | null;
  advice?: string | null;
  follow_up_date?: string | null;
}

export const generatePrescriptionPDF = (
  prescription: PrescriptionData,
  patient: PatientInfo,
  doctor: DoctorInfo
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = 25;

  // Helper function to check page break
  const checkPageBreak = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - 40) {
      doc.addPage();
      yPos = 25;
      return true;
    }
    return false;
  };

  // Compact Premium Header Section - Centered
  const centerX = pageWidth / 2;
  
  // Clinic Name (Centered, compact size)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(doctor.clinic_name || 'Medical Clinic', centerX, yPos, { align: 'center' });
  yPos += 5;
  
  // Clinic Address (Centered, compact)
  if (doctor.clinic_address) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const addressLines = doc.splitTextToSize(doctor.clinic_address, contentWidth);
    addressLines.forEach((line: string, index: number) => {
      doc.text(line, centerX, yPos + (index * 3.5), { align: 'center' });
    });
    yPos += addressLines.length * 3.5;
  }
  
  yPos += 3;
  
  // Thin decorative line separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin + 20, yPos, pageWidth - margin - 20, yPos);
  yPos += 4;
  
  // Doctor Details (Centered, compact)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(doctor.name, centerX, yPos, { align: 'center' });
  yPos += 4;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(doctor.qualification, centerX, yPos, { align: 'center' });
  yPos += 4;
  
  doc.text(`Reg. No: ${doctor.registration_no}`, centerX, yPos, { align: 'center' });
  yPos += 4;
  
  if (doctor.specialization) {
    doc.setTextColor(100, 116, 139);
    doc.text(doctor.specialization, centerX, yPos, { align: 'center' });
    yPos += 4;
  }
  
  yPos += 4;
  
  // Prescription Number and Date (Right aligned, compact, same line)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const rxText = `Prescription No: ${prescription.prescription_no} | Date: ${format(new Date(prescription.created_at), 'dd MMM yyyy')}`;
  doc.text(rxText, pageWidth - margin, yPos - 8, { align: 'right' });

  // Compact divider line with accent
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Compact Premium Patient Information Section
  checkPageBreak(35);
  
  // Compact section header with background
  const patientHeaderHeight = 6;
  doc.setFillColor(59, 130, 246);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, contentWidth, patientHeaderHeight, 2, 2, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PATIENT INFORMATION', centerX, yPos + 4, { align: 'center' });
  yPos += patientHeaderHeight + 5;

  // Compact patient details box
  const patientBoxPadding = 5;
  const patientBoxStartY = yPos;
  
  // Calculate compact box height
  let patientBoxHeight = 16; // Reduced base height
  if (patient.address) {
    const addressLines = doc.splitTextToSize(patient.address, contentWidth - (patientBoxPadding * 2));
    patientBoxHeight += addressLines.length * 3.5;
  }
  
  // Draw compact patient info box
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, patientBoxStartY, contentWidth, patientBoxHeight, 2, 2, 'FD');
  
  // Left accent bar
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, patientBoxStartY, 2, patientBoxHeight, 'F');
  
  // Patient details with compact spacing
  const infoStartX = margin + patientBoxPadding + 2;
  let infoY = patientBoxStartY + 5;
  
  // Name (Bold, compact)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Name:', infoStartX, infoY);
  doc.text(patient.name, infoStartX + 18, infoY);
  infoY += 4.5;
  
  // Age, Gender, ID, Mobile (Compact grid layout)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  
  // Row 1: Age & Gender
  doc.text('Age:', infoStartX, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`${patient.age}y`, infoStartX + 10, infoY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Gender:', infoStartX + 45, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1), infoStartX + 62, infoY);
  infoY += 4;
  
  // Row 2: Patient ID & Mobile
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('ID:', infoStartX, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(patient.patient_id, infoStartX + 10, infoY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Mobile:', infoStartX + 45, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(patient.mobile, infoStartX + 62, infoY);
  infoY += 4;
  
  // Address (if exists, compact)
  if (patient.address) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Address:', infoStartX, infoY);
    infoY += 3.5;
    
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const addressLines = doc.splitTextToSize(patient.address, contentWidth - (patientBoxPadding * 2) - 2);
    addressLines.forEach((line: string, index: number) => {
      doc.text(line, infoStartX, infoY + (index * 3.5));
    });
    infoY += addressLines.length * 3.5;
  }
  
  yPos = patientBoxStartY + patientBoxHeight + 8;

  // Symptoms Section (Compact)
  if (prescription.symptoms.length > 0) {
    checkPageBreak(20);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Symptoms', margin, yPos);
    yPos += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    
    const symptomText = prescription.symptoms
      .map((s) => `${s.name} (${s.severity}, ${s.duration} ${s.durationUnit})`)
      .join(' • ');
    const symptomLines = doc.splitTextToSize(symptomText, contentWidth);
    symptomLines.forEach((line: string, index: number) => {
      doc.text(line, margin, yPos + (index * 4));
    });
    yPos += symptomLines.length * 4 + 7;
  }

  // Diagnosis Section (Compact with subtle background)
  if (prescription.diagnosis) {
    checkPageBreak(20);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Diagnosis', margin, yPos);
    yPos += 5;
    
    // Compact subtle background
    const diagLines = doc.splitTextToSize(prescription.diagnosis, contentWidth - 6);
    const diagBoxHeight = 4 + diagLines.length * 4;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, yPos, contentWidth, diagBoxHeight, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    diagLines.forEach((line: string, index: number) => {
      doc.text(line, margin + 3, yPos + 3 + (index * 4));
    });
    yPos += diagBoxHeight + 7;
  }

  // Prescription Section (Compact header)
  checkPageBreak(25);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Prescription', margin, yPos);
  yPos += 7;

  // Medicines List (Compact, numbered)
  prescription.medicines.forEach((med, index) => {
    checkPageBreak(25);

    // Medicine number and name (compact)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const medicineNameText = `${index + 1}. ${med.name}`;
    doc.text(medicineNameText, margin, yPos);
    
    // Category (if exists) - on same line if space allows
    if (med.category) {
      const categoryText = `(${med.category})`;
      const nameWidth = doc.getTextWidth(medicineNameText);
      const categoryWidth = doc.getTextWidth(categoryText);
      
      // Check if category fits on same line
      if (nameWidth + categoryWidth + 4 < contentWidth) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(categoryText, margin + nameWidth + 2, yPos);
      } else {
        // Move to next line
        yPos += 3.5;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(categoryText, margin + 5, yPos);
      }
    }
    yPos += 4.5;
    
    // Medicine details (compact) - Support both Electro and Classical Homeopathy
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    
    const isClassical = med.modality === 'classical_homeopathy';
    
    if (isClassical && med.potency && med.repetition) {
      // Classical Homeopathy: Potency and Repetition
      const potencyText = `Potency: ${med.potency}`;
      const repetitionText = `Repetition: ${med.repetition}`;
      
      // Check if both fit on same line
      const potencyWidth = doc.getTextWidth(potencyText);
      const repetitionWidth = doc.getTextWidth(repetitionText);
      const availableWidth = contentWidth - 10;
      
      if (potencyWidth + repetitionWidth + 12 < availableWidth) {
        // Same line
        doc.text(potencyText, margin + 5, yPos);
        doc.text(repetitionText, margin + 5 + potencyWidth + 12, yPos);
        yPos += 4;
      } else {
        // Separate lines
        doc.text(potencyText, margin + 5, yPos);
        yPos += 4;
        doc.text(repetitionText, margin + 5, yPos);
        yPos += 4;
      }
    } else if (med.dosage && med.duration) {
      // Electro Homeopathy: Dosage and Duration
      const dosageText = `Dosage: ${med.dosage}`;
      const durationText = `Duration: ${med.duration}`;
      
      // Check if both fit on same line
      const dosageWidth = doc.getTextWidth(dosageText);
      const durationWidth = doc.getTextWidth(durationText);
      const availableWidth = contentWidth - 10;
      
      if (dosageWidth + durationWidth + 12 < availableWidth) {
        // Same line
        doc.text(dosageText, margin + 5, yPos);
        doc.text(durationText, margin + 5 + dosageWidth + 12, yPos);
        yPos += 4;
      } else {
        // Separate lines
        doc.text(dosageText, margin + 5, yPos);
        yPos += 4;
        doc.text(durationText, margin + 5, yPos);
        yPos += 4;
      }
    }
    
    // Instructions (if exists, compact)
    if (med.instructions) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      const instructionLines = doc.splitTextToSize(`Note: ${med.instructions}`, contentWidth - 10);
      instructionLines.forEach((line: string, lineIndex: number) => {
        doc.text(line, margin + 5, yPos + (lineIndex * 3.5));
      });
      yPos += instructionLines.length * 3.5;
    }
    yPos += 4; // Compact space between medicines
  });

  yPos += 4;

  // Advice Section (Compact)
  if (prescription.advice) {
    checkPageBreak(20);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Advice', margin, yPos);
    yPos += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const adviceLines = doc.splitTextToSize(prescription.advice, contentWidth);
    adviceLines.forEach((line: string, index: number) => {
      doc.text(line, margin, yPos + (index * 4));
    });
    yPos += adviceLines.length * 4 + 7;
  }

  // Follow-up Date (Compact)
  if (prescription.follow_up_date) {
    checkPageBreak(12);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const followUpLabel = 'Follow-up Date:';
    doc.text(followUpLabel, margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const followUpDate = format(new Date(prescription.follow_up_date), 'dd MMM yyyy');
    doc.text(followUpDate, margin + doc.getTextWidth(followUpLabel) + 3, yPos);
    yPos += 8;
  }

  // Doctor Signature (Right aligned, compact)
  if (yPos < pageHeight - 50) {
    yPos += 10;
    
    const sigWidth = 65;
    const sigX = pageWidth - margin - sigWidth;
    
    // Signature line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(sigX, yPos, pageWidth - margin, yPos);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(doctor.name, sigX + sigWidth / 2, yPos + 5, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(doctor.qualification, sigX + sigWidth / 2, yPos + 9, { align: 'center' });
    doc.text(`Reg. No: ${doctor.registration_no}`, sigX + sigWidth / 2, yPos + 13, { align: 'center' });
  }

  // Clean Minimal Footer
  const footerY = pageHeight - 15;
  
  // Thin top border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, pageWidth / 2, footerY, { align: 'center' });
  
  // Page numbers
  const totalPages = doc.internal.pages.length - 1;
  if (totalPages > 1) {
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }
  }

  // Save the PDF
  doc.save(`${prescription.prescription_no}.pdf`);
};
