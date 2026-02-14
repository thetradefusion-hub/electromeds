import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import { useAuth } from "../../context/AuthContext";

export type PrescriptionData = {
  _id?: string;
  prescriptionNo: string;
  patientId: any;
  medicines: Array<{
    name: string;
    potency?: string;
    repetition?: string;
    instructions?: string;
    category?: string;
  }>;
  symptoms?: Array<{ name: string; severity?: string }>;
  diagnosis?: string;
  advice?: string;
  createdAt?: string;
};

type PrescriptionPreviewParams = {
  prescription: PrescriptionData;
  patientName?: string;
  patientId?: string;
  patientAgeGender?: string;
};

const CLINIC_NAME = "Default Clinic";
const CLINIC_ADDRESS = "Default Address";
const REG_NO = "Reg. No: DOC-001";

export default function PrescriptionPreviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, PrescriptionPreviewParams>, string>>();
  const params = route.params as PrescriptionPreviewParams;
  const { user } = useAuth();

  const prescription = params?.prescription;
  const patientName = params?.patientName ?? (prescription?.patientId?.name ?? "Patient");
  const patientAgeGender =
    params?.patientAgeGender ??
    (prescription?.patientId
      ? [prescription.patientId.age, prescription.patientId.gender].filter(Boolean).join(" / ") || "—"
      : "—");
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!prescription) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No prescription data.</Text>
      </View>
    );
  }

  const dateStr = prescription.createdAt
    ? new Date(prescription.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const medicines = prescription.medicines ?? [];
  const symptoms = prescription.symptoms ?? [];
  const doctorName = user?.name ?? "Doctor User";

  const getShareMessage = () => {
    let text = `PRESCRIPTION\n${prescription.prescriptionNo}\nDate: ${dateStr}\nPatient: ${patientName}\n\n`;
    text += "MEDICINES\n";
    medicines.forEach((m) => {
      text += `• ${m.name} ${m.potency ?? ""} ${m.repetition ?? ""}\n`;
      if (m.instructions) text += `  ${m.instructions}\n`;
    });
    if (prescription.advice) text += `\nAdvice: ${prescription.advice}\n`;
    return text;
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      const message = getShareMessage();
      const url = "https://wa.me/?text=" + encodeURIComponent(message);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Share.share({
          message: message,
          title: `Prescription ${prescription.prescriptionNo}`,
        });
      }
    } catch (e: any) {
      if (e?.message !== "User did not share") {
        await Share.share({
          message: getShareMessage(),
          title: `Prescription ${prescription.prescriptionNo}`,
        }).catch(() => Alert.alert("Share", e?.message ?? "Could not share."));
      }
    } finally {
      setSharing(false);
    }
  };

  const getPdfHtml = () => {
    const medicineRows = medicines
      .map(
        (m) => `
        <tr>
          <td style="padding:12px 16px; border-bottom:1px solid #eee;">
            <div style="display:flex; align-items:flex-start; gap:12px;">
              <span style="width:28px; height:28px; background:#E3F2FD; border-radius:6px; display:inline-flex; align-items:center; justify-content:center; color:#006064; font-size:12px; font-weight:700;">Rx</span>
              <div>
                <div style="font-weight:600; color:#212121; font-size:15px;">${m.name}</div>
                <div style="font-size:13px; color:#757575; margin-top:4px;">${[m.potency, m.repetition].filter(Boolean).join(" • ") || "—"}${m.instructions ? `<br/><span style="color:#212121;">${m.instructions}</span>` : ""}</div>
              </div>
            </div>
          </td>
        </tr>`
      )
      .join("");
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 32px; color: #212121; font-size: 14px; }
    .clinic { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #E0E0E0; }
    .clinic-name { font-size: 22px; font-weight: 700; color: #006064; margin-bottom: 4px; }
    .clinic-address { font-size: 12px; color: #757575; margin-bottom: 8px; }
    .doctor { font-size: 15px; font-weight: 600; color: #212121; }
    .doctor-meta { font-size: 12px; color: #757575; margin-top: 4px; }
    .patient-block { background: #F5F5F5; border-radius: 12px; padding: 16px 20px; margin: 20px 0; display: flex; flex-wrap: wrap; gap: 24px; }
    .patient-col { flex: 1; min-width: 140px; }
    .patient-label { font-size: 11px; color: #757575; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .patient-value { font-size: 15px; font-weight: 600; color: #212121; }
    .rx-title { font-size: 11px; font-weight: 700; color: #757575; letter-spacing: 0.5px; margin: 20px 0 12px; }
    .medicine-card { background: #fff; border: 1px solid #E0E0E0; border-radius: 12px; margin-bottom: 10px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    .advice-box { margin-top: 20px; padding: 16px; background: #F5F5F5; border-radius: 10px; }
    .advice-label { font-size: 11px; font-weight: 600; color: #757575; margin-bottom: 6px; }
    .advice-text { font-size: 14px; color: #212121; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="clinic">
    <div class="clinic-name">${CLINIC_NAME}</div>
    <div class="clinic-address">${CLINIC_ADDRESS}</div>
    <div class="doctor">${doctorName}</div>
    <div class="doctor-meta">MD (Homeo) • ${REG_NO}</div>
  </div>
  <div class="patient-block">
    <div class="patient-col">
      <div class="patient-label">Patient</div>
      <div class="patient-value">${patientName}</div>
    </div>
    <div class="patient-col">
      <div class="patient-label">Age / Gender</div>
      <div class="patient-value">${patientAgeGender}</div>
    </div>
    <div class="patient-col">
      <div class="patient-label">ID</div>
      <div class="patient-value">${prescription.prescriptionNo}</div>
    </div>
    <div class="patient-col">
      <div class="patient-label">Date</div>
      <div class="patient-value">${dateStr}</div>
    </div>
  </div>
  <div class="rx-title">RX — MEDICINES</div>
  <div class="medicine-card">
    <table>${medicineRows}</table>
  </div>
  ${prescription.advice ? `<div class="advice-box"><div class="advice-label">Advice</div><div class="advice-text">${prescription.advice}</div></div>` : ""}
</body>
</html>`;
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      const { printToFileAsync } = await import("expo-print");
      const html = getPdfHtml();
      const { uri } = await printToFileAsync({ html });
      const Sharing = await import("expo-sharing");
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Save or share prescription PDF",
        });
      } else {
        Alert.alert("Done", "PDF ready. Use Share to send or save.");
      }
    } catch (e: any) {
      Alert.alert("PDF", e?.message ?? "Could not create PDF. Install expo-print and expo-sharing.");
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setPrinting(true);
      const { printToFileAsync } = await import("expo-print");
      const html = getPdfHtml();
      const { uri } = await printToFileAsync({ html });
      const Sharing = await import("expo-sharing");
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Download or share prescription PDF",
        });
      } else {
        Alert.alert("Done", "PDF ready. Use Share to save.");
      }
    } catch (e: any) {
      Alert.alert("PDF", e?.message ?? "Could not create PDF.");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.screenHeaderTitle}>Prescription</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Clinic & Doctor header */}
          <View style={styles.clinicHeader}>
            <Text style={styles.clinicName}>{CLINIC_NAME}</Text>
            <Text style={styles.clinicAddress}>{CLINIC_ADDRESS}</Text>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <Text style={styles.doctorMeta}>MD (Homeo) • {REG_NO}</Text>
          </View>

          {/* Patient & prescription details - two column block */}
          <View style={styles.patientBlock}>
            <View style={styles.patientRow}>
              <View style={styles.patientCol}>
                <Text style={styles.patientLabel}>Patient</Text>
                <Text style={styles.patientValue}>{patientName}</Text>
              </View>
              <View style={styles.patientCol}>
                <Text style={styles.patientLabel}>Age / Gender</Text>
                <Text style={styles.patientValue}>{patientAgeGender}</Text>
              </View>
            </View>
            <View style={styles.patientRow}>
              <View style={styles.patientCol}>
                <Text style={styles.patientLabel}>ID</Text>
                <Text style={styles.patientValue}>{prescription.prescriptionNo}</Text>
              </View>
              <View style={styles.patientCol}>
                <Text style={styles.patientLabel}>Date</Text>
                <Text style={styles.patientValue}>{dateStr}</Text>
              </View>
            </View>
          </View>

          {/* RX - Medicines */}
          <Text style={styles.rxTitle}>RX — MEDICINES</Text>
          {medicines.map((m, i) => (
            <View key={i} style={styles.medicineCard}>
              <View style={styles.medicineIconWrap}>
                <Ionicons name="medical" size={20} color={colors.primary} />
              </View>
              <View style={styles.medicineContent}>
                <Text style={styles.medicineName}>{m.name}</Text>
                <Text style={styles.medicineMeta}>
                  {[m.potency, m.repetition].filter(Boolean).join(" • ") || "—"}
                </Text>
                {m.instructions ? (
                  <Text style={styles.medicineInstructions}>{m.instructions}</Text>
                ) : null}
              </View>
            </View>
          ))}

          {symptoms.length > 0 && (
            <>
              <Text style={styles.rxTitle}>Symptoms</Text>
              {symptoms.slice(0, 6).map((s, i) => (
                <Text key={i} style={styles.bullet}>• {s.name}</Text>
              ))}
            </>
          )}

          {prescription.advice ? (
            <View style={styles.adviceBox}>
              <Text style={styles.adviceLabel}>Advice</Text>
              <Text style={styles.adviceText}>{prescription.advice}</Text>
            </View>
          ) : null}
        </View>

        {/* Action buttons */}
        <TouchableOpacity
          style={[styles.whatsappBtn, sharing && styles.btnDisabled]}
          onPress={handleShare}
          disabled={sharing}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#FFF" />
          <Text style={styles.whatsappBtnText}>
            {sharing ? "Opening..." : "Share via WhatsApp"}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[styles.printBtn, printing && styles.btnDisabled]}
            onPress={handleDownloadPdf}
            disabled={printing}
          >
            <Ionicons name="print-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.printBtnText}>Print</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pdfBtn, printing && styles.btnDisabled]}
            onPress={handleDownloadPdf}
            disabled={printing}
          >
            <Ionicons name="download-outline" size={20} color="#FFF" />
            <Text style={styles.pdfBtnText}>
              {printing ? "Creating..." : "Download PDF"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: layout.spacing,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  screenHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  scroll: {
    padding: layout.spacing,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  clinicHeader: {
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  clinicName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  clinicAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  doctorMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  patientBlock: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  patientRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  patientCol: {
    flex: 1,
  },
  patientLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  patientValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rxTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
  },
  medicineCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  medicineIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  medicineContent: {
    flex: 1,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  medicineMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  medicineInstructions: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 4,
  },
  bullet: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  adviceBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
  },
  adviceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  adviceText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  whatsappBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  bottomButtons: {
    flexDirection: "row",
    gap: 12,
  },
  printBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0E0E0",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  printBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  pdfBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  pdfBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  btnDisabled: {
    opacity: 0.7,
  },
  doneBtn: {
    alignItems: "center",
    paddingVertical: 16,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
  },
});
