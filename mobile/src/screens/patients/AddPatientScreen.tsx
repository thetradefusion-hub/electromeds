import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import { Button } from "../../components/ui/Button";
import { createPatient, type CreatePatientPayload, type Patient } from "../../api/patient";

const GENDERS: { value: "male" | "female" | "other"; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const CASE_TYPES: { value: "new" | "old"; label: string }[] = [
  { value: "new", label: "New" },
  { value: "old", label: "Old" },
];

type AddPatientParams = {
  onPatientAdded?: (patient: Patient) => void;
};

type RouteParams = RouteProp<Record<string, AddPatientParams>, string>;

export default function AddPatientScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const params = route.params as AddPatientParams | undefined;
  const onPatientAdded = params?.onPatientAdded;

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [caseType, setCaseType] = useState<"new" | "old">("new");
  const [submitting, setSubmitting] = useState(false);

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
      if (onOk) onOk();
      return;
    }
    Alert.alert(title, message, onOk ? [{ text: "OK", onPress: onOk }] : undefined);
  };

  const validate = (): string | null => {
    const n = name.trim();
    if (!n) return "Name is required.";
    const a = parseInt(age, 10);
    if (isNaN(a) || a < 0 || a > 150) return "Enter valid age (0–150).";
    const m = mobile.trim().replace(/\D/g, "");
    if (m.length !== 10) return "Mobile must be 10 digits.";
    return null;
  };

  const resetForm = () => {
    setName("");
    setAge("");
    setMobile("");
    setAddress("");
    setGender("male");
    setCaseType("new");
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      showAlert("Validation", err);
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreatePatientPayload = {
        name: name.trim(),
        age: parseInt(age, 10),
        gender,
        mobile: mobile.trim().replace(/\D/g, ""),
        caseType,
      };
      if (address.trim()) payload.address = address.trim();

      const patient = await createPatient(payload);

      // If callback exists (e.g. ScheduleAppointment), inform caller
      if (onPatientAdded) {
        onPatientAdded(patient);
      }

      // Clear form state (in case screen stays in history)
      resetForm();

      // Navigate back to previous screen (usually Patients list)
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("PatientsList");
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.errors?.[0]?.msg ??
        e?.message ??
        "Could not add patient. Please try again.";
      showAlert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Patient</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Age *</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={(t) => setAge(t.replace(/\D/g, "").slice(0, 3))}
          placeholder="e.g. 30"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Gender *</Text>
        <View style={styles.chipRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.chip, gender === g.value && styles.chipActive]}
              onPress={() => setGender(g.value)}
            >
              <Text style={[styles.chipText, gender === g.value && styles.chipTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Mobile *</Text>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={(t) => setMobile(t.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit number"
          placeholderTextColor={colors.textTertiary}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Address (optional)</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={address}
          onChangeText={setAddress}
          placeholder="Address"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Case type</Text>
        <View style={styles.chipRow}>
          {CASE_TYPES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.chip, caseType === c.value && styles.chipActive]}
              onPress={() => setCaseType(c.value)}
            >
              <Text style={[styles.chipText, caseType === c.value && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.submitWrap}>
          <Button
            title={submitting ? "Adding..." : "Add Patient"}
            onPress={handleSubmit}
            loading={submitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  scroll: {
    padding: layout.spacing,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 4,
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
    marginBottom: 4,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: "#FFF",
  },
  submitWrap: {
    marginTop: 24,
  },
});
