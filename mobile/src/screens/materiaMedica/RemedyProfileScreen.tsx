import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import { getRemedyProfile, type RemedyProfile as RemedyProfileType } from "../../api/classicalHomeopathy";

type RouteParams = RouteProp<{ params: { remedyId: string; remedyName?: string } }, "params">;

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name={icon} size={20} color={colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={22} color={colors.textSecondary} />
      </TouchableOpacity>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

export default function RemedyProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const remedyId = (route.params as any)?.remedyId;
  const remedyNameParam = (route.params as any)?.remedyName;

  const [profile, setProfile] = useState<RemedyProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInProfile, setSearchInProfile] = useState("");
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!remedyId) {
      setError("Remedy ID missing");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRemedyProfile(remedyId);
        if (!cancelled) setProfile(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [remedyId]);

  const filterText = searchInProfile.trim().toLowerCase();
  const matchesSearch = (text: string) => !filterText || text.toLowerCase().includes(filterText);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Generating remedy profile...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.accentAlert} />
        <Text style={styles.errorText}>{error || "Profile not found"}</Text>
        <TouchableOpacity style={styles.backBtnFull} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>REMEDY PROFILE</Text>
          <Text style={styles.headerSubtitle}>{profile.abbreviation || profile.remedyName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setBookmarked(!bookmarked)} style={styles.iconBtn}>
            <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={22} color={bookmarked ? colors.primary : colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.remedyName}>{profile.remedyName}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profile.abbreviation}</Text>
          </View>
          <Text style={styles.commonName}>{profile.commonName} • {profile.family}</Text>
        </View>

        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search symptoms in this profile..."
            placeholderTextColor={colors.textTertiary}
            value={searchInProfile}
            onChangeText={setSearchInProfile}
          />
        </View>

        {profile.quickHighlights?.length > 0 && (
          <View style={styles.highlightsBox}>
            <View style={styles.highlightsTitleRow}>
              <Ionicons name="flash-outline" size={20} color={colors.primary} />
              <Text style={styles.highlightsTitle}>QUICK HIGHLIGHTS</Text>
            </View>
            {profile.quickHighlights.map((line, i) => (
              <Text key={i} style={styles.highlightBullet}>• {line}</Text>
            ))}
          </View>
        )}

        {profile.mind && (matchesSearch(profile.mind.description) || profile.mind.keyTraits?.some(matchesSearch)) && (
          <CollapsibleSection title="Mind" icon="bulb-outline" defaultOpen={true}>
            <Text style={styles.para}>{profile.mind.description}</Text>
            {profile.mind.keyTraits?.length > 0 && (
              <>
                <Text style={styles.keyTraitsLabel}>Key Traits</Text>
                <Text style={styles.para}>{profile.mind.keyTraits.join(" ")}</Text>
              </>
            )}
          </CollapsibleSection>
        )}

        {profile.physical?.sections?.length > 0 && (
          <CollapsibleSection title="Physical" icon="body-outline" defaultOpen={true}>
            {profile.physical.sections.map((sec, i) => (
              <View key={i} style={styles.physicalSection}>
                <Text style={styles.physicalSectionTitle}>{sec.title}</Text>
                <Text style={styles.para}>{sec.content}</Text>
              </View>
            ))}
          </CollapsibleSection>
        )}

        {profile.modalities && (
          <CollapsibleSection title="Modalities" icon="swap-horizontal-outline" defaultOpen={true}>
            <View style={styles.modalityRow}>
              <View style={styles.modalityCol}>
                <Text style={styles.modalityLabelAgg}>Aggravation</Text>
                {(profile.modalities.aggravation || []).map((m, i) => (
                  <Text key={i} style={styles.modalityItem}>• {m}</Text>
                ))}
              </View>
              <View style={styles.modalityCol}>
                <Text style={styles.modalityLabelAmel}>Amelioration</Text>
                {(profile.modalities.amelioration || []).map((m, i) => (
                  <Text key={i} style={styles.modalityItem}>• {m}</Text>
                ))}
              </View>
            </View>
          </CollapsibleSection>
        )}

        {profile.differentials?.length > 0 && (
          <CollapsibleSection title="Differentials" icon="git-compare-outline" defaultOpen={true}>
            <View style={styles.differentialsRow}>
              {profile.differentials.map((d, i) => (
                <View key={i} style={styles.diffPill}>
                  <Text style={styles.diffPillText}>{d}</Text>
                </View>
              ))}
            </View>
          </CollapsibleSection>
        )}

        <View style={styles.referenceBox}>
          <Text style={styles.referenceLabel}>REFERENCE SOURCE</Text>
          <Text style={styles.referenceText}>{profile.referenceSource}</Text>
        </View>

        <TouchableOpacity style={styles.compareBtn} activeOpacity={0.8}>
          <Ionicons name="library-outline" size={22} color="#fff" />
          <Text style={styles.compareBtnText}>Compare Remedy</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
  errorText: { marginTop: 12, fontSize: 14, color: colors.accentAlert, textAlign: "center" },
  backBtnFull: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 8 },
  backBtnText: { color: "#fff", fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: layout.spacing,
    paddingTop: Platform.OS === "ios" ? 48 : 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBack: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 12, fontWeight: "700", color: colors.textTertiary, letterSpacing: 1 },
  headerSubtitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: layout.spacing, paddingBottom: 32 },
  remedyName: { fontSize: 24, fontWeight: "700", color: colors.textPrimary, marginTop: 16 },
  badgeRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  badge: { backgroundColor: colors.primary + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  badgeText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  commonName: { fontSize: 13, fontStyle: "italic", color: colors.textSecondary },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, paddingVertical: 4 },
  highlightsBox: {
    backgroundColor: colors.primary + "12",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary + "30",
    padding: 16,
    marginTop: 20,
  },
  highlightsTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  highlightsTitle: { fontSize: 13, fontWeight: "700", color: colors.primary, letterSpacing: 0.5 },
  highlightBullet: { fontSize: 13, color: colors.textPrimary, marginBottom: 4, lineHeight: 20 },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  sectionBody: { paddingHorizontal: 14, paddingBottom: 14 },
  para: { fontSize: 14, lineHeight: 22, color: colors.textSecondary, marginTop: 8 },
  keyTraitsLabel: { fontSize: 12, fontWeight: "700", color: colors.primary, marginTop: 12 },
  physicalSection: { marginTop: 14 },
  physicalSectionTitle: { fontSize: 12, fontWeight: "700", color: colors.primary, marginBottom: 4 },
  modalityRow: { flexDirection: "row", gap: 16, marginTop: 8 },
  modalityCol: { flex: 1 },
  modalityLabelAgg: { fontSize: 12, fontWeight: "700", color: colors.accentAlert, marginBottom: 6 },
  modalityLabelAmel: { fontSize: 12, fontWeight: "700", color: colors.accentSuccess, marginBottom: 6 },
  modalityItem: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  differentialsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  diffPill: { backgroundColor: colors.primary + "18", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  diffPillText: { fontSize: 13, fontWeight: "600", color: colors.primary },
  referenceBox: { marginTop: 24 },
  referenceLabel: { fontSize: 11, fontWeight: "700", color: colors.textTertiary, letterSpacing: 1 },
  referenceText: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  compareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
  },
  compareBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
