import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import { getDashboardStats } from "../../api/analytics";
import { getAppointments, type Appointment } from "../../api/appointment";
import { getPrescriptions, type Prescription } from "../../api/prescription";

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    totalPatients: number;
    todayPatients: number;
    totalPrescriptions: number;
  } | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const today = new Date().toISOString().slice(0, 10);
      const [statsRes, appointmentsRes, prescriptionsRes] = await Promise.all([
        getDashboardStats().catch(() => null),
        getAppointments({ date: today }).catch(() => []),
        getPrescriptions().then((d) => d.slice(0, 5)).catch(() => []),
      ]);
      setStats(statsRes ?? null);
      setAppointments(Array.isArray(appointmentsRes) ? appointmentsRes : []);
      setPrescriptions(Array.isArray(prescriptionsRes) ? prescriptionsRes : []);
    } catch (e: any) {
      setError(e?.message ?? "Could not load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const doctorName = user?.name ?? "Doctor";
  const initials = doctorName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const headerDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const patientName = (a: Appointment) =>
    (a.patientId as any)?.name ?? a.patientName ?? "—";
  const prescriptionPatientName = (p: Prescription) =>
    typeof p.patientId === "object" && p.patientId?.name ? p.patientId.name : "Patient";
  const firstMedicine = (p: Prescription) => p.medicines?.[0]?.name ?? "—";

  const goToNewCase = () => navigation.getParent()?.navigate?.("NewCase");
  const goToPatients = () => navigation.getParent()?.navigate?.("Patients");
  const goToRepertory = () => navigation.getParent()?.navigate?.("Repertory");
  const goToScheduleAppointment = () => navigation.navigate("ScheduleAppointment");

  const totalPatients = stats?.totalPatients ?? 0;
  const todayPatients = stats?.todayPatients ?? 0;
  const totalPrescriptions = stats?.totalPrescriptions ?? 0;
  const pendingAppointments = appointments.filter((a) => a.status === "pending").length;
  const confirmedAppointments = appointments.filter((a) => a.status === "confirmed").length;

  if (loading && !stats && appointments.length === 0 && prescriptions.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingLabel}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.headerName}>{doctorName}</Text>
              <Text style={styles.headerDate}>{headerDate}</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={18} color={colors.accentAlert} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* Stats - compact, premium, trustworthy */}
        <View style={styles.statsSection}>
          <View style={styles.statsSectionHeader}>
            <Text style={styles.statsSectionTitle}>At a glance</Text>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
              <Text style={styles.trustBadgeText}>Live data</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <Ionicons name="people" size={18} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{todayPatients}</Text>
              <Text style={styles.statLabel}>Patients today</Text>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <Ionicons name="people-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{totalPatients}</Text>
              <Text style={styles.statLabel}>Total patients</Text>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{totalPrescriptions}</Text>
              <Text style={styles.statLabel}>Prescriptions</Text>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.statApptRow}>
                <View style={styles.statApptPill}>
                  <View style={styles.statApptDotPending} />
                  <Text style={styles.statApptPillText}>{pendingAppointments} Pending</Text>
                </View>
                <View style={styles.statApptPill}>
                  <View style={styles.statApptDotOk} />
                  <Text style={styles.statApptPillText}>{confirmedAppointments} Confirmed</Text>
                </View>
              </View>
              <Text style={styles.statLabel}>Today&apos;s appointments</Text>
            </Card>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quick actions</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={[styles.quickCard, styles.quickCardPrimary]}
              onPress={goToNewCase}
              activeOpacity={0.8}
            >
              <View style={styles.quickIconWrap}>
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </View>
              <Text style={styles.quickLabel}>New case</Text>
              <Text style={styles.quickHint}>Start consultation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={goToPatients} activeOpacity={0.8}>
              <View style={[styles.quickIconWrap, styles.quickIconMuted]}>
                <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
              </View>
              <Text style={styles.quickLabel}>Patients</Text>
              <Text style={styles.quickHint}>View records</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={goToRepertory} activeOpacity={0.8}>
              <View style={[styles.quickIconWrap, styles.quickIconMuted]}>
                <Ionicons name="book-outline" size={20} color={colors.textSecondary} />
              </View>
              <Text style={styles.quickLabel}>Repertory</Text>
              <Text style={styles.quickHint}>Browse rubrics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={goToScheduleAppointment} activeOpacity={0.8}>
              <View style={[styles.quickIconWrap, styles.quickIconMuted]}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              </View>
              <Text style={styles.quickLabel}>Schedule</Text>
              <Text style={styles.quickHint}>Book appointment</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming today */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Upcoming today</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AppointmentsList")} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>
          {appointments.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={32} color={colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No appointments today</Text>
              <Text style={styles.emptySub}>Schedule one to get started</Text>
              <TouchableOpacity style={styles.emptyCta} onPress={goToScheduleAppointment} activeOpacity={0.8}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyCtaText}>Schedule appointment</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            appointments.slice(0, 5).map((item) => (
              <Card key={item._id} style={styles.apptCard}>
                <View style={styles.apptAvatar}>
                  <Text style={styles.apptAvatarText}>
                    {patientName(item)
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.apptBody}>
                  <Text style={styles.apptName}>{patientName(item)}</Text>
                  <Text style={styles.apptMeta}>{item.notes || item.timeSlot || "—"}</Text>
                </View>
                <View style={styles.apptRight}>
                  <Text style={styles.apptTime}>{item.timeSlot}</Text>
                  <View style={[styles.apptStatus, item.status === "confirmed" ? styles.apptStatusOk : styles.apptStatusPending]}>
                    <Text style={styles.apptStatusText}>{item.status}</Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Recent prescriptions */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent prescriptions</Text>
            <TouchableOpacity onPress={() => navigation.navigate("PrescriptionsList")} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>
          {prescriptions.length === 0 ? (
            <Card style={styles.emptyCardSmall}>
              <Ionicons name="document-text-outline" size={24} color={colors.textTertiary} />
              <Text style={styles.emptySectionText}>No prescriptions yet</Text>
            </Card>
          ) : (
            prescriptions.map((p) => (
              <TouchableOpacity
                key={p._id}
                style={styles.rxCard}
                onPress={() => {
                  const pid = typeof p.patientId === "object" ? (p.patientId as any)?._id : p.patientId;
                  if (pid) {
                    navigation.getParent()?.navigate?.("Patients", {
                      screen: "PatientProfile",
                      params: {
                        patient: {
                          id: pid,
                          name: prescriptionPatientName(p),
                          code: "—",
                          gender: "Unknown",
                          ageLabel: "—",
                        },
                      },
                    });
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.rxIconWrap}>
                  <Ionicons name="medical-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.rxBody}>
                  <Text style={styles.rxTitle}>{firstMedicine(p)}</Text>
                  <Text style={styles.rxSub}>{prescriptionPatientName(p)}</Text>
                </View>
                <Text style={styles.rxTime}>{timeAgo(p.createdAt)}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.legalWrap}>
          <View style={styles.legalRow}>
            <Ionicons name="medical-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.legalText}>
              Clinical decision support only. Prescription responsibility remains with the practitioner. Data handled per applicable regulations.
            </Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={goToNewCase} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const cardShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(11,84,219,0.06)" } as any)
    : {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scroll: {
    paddingHorizontal: layout.spacing,
    paddingTop: Platform.OS === "ios" ? 44 : 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 18,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  greeting: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  headerName: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerDate: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.accentAlert + "14",
    padding: 12,
    borderRadius: layout.radius,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accentAlert + "30",
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  statsSection: {
    marginBottom: 22,
  },
  statsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statsSectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: colors.textTertiary,
    textTransform: "uppercase",
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary + "0C",
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    width: "48%",
    minWidth: "48%",
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statApptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  statApptPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },
  statApptDotPending: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accentAlert,
  },
  statApptDotOk: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accentSuccess,
  },
  statApptPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 22,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: colors.textTertiary,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickCard: {
    width: "48%",
    minWidth: "48%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  quickCardPrimary: {
    borderColor: colors.primary + "35",
    backgroundColor: colors.primary + "08",
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickIconMuted: {
    backgroundColor: colors.secondary,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  quickHint: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    ...cardShadow,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  emptyCardSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    ...cardShadow,
  },
  emptySectionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  apptCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    ...cardShadow,
  },
  apptAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  apptAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  apptBody: {
    flex: 1,
    marginLeft: 12,
  },
  apptName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  apptMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  apptRight: {
    alignItems: "flex-end",
  },
  apptTime: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  apptStatus: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  apptStatusOk: {
    backgroundColor: colors.accentSuccess + "20",
  },
  apptStatusPending: {
    backgroundColor: colors.accentAlert + "20",
  },
  apptStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  rxCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  rxIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + "14",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rxBody: {
    flex: 1,
  },
  rxTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rxSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rxTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  legalWrap: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  legalText: {
    flex: 1,
    fontSize: 11,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: layout.spacing,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...cardShadow,
  },
});
