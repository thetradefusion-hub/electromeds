import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import { typography } from "../../theme/typography";
import { Card } from "../../components/ui/Card";
import { RemedySuggestion, SuggestionResponse } from "../../api/classicalHomeopathy";

type RemedySuggestionsParams = {
  suggestionResponse: SuggestionResponse;
  patientId: string;
  patientName?: string;
};

export default function RemedySuggestionsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RemedySuggestionsParams>, string>>();
  const params = route.params as RemedySuggestionsParams;

  const suggestionResponse = params?.suggestionResponse;
  const patientId = params?.patientId;
  const patientName = params?.patientName ?? "Patient";

  const topRemedies: RemedySuggestion[] =
    suggestionResponse?.suggestions?.topRemedies ?? [];
  const caseRecordId = suggestionResponse?.caseRecordId;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scoreBreakdownId, setScoreBreakdownId] = useState<string | null>(null);

  const handleUseInPrescription = (remedy: RemedySuggestion) => {
    if (!caseRecordId || !patientId) {
      Alert.alert("Error", "Case or patient data missing.");
      return;
    }
    navigation.navigate("PrescriptionBuilder", {
      remedy,
      caseRecordId,
      patientId,
      patientName,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle}>Remedy Suggestions</Text>
          <Text style={styles.headerSub}>Patient: {patientName}</Text>
        </View>
      </View>

      {!suggestionResponse ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No suggestions available.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Engine Summary</Text>
            <Text style={styles.summaryLine}>
              Total remedies:{" "}
              {suggestionResponse.suggestions.summary.totalRemedies}
            </Text>
            <Text style={styles.summaryLine}>
              High confidence:{" "}
              {suggestionResponse.suggestions.summary.highConfidence}
            </Text>
            <Text style={styles.summaryLine}>
              Warnings: {suggestionResponse.suggestions.summary.warnings}
            </Text>
          </Card>

          <Text style={styles.sectionHeader}>TOP MATCHED REMEDIES</Text>

          {topRemedies.length === 0 ? (
            <Text style={styles.emptyText}>No remedies suggested for this case.</Text>
          ) : (
            topRemedies.map((remedy) => {
              const isExpanded = expandedId === remedy.remedy.id;
              const showScoreBreakdown = scoreBreakdownId === remedy.remedy.id;
              return (
                <Card key={remedy.remedy.id} style={styles.remedyCard}>
                  <View style={styles.remedyHeaderRow}>
                    <View>
                      <Text style={styles.remedyName}>{remedy.remedy.name}</Text>
                      <Text style={styles.remedyPotency}>
                        {remedy.suggestedPotency} • {remedy.repetition}
                      </Text>
                    </View>
                    <View style={styles.scorePill}>
                      <Text style={styles.scoreText}>
                        {typeof remedy.matchScore === "number" ? remedy.matchScore.toFixed(1) : remedy.matchScore}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaBadge}>Confidence: {remedy.confidence}</Text>
                    {remedy.repertoryType && (
                      <Text style={styles.metaBadge}>{remedy.repertoryType}</Text>
                    )}
                  </View>

                  <Text style={styles.reasoning} numberOfLines={isExpanded ? 0 : 3}>
                    {remedy.clinicalReasoning}
                  </Text>

                  {/* Score breakdown (match web) */}
                  {remedy.scoreBreakdown && (
                    <View style={styles.breakdownWrap}>
                      <TouchableOpacity
                        style={styles.breakdownToggle}
                        onPress={() => setScoreBreakdownId(showScoreBreakdown ? null : remedy.remedy.id)}
                      >
                        <Text style={styles.breakdownToggleText}>Score breakdown</Text>
                        <Ionicons
                          name={showScoreBreakdown ? "chevron-up" : "chevron-down"}
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                      {showScoreBreakdown && (
                        <View style={styles.breakdownGrid}>
                          <Text style={styles.breakdownLabel}>Base</Text>
                          <Text style={styles.breakdownValue}>{remedy.scoreBreakdown.baseScore.toFixed(1)}</Text>
                          <Text style={styles.breakdownLabel}>Constitution</Text>
                          <Text style={styles.breakdownPlus}>+{remedy.scoreBreakdown.constitutionBonus.toFixed(1)}</Text>
                          <Text style={styles.breakdownLabel}>Modality</Text>
                          <Text style={styles.breakdownPlus}>+{remedy.scoreBreakdown.modalityBonus.toFixed(1)}</Text>
                          <Text style={styles.breakdownLabel}>Pathology</Text>
                          <Text style={styles.breakdownPlus}>+{remedy.scoreBreakdown.pathologySupport.toFixed(1)}</Text>
                          <Text style={styles.breakdownLabel}>Keynote</Text>
                          <Text style={styles.breakdownPlus}>+{remedy.scoreBreakdown.keynoteBonus.toFixed(1)}</Text>
                          <Text style={styles.breakdownLabel}>Coverage</Text>
                          <Text style={styles.breakdownPlus}>+{remedy.scoreBreakdown.coverageBonus.toFixed(1)}</Text>
                          <Text style={styles.breakdownLabel}>Penalty</Text>
                          <Text style={styles.breakdownMinus}>-{remedy.scoreBreakdown.contradictionPenalty.toFixed(1)}</Text>
                          <Text style={[styles.breakdownLabel, styles.breakdownTotal]}>Total</Text>
                          <Text style={[styles.breakdownValue, styles.breakdownTotal]}>{remedy.scoreBreakdown.total.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Matched symptoms (match web) */}
                  {remedy.matchedSymptoms && remedy.matchedSymptoms.length > 0 && (
                    <View style={styles.matchedSection}>
                      <Text style={styles.matchedTitle}>Matched symptoms</Text>
                      <View style={styles.chipWrap}>
                        {remedy.matchedSymptoms.slice(0, 6).map((s, i) => (
                          <View key={i} style={styles.chip}>
                            <Text style={styles.chipText}>{s}</Text>
                          </View>
                        ))}
                        {remedy.matchedSymptoms.length > 6 && (
                          <Text style={styles.chipMore}>+{remedy.matchedSymptoms.length - 6} more</Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Matched rubrics (match web) */}
                  {remedy.matchedRubrics && remedy.matchedRubrics.length > 0 && (
                    <View style={styles.matchedSection}>
                      <Text style={styles.matchedTitle}>Matched rubrics</Text>
                      {remedy.matchedRubrics.slice(0, 4).map((r, i) => (
                        <Text key={i} style={styles.rubricBullet}>• {r}</Text>
                      ))}
                      {remedy.matchedRubrics.length > 4 && (
                        <Text style={styles.rubricMore}>+{remedy.matchedRubrics.length - 4} more</Text>
                      )}
                    </View>
                  )}

                  {/* Warnings (match web) */}
                  {remedy.warnings && remedy.warnings.length > 0 && (
                    <View style={styles.warningBlock}>
                      <Text style={styles.warningBlockTitle}>Warnings</Text>
                      {remedy.warnings.map((w, i) => (
                        <Text key={i} style={styles.warningItem}>• {w.message}</Text>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.useBtn}
                    onPress={() => handleUseInPrescription(remedy)}
                  >
                    <Text style={styles.useBtnText}>Use in prescription</Text>
                    <Ionicons name="chevron-forward" size={18} color="#FFF" />
                  </TouchableOpacity>
                </Card>
              );
            })
          )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: layout.spacing,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    ...typography.h1,
    fontSize: 18,
  },
  headerSub: {
    ...typography.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  scroll: {
    paddingHorizontal: layout.spacing,
    paddingTop: 8,
    paddingBottom: 24,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  summaryLine: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  remedyCard: {
    marginBottom: 12,
  },
  remedyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  remedyName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  remedyPotency: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E1F5FE",
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  metaBadge: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  reasoning: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  warningText: {
    fontSize: 11,
    color: colors.accentAlert,
  },
  chooseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chooseText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  breakdownWrap: {
    marginBottom: 10,
  },
  breakdownToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  breakdownToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  breakdownGrid: {
    marginTop: 6,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  breakdownLabel: {
    width: "50%",
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  breakdownValue: {
    width: "50%",
    fontSize: 11,
    textAlign: "right",
    fontWeight: "600",
    marginBottom: 2,
  },
  breakdownPlus: {
    width: "50%",
    fontSize: 11,
    textAlign: "right",
    color: "#2E7D32",
    marginBottom: 2,
  },
  breakdownMinus: {
    width: "50%",
    fontSize: 11,
    textAlign: "right",
    color: colors.accentAlert,
    marginBottom: 2,
  },
  breakdownTotal: {
    fontWeight: "700",
  },
  matchedSection: {
    marginBottom: 10,
  },
  matchedTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#E0F2F1",
    borderRadius: 6,
  },
  chipText: {
    fontSize: 11,
    color: colors.textPrimary,
  },
  chipMore: {
    fontSize: 11,
    color: colors.textSecondary,
    alignSelf: "center",
  },
  rubricBullet: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
    marginBottom: 2,
  },
  rubricMore: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  warningBlock: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  warningBlockTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E65100",
    marginBottom: 4,
  },
  warningItem: {
    fontSize: 11,
    color: "#BF360C",
    marginBottom: 2,
  },
  useBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  useBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

