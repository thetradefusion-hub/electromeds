import React, { useState, useEffect, useMemo } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import { getRemedies, type Remedy } from "../../api/classicalHomeopathy";
import { Card } from "../../components/ui/Card";

const CATEGORY_SHORT: Record<string, string> = {
  "Plant Kingdom": "Plant",
  "Mineral Kingdom": "Mineral",
  "Animal Kingdom": "Animal",
  Nosode: "Nosode",
  Sarcode: "Sarcode",
  Imponderabilia: "Imponderabilia",
};

const CATEGORY_FULL: Record<string, string> = {
  Plant: "Plant Kingdom",
  Mineral: "Mineral Kingdom",
  Animal: "Animal Kingdom",
  Nosode: "Nosode",
  Sarcode: "Sarcode",
  Imponderabilia: "Imponderabilia",
};

function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  const c = category.toLowerCase();
  if (c.includes("plant")) return "leaf-outline";
  if (c.includes("mineral")) return "diamond-outline";
  if (c.includes("animal")) return "paw-outline";
  if (c.includes("nosode")) return "flask-outline";
  if (c.includes("sarcode")) return "medical-outline";
  return "cube-outline";
}

function getDescription(remedy: Remedy): string {
  if (remedy.materiaMedica.keynotes?.length) return remedy.materiaMedica.keynotes[0];
  if (remedy.materiaMedica.pathogenesis) return remedy.materiaMedica.pathogenesis.slice(0, 150);
  if (remedy.materiaMedica.clinicalNotes) return remedy.materiaMedica.clinicalNotes.slice(0, 150);
  return "No description available.";
}

export default function MateriaMedicaScreen() {
  const navigation = useNavigation<any>();
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "category">("name");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const set = new Set<string>();
    remedies.forEach((r) => set.add(CATEGORY_SHORT[r.category] || r.category));
    return Array.from(set).sort();
  }, [remedies]);

  const loadRemedies = async () => {
    try {
      setLoading(true);
      setError(null);
      const categoryParam =
        selectedCategory !== "all"
          ? (CATEGORY_FULL[selectedCategory] || selectedCategory)
          : undefined;
      const res = await getRemedies({
        category: categoryParam,
        sortBy,
        limit: 3000,
      });
      setRemedies(res.data);
    } catch (e: any) {
      setError(e?.message || "Failed to load remedies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRemedies();
  }, [selectedCategory, sortBy]);

  const filteredRemedies = useMemo(() => {
    if (!searchQuery.trim()) return remedies;
    const q = searchQuery.toLowerCase();
    return remedies.filter((r) => {
      const name = r.name.toLowerCase();
      const keynotes = (r.materiaMedica.keynotes || []).join(" ").toLowerCase();
      const path = (r.materiaMedica.pathogenesis || "").toLowerCase();
      const notes = (r.materiaMedica.clinicalNotes || "").toLowerCase();
      const ind = (r.clinicalIndications || []).join(" ").toLowerCase();
      return name.includes(q) || keynotes.includes(q) || path.includes(q) || notes.includes(q) || ind.includes(q);
    });
  }, [remedies, searchQuery]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <Ionicons name="library-outline" size={24} color={colors.textPrimary} />
          <Text style={styles.headerTitle}>Materia Medica</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Ionicons name="person-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search remedies, symptoms, or families..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[styles.filterPill, selectedCategory === "all" && styles.filterPillActive]}
          onPress={() => setSelectedCategory("all")}
        >
          <Ionicons name="star-outline" size={16} color={selectedCategory === "all" ? colors.primary : colors.textSecondary} />
          <Text style={[styles.filterPillText, selectedCategory === "all" && styles.filterPillTextActive]}>Favorites</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterPill, selectedCategory === cat && styles.filterPillActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Ionicons name={getCategoryIcon(cat)} size={16} color={selectedCategory === cat ? colors.primary : colors.textSecondary} />
            <Text style={[styles.filterPillText, selectedCategory === cat && styles.filterPillTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>SHOWING {filteredRemedies.length} RESULTS</Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortBy((s) => (s === "name" ? "category" : "name"))}>
          <Text style={styles.sortText}>Sort by {sortBy === "name" ? "Name" : "Category"}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading remedies...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.accentAlert} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadRemedies}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredRemedies.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No remedies found</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {filteredRemedies.map((remedy) => {
            const isFav = favorites.has(remedy._id);
            const catLabel = CATEGORY_SHORT[remedy.category] || remedy.category;
            return (
              <TouchableOpacity
                key={remedy._id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("RemedyProfile", { remedyId: remedy._id, remedyName: remedy.name })}
              >
                <Card style={styles.card}>
                  <TouchableOpacity style={styles.bookmark} onPress={() => toggleFavorite(remedy._id)}>
                    <Ionicons name={isFav ? "bookmark" : "bookmark-outline"} size={20} color={isFav ? colors.primary : colors.textTertiary} />
                  </TouchableOpacity>
                  <Text style={styles.remedyName}>{remedy.name}</Text>
                  <Text style={styles.commonName}>{remedy.category}</Text>
                  <View style={styles.tagsRow}>
                    <View style={[styles.tag, styles.tagCat]}>
                      <Text style={styles.tagText}>{catLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.desc} numberOfLines={3}>{getDescription(remedy)}</Text>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.spacing,
    paddingTop: Platform.OS === "ios" ? 48 : 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBack: { padding: 4, marginRight: 4 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: colors.textPrimary },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: layout.spacing,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, paddingVertical: 4 },
  filtersScroll: { maxHeight: 50, marginTop: 12 },
  filtersContent: { paddingHorizontal: layout.spacing, gap: 8 },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: { backgroundColor: colors.primary + "15", borderColor: colors.primary },
  filterPillText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  filterPillTextActive: { color: colors.primary },
  resultsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.spacing,
    paddingVertical: 12,
  },
  resultsText: { fontSize: 11, fontWeight: "600", color: colors.textTertiary, letterSpacing: 0.5 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { fontSize: 12, fontWeight: "500", color: colors.textSecondary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: layout.spacing, paddingBottom: 24 },
  card: { padding: 16, marginBottom: 12, position: "relative" },
  bookmark: { position: "absolute", top: 16, right: 16, zIndex: 1 },
  remedyName: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 4, paddingRight: 32 },
  commonName: { fontSize: 13, fontStyle: "italic", color: colors.textSecondary, marginBottom: 10 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagCat: { backgroundColor: colors.primary + "20" },
  tagText: { fontSize: 10, fontWeight: "600", color: colors.primary, textTransform: "uppercase" },
  desc: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
  errorText: { marginTop: 12, fontSize: 14, color: colors.accentAlert, textAlign: "center" },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 8 },
  retryBtnText: { color: colors.surface, fontWeight: "600" },
  emptyText: { marginTop: 12, fontSize: 16, fontWeight: "600", color: colors.textPrimary },
});
