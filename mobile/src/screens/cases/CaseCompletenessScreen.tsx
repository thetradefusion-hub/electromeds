import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import type { StructuredCaseInput } from "../../api/classicalHomeopathy";
import {
  analyzeCompleteness,
  type CompletenessAnalysis,
  type MissingDomain,
} from "../../api/aiCaseTaking";

type CaseCompletenessParams = {
  structuredCase: StructuredCaseInput;
  patientName?: string;
};

type RouteParams = RouteProp<Record<string, CaseCompletenessParams>, string>;

const MIN_RECOMMENDED_SCORE = 80;

export default function CaseCompletenessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const params = route.params as CaseCompletenessParams | undefined;

  const structuredCase = params?.structuredCase;
  const patientName = params?.patientName ?? "Patient";

  const [analysis, setAnalysis] = useState<CompletenessAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!structuredCase) {
      setError("No case data available. Build a case structure first.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await analyzeCompleteness(structuredCase);
      setAnalysis(result);
    } catch (e: any) {
      setError(
        e?.message || "Failed to analyze case completeness. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const score = analysis?.completenessScore ?? 0;

  const getScoreLabel = (value: number) => {
    if (value >= 80) return "Complete";
    if (value >= 60) return "Good Detail";
    if (value >= 40) return "Fair Detail";
    return "Incomplete";
  };

  const getScoreTone = (value: number): "success" | "warning" | "danger" => {
    if (value >= 80) return "success";
    if (value >= 60) return "warning";
    return "danger";
  };

  const scoreLabel = getScoreLabel(score);
  const scoreTone = getScoreTone(score);

  const isDomainMissing = (id: string) =>
    analysis?.missingDomains.some((d) => d.domain === id) ?? false;

  const findMissingDomain = (id: string): MissingDomain | undefined =>
    analysis?.missingDomains.find((d) => d.domain === id);

  // Derive bullets from structured case for section-wise readiness
  const mindBullets = (structuredCase?.mental ?? []).map((m) => m.symptomText);
  const generalBullets = (structuredCase?.generals ?? []).map(
    (g) => g.symptomText
  );

  const hasThermalMissing = isDomainMissing("thermal");
  const hasAppetiteMissing = isDomainMissing("appetite");

  const doctorTip =
    hasThermalMissing || hasAppetiteMissing
      ? "Completing the Physical Generals (Thermal/Thirst) significantly improves repertory accuracy."
      : "Adding well-described generals and modalities will improve repertory accuracy.";

  const handleProceed = () => {
    // For now, simply go back to the previous screen where the doctor can continue to repertorization.
    navigation.goBack();
  };

  if (!structuredCase) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Case Completeness</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centerEmpty}>
          <Text style={styles.emptyTitle}>No case structure yet</Text>
          <Text style={styles.emptySubtitle}>
            Build a case structure first, then open Case Completeness to see
            readiness and tips.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Case Completeness</Text>
          <Text style={styles.headerSub}>{patientName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={runAnalysis}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={loading}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={Platform.OS === "ios" ? "ellipsis-horizontal" : "ellipsis-vertical"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !analysis ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing case completeness…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Score Card */}
          <View style={styles.scoreCard}>
            <View style={styles.progressCircleWrapper}>
              <View style={styles.progressCircleOuter}>
                <View style={styles.progressCircleInner}>
                  <Text style={styles.progressPercent}>{score}%</Text>
                  <Text style={styles.progressLabel}>COMPLETENESS</Text>
                </View>
              </View>
            </View>
            <View style={styles.scoreMeta}>
              <View
                style={[
                  styles.scoreChip,
                  scoreTone === "success" && styles.scoreChipSuccess,
                  scoreTone === "warning" && styles.scoreChipWarning,
                  scoreTone === "danger" && styles.scoreChipDanger,
                ]}
              >
                <Ionicons
                  name={
                    scoreTone === "success"
                      ? "checkmark-circle"
                      : scoreTone === "warning"
                      ? "alert-circle"
                      : "alert-circle"
                  }
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.scoreChipText}>{scoreLabel}</Text>
              </View>
              <Text style={styles.recommendText}>
                Recommended: {MIN_RECOMMENDED_SCORE}% for repertorization
              </Text>
            </View>
          </View>

          {/* Strengths / Warnings */}
          {analysis && (
            <View style={styles.summaryCard}>
              {analysis.strengths.length > 0 && (
                <View style={styles.summaryBlock}>
                  <View style={styles.summaryHeaderRow}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={colors.accentSuccess}
                    />
                    <Text style={styles.summaryTitle}>Strengths</Text>
                  </View>
                  {analysis.strengths.map((item, idx) => (
                    <Text key={idx} style={styles.summaryItem}>
                      • {item}
                    </Text>
                  ))}
                </View>
              )}
              {analysis.warnings.length > 0 && (
                <View style={styles.warningBlock}>
                  <View style={styles.summaryHeaderRow}>
                    <Ionicons
                      name="warning-outline"
                      size={18}
                      color={colors.accentAlert}
                    />
                    <Text style={styles.warningTitle}>Critical Warnings</Text>
                  </View>
                  {analysis.warnings.map((item, idx) => (
                    <Text key={idx} style={styles.warningItem}>
                      • {item}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Section-wise readiness */}
          <Text style={styles.sectionHeading}>SECTION-WISE READINESS</Text>

          <SectionCard
            title="Mind"
            subtitle={
              isDomainMissing("mental")
                ? "Core mental picture incomplete"
                : "Strong emotional triggers recorded"
            }
            iconName={isDomainMissing("mental") ? "alert-circle" : "checkmark-circle"}
            iconColor={
              isDomainMissing("mental") ? colors.accentAlert : colors.accentSuccess
            }
            bullets={
              mindBullets.length > 0
                ? mindBullets.slice(0, 3)
                : ["No mental symptoms recorded yet."]
            }
            missingNote={findMissingDomain("mental")?.description}
          />

          <SectionCard
            title="Physical Generals"
            subtitle={
              hasThermalMissing || hasAppetiteMissing
                ? "Thermal & thirst details missing"
                : "Key generals recorded"
            }
            iconName={
              hasThermalMissing || hasAppetiteMissing
                ? "alert-circle"
                : "checkmark-circle"
            }
            iconColor={
              hasThermalMissing || hasAppetiteMissing
                ? colors.accentAlert
                : colors.accentSuccess
            }
            bullets={
              generalBullets.length > 0
                ? generalBullets.slice(0, 3)
                : ["No physical generals recorded yet."]
            }
            missingNote={
              hasThermalMissing || hasAppetiteMissing
                ? "Add thermal reaction (hot/chilly) and appetite/thirst for better repertory accuracy."
                : undefined
            }
          />

          {/* Validation / Threshold */}
          <View style={styles.validationRow}>
            <Text style={styles.validationLabel}>Validation Status</Text>
            <View style={styles.validationPill}>
              <View style={styles.validationDot} />
              <Text style={styles.validationText}>
                Minimum {MIN_RECOMMENDED_SCORE}% suggested
              </Text>
            </View>
          </View>

          {/* Doctor's Tip */}
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb-outline" size={18} color={colors.primary} />
              <Text style={styles.tipTitle}>Doctor&apos;s Tip</Text>
            </View>
            <Text style={styles.tipBody}>{doctorTip}</Text>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={16} color={colors.accentAlert} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Bottom CTA */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={[
            styles.proceedBtn,
            score < MIN_RECOMMENDED_SCORE && styles.proceedBtnWarning,
          ]}
          onPress={handleProceed}
          activeOpacity={0.85}
        >
          <Text style={styles.proceedText}>Proceed to Repertorization</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

type SectionCardProps = {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bullets: string[];
  missingNote?: string;
};

function SectionCard({
  title,
  subtitle,
  iconName,
  iconColor,
  bullets,
  missingNote,
}: SectionCardProps) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.sectionBody}>
        {bullets.map((b, idx) => (
          <Text key={`${title}-${idx}`} style={styles.sectionBullet}>
            • {b}
          </Text>
        ))}
        {missingNote && (
          <Text style={styles.sectionMissing}>Missing: {missingNote}</Text>
        )}
      </View>
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
    paddingTop: Platform.OS === "ios" ? 52 : 24,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(15,23,42,0.08)" as any }
      : layout.shadow),
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.spacing,
    paddingBottom: 24,
  },
  scoreCard: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 20px rgba(15,23,42,0.08)" as any }
      : layout.shadow),
    flexDirection: "row",
    alignItems: "center",
  },
  progressCircleWrapper: {
    paddingRight: 16,
  },
  progressCircleOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 8,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5EDFF",
  },
  progressCircleInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  scoreMeta: {
    flex: 1,
    justifyContent: "center",
  },
  scoreChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
  },
  scoreChipSuccess: {
    backgroundColor: "#16A34A",
  },
  scoreChipWarning: {
    backgroundColor: "#F59E0B",
  },
  scoreChipDanger: {
    backgroundColor: "#DC2626",
  },
  scoreChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  recommendText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryBlock: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  warningBlock: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  summaryItem: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B91C1C",
  },
  warningItem: {
    fontSize: 12,
    color: "#B91C1C",
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.surface,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 4px rgba(15,23,42,0.06)" as any }
      : layout.shadow),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionBody: {
    paddingLeft: 4,
  },
  sectionBullet: {
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionMissing: {
    fontSize: 12,
    color: colors.accentAlert,
    marginTop: 6,
  },
  validationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 8,
  },
  validationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  validationPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFF7ED",
  },
  validationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentAlert,
    marginRight: 6,
  },
  validationText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.accentAlert,
  },
  tipCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  tipBody: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#B91C1C",
    flex: 1,
  },
  footerBar: {
    paddingHorizontal: layout.spacing,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  proceedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    gap: 8,
  },
  proceedBtnWarning: {
    backgroundColor: "#4F46E5",
  },
  proceedText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
  },
  centerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: layout.spacing,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

