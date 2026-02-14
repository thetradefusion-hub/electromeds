import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { layout } from "../../theme/layout";
import { Card } from "../../components/ui/Card";
import { fetchPatients, type Patient } from "../../api/patient";

type PatientCardItem = {
  id: string; // Mongo _id
  name: string;
  code: string;
  gender: string;
  ageLabel: string;
  lastConsultation: string;
  status: "FOLLOW-UP DUE" | "STABLE" | "UP TO DATE";
};

function StatusPill({ status }: { status: PatientCardItem["status"] }) {
  let bg = "#FFE0B2";
  let textColor = colors.accentAlert;

  if (status === "STABLE") {
    bg = "#E0F2F1";
    textColor = colors.accentSuccess;
  } else if (status === "UP TO DATE") {
    bg = "#E3F2FD";
    textColor = colors.primary;
  }

  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      <Text style={[styles.statusText, { color: textColor }]}>{status}</Text>
    </View>
  );
}

export default function PatientsScreen() {
  const navigation = useNavigation<any>();
  const [patients, setPatients] = useState<PatientCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const data = await fetchPatients();
          const mapped: PatientCardItem[] = data.map((p) => ({
            id: p._id,
            name: p.name,
            code: p.patientId,
            gender: p.gender === "male" ? "Male" : p.gender === "female" ? "Female" : "Other",
            ageLabel: `${p.age}y`,
            lastConsultation: p.visitDate
              ? new Date(p.visitDate).toLocaleDateString()
              : new Date(p.createdAt).toLocaleDateString(),
            status: "UP TO DATE",
          }));
          setPatients(mapped);
          setError(null);
        } catch (e: any) {
          console.error("Failed to load patients", e);
          setError("Unable to load patients. Please check backend/API.");
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        <Text style={styles.headerTitle}>Patient Records</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddPatient")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerIconBtn}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </View>
      </View>

      {/* Search & filters */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID..."
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterChip}>
          <Text style={styles.filterText}>Date</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </View>
        <View style={styles.filterChip}>
          <Text style={styles.filterText}>A–Z</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </View>
        <View style={styles.filterChip}>
          <Text style={styles.filterText}>Last Visit</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </View>
      </View>

      {/* Patient list */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("PatientProfile", { patient: item })}
            >
              <Card style={styles.patientCard}>
                <View style={styles.patientRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitials}>
                      {item.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")}
                    </Text>
                  </View>
                  <View style={styles.patientMain}>
                    <View style={styles.patientNameRow}>
                      <Text style={styles.patientName}>{item.name}</Text>
                      <StatusPill status={item.status} />
                    </View>
                    <Text style={styles.patientId}>ID: {item.code}</Text>
                    <View style={styles.metaRow}>
                      <View>
                        <Text style={styles.metaLabel}>Gender & Age</Text>
                        <Text style={styles.metaValue}>
                          {item.gender}, {item.ageLabel}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.metaLabel}>Last Consultation</Text>
                        <Text style={styles.metaValue}>{item.lastConsultation}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.spacing,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: layout.spacing,
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: layout.spacing,
    marginTop: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  filterText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: layout.spacing,
    paddingTop: 12,
    paddingBottom: 24,
  },
  patientCard: {
    marginBottom: 12,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0F2F1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: colors.primary,
    fontWeight: "700",
  },
  patientMain: {
    flex: 1,
  },
  patientNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  patientId: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 13,
    color: colors.accentAlert,
  },
});
