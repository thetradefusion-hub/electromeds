import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import { typography } from "../../theme/typography";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { updateDoctorDecision, type DoctorDecision, type RemedySuggestion } from "../../api/classicalHomeopathy";

type PrescriptionBuilderParams = {
  remedy: RemedySuggestion;
  caseRecordId: string;
  patientId: string;
  patientName?: string;
};

export default function PrescriptionBuilderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, PrescriptionBuilderParams>, string>>();
  const params = route.params as PrescriptionBuilderParams;

  const remedy = params?.remedy;
  const caseRecordId = params?.caseRecordId;
  const patientId = params?.patientId;
  const patientName = params?.patientName ?? "Patient";

  const [potency, setPotency] = useState(remedy?.suggestedPotency ?? "30C");
  const [repetition, setRepetition] = useState(remedy?.repetition ?? "TDS");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!caseRecordId || !remedy) {
      Alert.alert("Error", "Missing case or remedy data.");
      return;
    }

    try {
      setSubmitting(true);
      const finalRemedy: DoctorDecision = {
        remedyId: String(remedy.remedy.id),
        remedyName: remedy.remedy.name,
        potency: (potency.trim() || remedy.suggestedPotency || "30C").trim(),
        repetition: (repetition.trim() || remedy.repetition || "TDS").trim(),
        notes: notes.trim() || undefined,
      };
      const result = await updateDoctorDecision(caseRecordId, finalRemedy);
      navigation.replace("PrescriptionPreview", {
        prescription: result.prescription,
        patientName,
        patientId,
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0]?.msg ||
        error?.message ||
        "Failed to save prescription. Please check your connection and try again.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!remedy || !caseRecordId) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Missing remedy or case data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Final prescription</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.remedyCard}>
          <Text style={styles.remedyName}>{remedy.remedy.name}</Text>
          <Text style={styles.remedySub}>Match: {typeof remedy.matchScore === "number" ? remedy.matchScore.toFixed(1) : remedy.matchScore}% • {remedy.confidence}</Text>
        </Card>

        <Text style={styles.label}>Potency</Text>
        <TextInput
          style={styles.input}
          value={potency}
          onChangeText={setPotency}
          placeholder="e.g. 30C, 200C"
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={styles.label}>Repetition</Text>
        <TextInput
          style={styles.input}
          value={repetition}
          onChangeText={setRepetition}
          placeholder="e.g. TDS, OD"
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Clinical notes or instructions"
          placeholderTextColor={colors.textTertiary}
          multiline
        />

        <View style={styles.confirmBtn}>
          <Button
            title={submitting ? "Saving..." : "Confirm & create prescription"}
            onPress={handleConfirm}
            loading={submitting}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: layout.spacing,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  headerTitle: {
    ...typography.h1,
    fontSize: 18,
  },
  scroll: {
    paddingHorizontal: layout.spacing,
    paddingTop: 16,
    paddingBottom: 32,
  },
  remedyCard: {
    marginBottom: 20,
  },
  remedyName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  remedySub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  confirmBtn: {
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
  },
});
