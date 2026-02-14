import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";

function getInitials(name: string | undefined): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Are you sure you want to log out?")) {
        logout();
      }
      return;
    }
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log out", style: "destructive", onPress: () => logout() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Profile, clinic & preferences
          </Text>
        </View>

        {/* Profile hero */}
        <View style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name ?? "Doctor"}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? "—"}</Text>
          {user?.role ? (
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{user.role}</Text>
            </View>
          ) : null}
        </View>

        {/* Profile & account card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Profile & account</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Your account details may appear on patient-facing documents.
          </Text>
          <View style={styles.fieldList}>
            <View style={[styles.fieldRow, styles.fieldRowFirst]}>
              <Ionicons name="person-circle-outline" size={18} color={colors.textTertiary} />
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.fieldValue}>{user?.name ?? "—"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textTertiary} />
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>{user?.email ?? "—"}</Text>
            </View>
            <View style={[styles.fieldRow, styles.fieldRowLast]}>
              <Ionicons name="business-outline" size={18} color={colors.textTertiary} />
              <Text style={styles.fieldLabel}>Clinic</Text>
              <Text style={styles.fieldValue}>Homeolytics</Text>
            </View>
          </View>
        </Card>

        {/* Clinic branding */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Clinic branding</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Logo, colors and letterhead for prescriptions and reports.
          </Text>
          <View style={styles.fieldList}>
            <View style={[styles.fieldRow, styles.fieldRowFirst]}>
              <Ionicons name="image-outline" size={18} color={colors.textTertiary} />
              <Text style={styles.fieldLabel}>Logo</Text>
              <Text style={styles.fieldValueMuted}>Not uploaded</Text>
            </View>
            <View style={[styles.fieldRow, styles.fieldRowLast]}>
              <Ionicons name="document-text-outline" size={18} color={colors.textTertiary} />
              <Text style={styles.fieldLabel}>Letterhead</Text>
              <Text style={styles.fieldValue}>Default</Text>
            </View>
          </View>
        </Card>

        {/* Privacy & compliance */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Privacy & compliance</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Patient data is stored and processed with security best practices. Final responsibility remains with the practitioner.
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="lock-closed-outline" size={12} color={colors.primary} />
              <Text style={styles.badgeText}>Encrypted</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="key-outline" size={12} color={colors.primary} />
              <Text style={styles.badgeText}>Role-based</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="list-outline" size={12} color={colors.primary} />
              <Text style={styles.badgeText}>Audit log</Text>
            </View>
          </View>
        </Card>

        {/* Design system */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="brush-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Design system</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Consistent visuals across app, web and PDFs: primary blue, clean typography and professional layouts.
          </Text>
        </Card>

        {/* Log out */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.accentAlert} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Homeolytics · Where homeopathy meets intelligence</Text>
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
  scroll: {
    paddingHorizontal: layout.spacing,
    paddingTop: Platform.OS === "ios" ? 44 : 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  profileHero: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: layout.radius,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === "web" ? { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" as any } : layout.shadow),
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  rolePill: {
    backgroundColor: colors.primary + "18",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    textTransform: "capitalize",
  },
  sectionCard: {
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  fieldList: {
    gap: 2,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fieldRowFirst: {
    borderTopWidth: 0,
  },
  fieldRowLast: {
    paddingBottom: 0,
  },
  fieldLabel: {
    flex: 0,
    width: 72,
    fontSize: 13,
    color: colors.textSecondary,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    textAlign: "right",
  },
  fieldValueMuted: {
    flex: 1,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: "right",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary + "12",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentAlert + "50",
    backgroundColor: colors.accentAlert + "08",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.accentAlert,
  },
  footer: {
    alignItems: "center",
    marginTop: 28,
  },
  footerText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});
