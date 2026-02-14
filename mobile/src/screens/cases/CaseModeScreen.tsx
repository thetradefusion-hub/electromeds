import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { layout } from "../../theme/layout";
import { Card } from "../../components/ui/Card";

type CaseModeParams = {
  patientId?: string;
  patientName?: string;
};

export default function CaseModeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, CaseModeParams>, string>>();
  const params = route.params ?? {};
  const patientId = params.patientId;
  const patientName = params.patientName;
  const [mode, setMode] = useState<"Classical" | "Assistive">("Classical");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Case</Text>
          <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
        </View>

        {/* Tabs: Classical / Assistive */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabChip, mode === "Classical" && styles.tabChipActive]}
            onPress={() => setMode("Classical")}
          >
            <Text style={[styles.tabText, mode === "Classical" && styles.tabTextActive]}>Classical</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabChip, mode === "Assistive" && styles.tabChipActive]}
            onPress={() => setMode("Assistive")}
          >
            <Text style={[styles.tabText, mode === "Assistive" && styles.tabTextActive]}>Assistive</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Select Case Taking Mode</Text>
        <Text style={styles.subtitle}>
          Choose the workflow that best fits your clinical approach for this session.
        </Text>

        {/* Manual Mode card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("CaseTaking", {
              patientId,
              patientName,
            })
          }
        >
          <Card style={styles.modeCard}>
            <View style={styles.modeIconWrap}>
              <Ionicons name="list-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.modeContent}>
              <Text style={styles.modeTitle}>Manual Mode</Text>
              <Text style={styles.modeBody}>
                Traditional repertorization. Search and select rubrics manually from the complete homeopathic
                repertory.
              </Text>
              <View style={styles.tagRow}>
                <View style={styles.tagChip}>
                  <Text style={styles.tagText}>Pro Precision</Text>
                </View>
                <View style={styles.tagChip}>
                  <Text style={styles.tagText}>Classical</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Card>
        </TouchableOpacity>

        {/* AI-Enhanced Mode card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("CaseTakingVoice", {
              patientId,
              patientName,
            })
          }
        >
          <Card style={[styles.modeCard, styles.aiCard]}>
            <View style={styles.modeIconWrap}>
              <Ionicons name="sparkles-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.modeContent}>
              <View style={styles.modeHeaderRow}>
                <Text style={styles.modeTitle}>AI-Enhanced Mode</Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
              </View>
              <Text style={styles.modeBody}>
                Intelligent clinical assistance. Convert patient narratives and notes into suggested rubrics
                instantly.
              </Text>
              <View style={styles.tagRow}>
                <View style={styles.tagChip}>
                  <Text style={styles.tagText}>Efficient</Text>
                </View>
                <View style={styles.tagChip}>
                  <Text style={styles.tagText}>Narrative Input</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </Card>
        </TouchableOpacity>

        {/* HIPAA bar */}
        <View style={styles.hipaaRow}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.hipaaText}>HIPAA Compliant & Encrypted</Text>
        </View>

        {/* Clinical Tip */}
        <Card style={styles.tipCard}>
          <Text style={styles.tipTitle}>Clinical Tip</Text>
          <Text style={styles.tipText}>
            AI-Enhanced mode is best for acute cases or complex narrative-heavy consultations. Manual mode is
            preferred for chronic follow-ups.
          </Text>
        </Card>
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#E0E0E0",
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
  },
  tabChip: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabChipActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  title: {
    ...typography.h1,
    fontSize: 20,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    marginBottom: 16,
  },
  aiCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  modeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0F7FA",
    alignItems: "center",
    justifyContent: "center",
  },
  modeContent: {
    flex: 1,
  },
  modeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modeBody: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E0F2F1",
  },
  tagText: {
    fontSize: 11,
    color: colors.textPrimary,
  },
  recommendedBadge: {
    borderRadius: 999,
    backgroundColor: "#E1F5FE",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  hipaaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 16,
    gap: 6,
  },
  hipaaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tipCard: {
    backgroundColor: "#E3F2FD",
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

