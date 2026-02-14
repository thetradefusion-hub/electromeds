import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { layout } from "../../theme/layout";
import { Card } from "../../components/ui/Card";
import { fetchPatientCaseRecords, type CaseRecord } from "../../api/classicalHomeopathy";

type PatientProfileParams = {
  patient?: {
    id: string;
    name: string;
    code: string;
    gender: string;
    ageLabel: string;
  };
};

type TimelineItem = {
  id: string;
  date: string;
  label: string;
  note: string;
};

export default function PatientProfileScreen() {
  const route = useRoute<RouteProp<Record<string, PatientProfileParams>, string>>();
  const navigation = useNavigation<any>();
  const patient = route.params?.patient;

  const name = patient?.name ?? "Patient";
  const code = patient?.code ?? "HOM-0000";
  const gender = patient?.gender ?? "Unknown";
  const age = patient?.ageLabel ?? "-";

  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!patient?.id) return;
      try {
        setLoading(true);
        const records = await fetchPatientCaseRecords(patient.id);
        const items: TimelineItem[] = records
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((r) => {
            const date = new Date(r.createdAt).toLocaleDateString();
            const label = r.finalRemedy
              ? `Classical case – ${r.finalRemedy.remedyName} ${r.finalRemedy.potency}`
              : "Classical case recorded";
            const tags = r.structuredCase?.pathologyTags || [];
            const note =
              r.caseSummary?.clinicalSummary ||
              (tags.length ? tags.join(", ") : r.outcomeStatus ? `Outcome: ${r.outcomeStatus}` : "No summary");
            return {
              id: r._id,
              date,
              label,
              note,
            };
          });
        setTimeline(items);
        setError(null);
      } catch (e: any) {
        console.error("Failed to load case records", e);
        setError("Unable to load case timeline.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patient?.id]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={styles.headerSpacer} />
      </View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Top profile card */}
          <Card style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>
                  {name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.code}>ID: {code}</Text>
                <Text style={styles.meta}>
                  {gender}, {age}
                </Text>
              </View>
            </View>
          </Card>

          {/* Start new classical case */}
          <TouchableOpacity
            style={styles.startCaseBtn}
            disabled={!patient?.id}
            onPress={() => {
              if (!patient?.id) return;
              navigation.navigate("NewCase", {
                screen: "CaseMode",
                params: {
                  patientId: patient.id,
                  patientName: name,
                },
              });
            }}
          >
            <Text style={styles.startCaseBtnText}>Consult Now</Text>
          </TouchableOpacity>

          {/* Compare progress – Phase 3 */}
          <TouchableOpacity
            style={styles.compareBtn}
            onPress={() => navigation.navigate("FollowUpComparison", { patientName: name })}
          >
            <Text style={styles.compareBtnText}>Compare progress (Initial vs Current)</Text>
          </TouchableOpacity>

          {/* Treatment timeline */}
          <Text style={styles.timelineTitle}>Treatment Timeline</Text>
          <Text style={styles.timelineSubtitle}>Key consultations and clinical milestones.</Text>

          <View style={styles.timelineWrapper}>
            {timeline.length === 0 ? (
              <Text style={styles.emptyText}>No classical cases recorded yet.</Text>
            ) : (
              timeline.map((item, index) => (
                <View key={item.id} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineDotOuter}>
                      <View style={styles.timelineDotInner} />
                    </View>
                    {index !== timeline.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <Card style={styles.timelineCard}>
                    <Text style={styles.timelineDate}>{item.date}</Text>
                    <Text style={styles.timelineLabel}>{item.label}</Text>
                    <Text style={styles.timelineNote}>{item.note}</Text>
                  </Card>
                </View>
              ))
            )}
          </View>
        </ScrollView>
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
    paddingHorizontal: layout.spacing,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    paddingHorizontal: layout.spacing,
    paddingTop: 16,
    paddingBottom: 32,
  },
  profileCard: {
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E0F2F1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 18,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  code: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  startCaseBtn: {
    backgroundColor: colors.primary,
    borderRadius: layout.radius,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  startCaseBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  compareBtn: {
    backgroundColor: "#E0F7FA",
    borderRadius: layout.radius,
    padding: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  compareBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  timelineSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  timelineWrapper: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  timelineLeft: {
    width: 24,
    alignItems: "center",
  },
  timelineDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  timelineCard: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  timelineNote: {
    fontSize: 13,
    color: colors.textSecondary,
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
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
});

