import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { layout } from "../../theme/layout";
import { Card } from "../../components/ui/Card";
import { fetchPatients, type Patient } from "../../api/patient";

type PatientItem = {
  id: string;
  name: string;
  code: string;
  gender: string;
  ageLabel: string;
};

export default function SelectPatientForCaseScreen() {
  const navigation = useNavigation<any>();
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await fetchPatients();
      const mapped: PatientItem[] = data.map((p: Patient) => ({
        id: p._id,
        name: p.name,
        code: p.patientId,
        gender: p.gender === "male" ? "Male" : p.gender === "female" ? "Female" : "Other",
        ageLabel: `${p.age}y`,
      }));
      setPatients(mapped);
      setError(null);
    } catch (e: any) {
      console.error("Failed to load patients", e);
      setError("Unable to load patients.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadPatients();
    }, [])
  );

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.trim().toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.gender.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  const openAddPatient = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate("Patients", { screen: "AddPatient" });
    }
  };

  const consultNow = () => {
    if (!selectedPatient) return;
    navigation.navigate("CaseMode", {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Case</Text>
        <Text style={styles.headerSubtitle}>Select a patient to start consultation</Text>
      </View>

      {/* Add New Patient button */}
      <TouchableOpacity style={styles.addPatientBtn} onPress={openAddPatient} activeOpacity={0.8}>
        <Ionicons name="person-add" size={20} color={colors.primary} />
        <Text style={styles.addPatientBtnText}>Add New Patient</Text>
      </TouchableOpacity>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID or gender..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={12}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Patient list */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {searchQuery.trim() ? "No matching patients." : "No patients yet. Add one above."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedPatient?.id === item.id;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPatient(isSelected ? null : item)}
              >
                <Card style={[styles.patientCard, isSelected && styles.patientCardSelected]}>
                  <View style={styles.patientRow}>
                    <View style={[styles.avatarCircle, isSelected && styles.avatarCircleSelected]}>
                      <Text style={[styles.avatarInitials, isSelected && styles.avatarInitialsSelected]}>
                        {item.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")}
                      </Text>
                    </View>
                    <View style={styles.patientMain}>
                      <Text style={styles.patientName}>{item.name}</Text>
                      <Text style={styles.patientId}>ID: {item.code}</Text>
                      <Text style={styles.metaValue}>
                        {item.gender}, {item.ageLabel}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Consult Now - fixed at bottom when patient selected */}
      {selectedPatient && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.consultBtn} onPress={consultNow} activeOpacity={0.9}>
            <Text style={styles.consultBtnText}>Consult Now</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.footerHint}>
            Consulting: {selectedPatient.name} • Tap to change selection
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: layout.spacing,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addPatientBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: layout.spacing,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "#E0F7FA",
  },
  addPatientBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: layout.spacing,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: colors.accentAlert,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: layout.spacing,
    paddingTop: 16,
    paddingBottom: 120,
  },
  emptyWrap: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  patientCard: {
    marginBottom: 12,
  },
  patientCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: "#E0F7FA",
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarCircleSelected: {
    backgroundColor: colors.primary,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  avatarInitialsSelected: {
    color: "#FFF",
  },
  patientMain: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  patientId: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaValue: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.spacing,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  consultBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  consultBtnText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFF",
  },
  footerHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
});
