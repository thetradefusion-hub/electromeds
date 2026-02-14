import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { layout } from "../../theme/layout";
import { Card } from "../../components/ui/Card";
import {
  StructuredCaseInput,
  SuggestionResponse,
  fetchPatientCaseRecords,
} from "../../api/classicalHomeopathy";
import { suggestRubrics, type RubricSuggestion } from "../../api/aiCaseTaking";
import { useRuleEngineModal } from "../../context/RuleEngineModalContext";

const TABS = ["Mental", "Physical General", "Particulars", "Modalities"] as const;
type RubricSection = (typeof TABS)[number];

const SECTION_INFO: Record<RubricSection, { title: string; description: string }> = {
  Mental: {
    title: "Mental",
    description: "Mental state, emotions, fears. Add symptoms like: anxiety, grief, fear of dark, irritability, restlessness, confusion, sadness.",
  },
  "Physical General": {
    title: "Physical General",
    description: "General body symptoms. Add: appetite, thirst, thermals, sleep, digestion, energy. E.g. thirstless, desire cold drinks, worse in morning.",
  },
  Particulars: {
    title: "Particulars",
    description: "Location & sensation. Add where and how: e.g. headache in forehead, burning pain in stomach, rash on chest, pain stitching right side.",
  },
  Modalities: {
    title: "Modalities",
    description: "Better / worse. Add what improves or aggravates: time, position, weather, food. E.g. better in open air, worse at night, better from rest.",
  },
};

type Rubric = {
  id: string;
  title: string;
  path: string;
  intensity: number;
  section: RubricSection;
};

const initialSelected: Rubric[] = [];

/** Map legacy section names to current 4 sections so old rubrics still show. */
function normalizeSection(section: string): RubricSection {
  if (section === "Mind") return "Mental";
  if (section === "Physical Generals") return "Physical General";
  if (section === "Particulars") return "Particulars";
  if (section === "Modalities") return "Modalities";
  if (section === "Sleep" || section === "Digestion") return "Physical General";
  return "Mental";
}

function tabToCategory(tab: RubricSection): "mental" | "general" | "particular" | "modality" {
  if (tab === "Mental") return "mental";
  if (tab === "Particulars") return "particular";
  if (tab === "Modalities") return "modality";
  return "general";
}

type CaseTakingParams = {
  patientId?: string;
  patientName?: string;
};

export default function CaseTakingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, CaseTakingParams>, string>>();
  const params = route.params ?? {};
  const patientId = params.patientId;
  const patientName = params.patientName ?? "Patient";

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Mental");
  const [selectedRubrics, setSelectedRubrics] = useState<Rubric[]>(initialSelected);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rubricSearchResults, setRubricSearchResults] = useState<RubricSuggestion[]>([]);
  const [searchingRubrics, setSearchingRubrics] = useState(false);
  const [selectedRepertoryRubrics, setSelectedRepertoryRubrics] = useState<Array<{ rubricId: string; rubricText: string; repertoryType: string }>>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const { openRuleEngineModal } = useRuleEngineModal();

  const clearAll = () => setSelectedRubrics([]);

  const searchRubrics = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setSearchingRubrics(true);
    setRubricSearchResults([]);
    try {
      const { rubrics, rareRubrics } = await suggestRubrics({
        symptom: { symptomName: q, category: tabToCategory(activeTab) },
        repertoryType: "publicum",
      });
      setRubricSearchResults([...rubrics, ...rareRubrics].slice(0, 20));
    } catch (e: any) {
      Alert.alert("Search failed", e?.message || "Could not search rubrics.");
    } finally {
      setSearchingRubrics(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setRubricSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchRubrics(trimmed);
    }, 400);
  };

  const addRepertoryRubric = (r: RubricSuggestion) => {
    if (selectedRepertoryRubrics.some((x) => x.rubricId === r.rubricId)) return;
    setSelectedRepertoryRubrics((prev) => [...prev, { rubricId: r.rubricId, rubricText: r.rubricText, repertoryType: r.repertoryType }]);
    // Also add to sectioned case so it appears in "YOUR CASE BY SECTION" with current tab as section
    const sectionRubric: Rubric = {
      id: r.rubricId,
      title: r.rubricText,
      path: r.repertoryType,
      intensity: 60,
      section: activeTab,
    };
    if (!selectedRubrics.some((x) => x.id === r.rubricId)) {
      setSelectedRubrics((prev) => [...prev, sectionRubric]);
    }
  };

  const removeRepertoryRubric = (rubricId: string) => {
    setSelectedRepertoryRubrics((prev) => prev.filter((x) => x.rubricId !== rubricId));
    setSelectedRubrics((prev) => prev.filter((r) => r.id !== rubricId));
  };

  const addRubric = (r: Rubric, sectionOverride?: RubricSection) => {
    const newRubric: Rubric = sectionOverride ? { ...r, section: sectionOverride } : r;
    if (selectedRubrics.find((x) => x.id === newRubric.id)) return;
    setSelectedRubrics((prev) => [...prev, newRubric]);
  };

  const removeRubric = (id: string) => {
    setSelectedRubrics((prev) => prev.filter((r) => r.id !== id));
    setSelectedRepertoryRubrics((prev) => prev.filter((x) => x.rubricId !== id));
  };

  const updateRubricIntensity = (id: string, intensity: number) => {
    setSelectedRubrics((prev) =>
      prev.map((r) => (r.id === id ? { ...r, intensity } : r))
    );
  };

  const clearSection = (section: RubricSection) => {
    const idsInSection = new Set(selectedRubrics.filter((r) => normalizeSection(r.section) === section).map((r) => r.id));
    setSelectedRubrics((prev) => prev.filter((r) => normalizeSection(r.section) !== section));
    setSelectedRepertoryRubrics((prev) => prev.filter((x) => !idsInSection.has(x.rubricId)));
  };

  const toggleSectionCollapsed = (section: RubricSection) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const SECTION_ORDER: RubricSection[] = ["Mental", "Physical General", "Particulars", "Modalities"];
  const rubricsBySection = SECTION_ORDER.reduce<Record<RubricSection, Rubric[]>>(
    (acc, sec) => {
      acc[sec] = selectedRubrics.filter((r) => normalizeSection(r.section) === sec);
      return acc;
    },
    {} as Record<RubricSection, Rubric[]>
  );

  const showSectionInfo = (section: RubricSection) => {
    const info = SECTION_INFO[section];
    Alert.alert(info.title, info.description, [{ text: "OK" }]);
  };

  const INTENSITY_PRESETS = [20, 40, 60, 80, 100] as const;

  const mapWeight = (intensity: number): number => {
    if (intensity >= 70) return 3;
    if (intensity >= 50) return 2;
    return 1;
  };

  const isModalityRubric = (r: Rubric): boolean => {
    const sec = normalizeSection(r.section);
    if (sec === "Modalities") return true;
    const text = `${r.title} ${r.path}`.toLowerCase();
    if (text.includes("amel") || text.includes("better")) return true;
    if (text.includes("agg") || text.includes("worse")) return true;
    return false;
  };

  const inferModalityType = (r: Rubric): "better" | "worse" => {
    const text = `${r.title} ${r.path}`.toLowerCase();
    if (text.includes("amel") || text.includes("better")) return "better";
    return "worse";
  };

  const buildStructuredCase = (): StructuredCaseInput => {
    const mental = selectedRubrics
      .filter((r) => normalizeSection(r.section) === "Mental")
      .map((r) => ({
        symptomText: r.title,
        weight: mapWeight(r.intensity),
      }));

    const generals = selectedRubrics
      .filter((r) => normalizeSection(r.section) === "Physical General")
      .map((r) => ({
        symptomText: r.title,
        weight: mapWeight(r.intensity),
      }));

    const particulars = selectedRubrics
      .filter((r) => normalizeSection(r.section) === "Particulars")
      .map((r) => ({
        symptomText: r.title,
        weight: mapWeight(r.intensity),
      }));

    const modalities = selectedRubrics
      .filter(isModalityRubric)
      .map((r) => ({
        symptomText: r.title,
        type: inferModalityType(r),
        weight: mapWeight(r.intensity),
      }));

    return {
      mental,
      generals,
      particulars,
      modalities,
      pathologyTags: [],
    };
  };

  const handleCheckCompleteness = () => {
    if (selectedRubrics.length === 0 && selectedRepertoryRubrics.length === 0) {
      Alert.alert("Empty Case", "Add rubrics/symptoms first, then check completeness.");
      return;
    }
    let structuredCase = buildStructuredCase();
    if (selectedRubrics.length === 0 && selectedRepertoryRubrics.length > 0) {
      structuredCase = {
        mental: [{ symptomText: "Repertory-based case", weight: 1 }],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
      };
    }
    navigation.navigate("CaseCompleteness", {
      structuredCase,
      patientName: params?.patientName,
    });
  };

  const handleSaveAndRepertorize = async () => {
    if (!patientId) {
      Alert.alert(
        "Patient not linked",
        "Please start a new case from a patient profile so the case can be linked correctly."
      );
      return;
    }

    if (selectedRubrics.length === 0 && selectedRepertoryRubrics.length === 0) {
      Alert.alert("No rubrics selected", "Add symptoms/rubrics or search repertory rubrics before repertorizing.");
      return;
    }

    setSubmitting(true);
    try {
      let structuredCase = buildStructuredCase();
      if (selectedRubrics.length === 0 && selectedRepertoryRubrics.length > 0) {
        structuredCase = {
          mental: [{ symptomText: "Repertory-based case", weight: 1 }],
          generals: [],
          particulars: [],
          modalities: [],
          pathologyTags: [],
        };
      }
      let patientHistory: Array<{ remedyId: string; date: string }> | undefined;
      try {
        const records = await fetchPatientCaseRecords(patientId);
        const withRemedy = records.filter((r) => r.finalRemedy?.remedyId);
        if (withRemedy.length > 0) {
          patientHistory = withRemedy.map((r) => ({
            remedyId: r.finalRemedy!.remedyId,
            date: r.updatedAt || r.createdAt || new Date().toISOString(),
          }));
        }
      } catch (_) {}
      const selectedRubricIds = selectedRepertoryRubrics.length > 0 ? selectedRepertoryRubrics.map((r) => r.rubricId) : undefined;
      openRuleEngineModal({
        patientId,
        patientName,
        structuredCase,
        patientHistory,
        selectedRubricIds,
        onSuccess: handleRuleEngineSuccess,
        onError: handleRuleEngineError,
      });
    } catch (e) {
      Alert.alert("Error", "Could not prepare case. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRuleEngineSuccess = (response: SuggestionResponse) => {
    if (patientId) {
      navigation.navigate("RemedySuggestions", {
        suggestionResponse: response,
        patientId,
        patientName,
      });
    }
  };

  const handleRuleEngineError = (error: any) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unable to get remedy suggestions. Please try again.";
    Alert.alert("Error", message);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {!patientId && (
          <Card style={styles.bannerCard}>
            <Text style={styles.bannerText}>
              To save & repertorize: go to Patients → select a patient → Consult Now → Manual Mode.
            </Text>
          </Card>
        )}

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Classical Case Taking</Text>
            <Text style={styles.headerSub}>
              {patientId ? `Patient: ${patientName}` : "No patient linked"}
            </Text>
          </View>
          <Text style={styles.draftBadge}>DRAFT</Text>
        </View>

        {/* Tabs with info */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <View key={tab} style={styles.tabItemWrap}>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]} numberOfLines={1}>{tab}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tabInfoBtn}
                onPress={() => showSectionInfo(tab)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Selected repertory rubrics – above search so they stay visible when results are long */}
        {selectedRepertoryRubrics.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>SELECTED REPERTORY RUBRICS ({selectedRepertoryRubrics.length})</Text>
            <View style={styles.selectedRepertoryChunk}>
              {selectedRepertoryRubrics.map((r) => (
                <Card key={r.rubricId} style={styles.rubricCard}>
                  <View style={styles.rubricRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rubricTitle} numberOfLines={2}>{r.rubricText}</Text>
                      <Text style={styles.rubricPath}>{r.repertoryType}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeRepertoryRubric(r.rubricId)}>
                      <Ionicons name="close" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}

        {/* Repertory rubric search */}
        <Text style={styles.sectionHeader}>SEARCH REPERTORY RUBRICS</Text>
        <Text style={styles.searchHint}>Type 2+ characters – suggestions appear below. Current tab sets section (Mental / Physical General / Particulars / Modalities).</Text>
        <View style={styles.searchWrapper}>
          <View style={styles.searchIconWrap}>
            <Ionicons name="search" size={20} color={colors.primary} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. Anxiety, Fear dark, Fever chest..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            underlineColorAndroid="transparent"
            selectionColor={colors.primary}
          />
          {searchingRubrics ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />
          ) : null}
        </View>
        {rubricSearchResults.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { marginTop: 8 }]}>REPERTORY RESULTS</Text>
            {rubricSearchResults.slice(0, 10).map((r) => {
              const isSelected = selectedRepertoryRubrics.some((x) => x.rubricId === r.rubricId);
              return (
                <Card key={r.rubricId} style={[styles.resultCard, isSelected && styles.resultCardSelected]}>
                  <View style={styles.resultRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rubricTitle}>{r.rubricText}</Text>
                      <Text style={styles.rubricPath}>{r.repertoryType} • {r.confidence}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => (isSelected ? removeRepertoryRubric(r.rubricId) : addRepertoryRubric(r))}
                      style={styles.resultActionBtn}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={26} color="#2E7D32" />
                      ) : (
                        <Ionicons name="add-circle" size={26} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {/* Selected symptom rubrics – grouped by section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>YOUR CASE BY SECTION</Text>
          {selectedRubrics.length > 0 && (
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clearAll}>CLEAR ALL</Text>
            </TouchableOpacity>
          )}
        </View>

        {SECTION_ORDER.map((section) => {
          const rubrics = rubricsBySection[section];
          if (rubrics.length === 0) return null;
          const isCollapsed = collapsedSections[section];

          return (
            <View key={section} style={styles.sectionBlock}>
              <TouchableOpacity
                style={styles.sectionBlockHeader}
                onPress={() => toggleSectionCollapsed(section)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionBlockTitleRow}>
                  <Ionicons
                    name={isCollapsed ? "chevron-forward" : "chevron-down"}
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.sectionBlockTitle}>{section}</Text>
                  <View style={styles.sectionCountBadge}>
                    <Text style={styles.sectionCountText}>{rubrics.length}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    clearSection(section);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.sectionClearText}>Clear</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {!isCollapsed &&
                rubrics.map((rubric) => (
                  <Card key={rubric.id} style={styles.rubricCard}>
                    <View style={styles.rubricRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rubricTitle}>{rubric.title}</Text>
                        <Text style={styles.rubricPath}>{rubric.path}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeRubric(rubric.id)}
                        style={styles.removeBtn}
                      >
                        <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.intensitySection}>
                      <Text style={styles.intensityLabel}>Intensity</Text>
                      <View style={styles.intensityPills}>
                        {INTENSITY_PRESETS.map((val) => (
                          <TouchableOpacity
                            key={val}
                            style={[
                              styles.intensityPill,
                              rubric.intensity === val && styles.intensityPillActive,
                            ]}
                            onPress={() => updateRubricIntensity(rubric.id, val)}
                          >
                            <Text
                              style={[
                                styles.intensityPillText,
                                rubric.intensity === val && styles.intensityPillTextActive,
                              ]}
                            >
                              {val}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.intensityBarWrap}>
                        <View style={styles.intensityBar}>
                          <View
                            style={[
                              styles.intensityFill,
                              { width: `${rubric.intensity}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.intensityValue}>{rubric.intensity}%</Text>
                      </View>
                    </View>
                  </Card>
                ))}
            </View>
          );
        })}

        {selectedRubrics.length === 0 && (
          <Text style={styles.emptySectionText}>
            Search repertory above and tap + on results to add rubrics. They will appear here by section (Mental, Physical General, Particulars, Modalities) based on the active tab when you add them. Tap the (i) on each tab to see what to add.
          </Text>
        )}

        {/* Case Completeness Button */}
        {(selectedRubrics.length > 0 || selectedRepertoryRubrics.length > 0) && (
          <TouchableOpacity style={styles.completenessBtn} onPress={handleCheckCompleteness} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.completenessBtnText}>Check Case Completeness</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={[styles.footerBtn, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={handleSaveAndRepertorize}
        >
          <Text style={styles.footerBtnText}>
            {submitting ? "PREPARING..." : "SAVE CASE & REPERTORIZE"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rule Engine processing modal – shows 5 steps then navigates to remedy suggestions */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bannerCard: {
    marginBottom: 12,
    backgroundColor: "#FFF3E0",
  },
  bannerText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: layout.spacing,
    paddingTop: 16,
    paddingBottom: 96,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerBackBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  draftBadge: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  tabItemWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabInfoBtn: {
    padding: 4,
  },
  tabText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  selectedRepertoryChunk: {
    marginBottom: 16,
  },
  searchHint: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 8,
    lineHeight: 14,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIconWrap: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  searchLoader: {
    marginLeft: 4,
  },
  searchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
  },
  searchBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  clearAll: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  rubricCard: {
    marginBottom: 8,
  },
  rubricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  rubricTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rubricPath: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  intensityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  intensityLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  intensityBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E0E0E0",
    overflow: "hidden",
  },
  intensityFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  intensityValue: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionBlockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionBlockTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionBlockTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sectionCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFF",
  },
  sectionClearText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  removeBtn: {
    padding: 4,
  },
  intensitySection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  intensityPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  intensityPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  intensityPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  intensityPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  intensityPillTextActive: {
    color: "#FFF",
  },
  intensityBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptySectionText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  resultCard: {
    marginTop: 8,
  },
  resultCardSelected: {
    borderColor: "#C8E6C9",
    borderWidth: 1,
    backgroundColor: "#F1F8E9",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultActionBtn: {
    padding: 4,
  },
  footerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.spacing,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBtn: {
    borderRadius: 24,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: "center",
  },
  completenessBtn: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...(Platform.OS === "web" ? { boxShadow: "0 2px 4px rgba(11,84,219,0.1)" as any } : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }),
  },
  completenessBtnText: { fontSize: 14, fontWeight: "600", color: colors.primary },
  footerBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
