import React, { useEffect, useState } from "react";
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
import { Card } from "../../components/ui/Card";
import {
  getRepertoryChapters,
  type RepertoryChapter,
} from "../../api/repertory";

export default function RepertoryScreen() {
  const navigation = useNavigation<any>();
  const [chapters, setChapters] = useState<RepertoryChapter[]>([]);
  const [filtered, setFiltered] = useState<RepertoryChapter[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getRepertoryChapters();
        setChapters(data);
        setFiltered(data);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Unable to load repertory chapters.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(chapters);
      return;
    }
    const q = search.trim().toLowerCase();
    setFiltered(
      chapters.filter((c) => c.name.toLowerCase().includes(q))
    );
  }, [search, chapters]);

  const totalChapters = chapters.length;

  const openChapter = (chapter: RepertoryChapter) => {
    navigation.navigate("RepertoryChapter", { chapterId: chapter.id, name: chapter.name });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="book-outline" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Repertory Browser</Text>
              <Text style={styles.headerSubtitle}>Browse chapters & rubrics</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.8}>
              <Ionicons name="add-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.8}>
              <Ionicons
                name="options-outline"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for rubrics (e.g., 'Fear of dark')..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Materia Medica link */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("MateriaMedica")}
              style={styles.materiaCard}
            >
              <Card style={styles.materiaCardInner}>
                <View style={styles.chapterRow}>
                  <View style={styles.chapterIconCircle}>
                    <Ionicons name="library-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.chapterContent}>
                    <Text style={styles.chapterTitle}>Materia Medica</Text>
                    <Text style={styles.chapterSubtitle}>Remedy library & knowledge base</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </View>
              </Card>
            </TouchableOpacity>

            {/* Main chapters header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>MAIN CHAPTERS</Text>
              <Text style={styles.sectionMeta}>
                {totalChapters} Chapters Found
              </Text>
            </View>

            {/* Chapter list */}
            <View style={styles.chapterList}>
              {filtered.map((chapter) => (
                <TouchableOpacity
                  key={chapter.id}
                  onPress={() => openChapter(chapter)}
                  activeOpacity={0.8}
                >
                  <Card style={styles.chapterCard}>
                    <View style={styles.chapterRow}>
                      <View style={styles.chapterIconCircle}>
                        <Ionicons
                          name={getChapterIconName(chapter.icon)}
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.chapterContent}>
                        <Text style={styles.chapterTitle}>{chapter.name}</Text>
                        <Text style={styles.chapterSubtitle}>
                          {chapter.rubricCount} rubrics
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.textTertiary}
                      />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function getChapterIconName(icon: RepertoryChapter["icon"]): keyof typeof Ionicons.glyphMap {
  switch (icon) {
    case "mind":
      return "bulb-outline";
    case "vertigo":
      return "sync-outline";
    case "head":
      return "body-outline";
    case "eyes":
      return "eye-outline";
    case "ears":
      return "ear-outline";
    case "nose":
      return "leaf-outline";
    case "face":
      return "happy-outline";
    case "mouth":
      return "medical-outline";
    default:
      return "ellipse-outline";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: layout.spacing,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(15,23,42,0.08)" as any }
      : layout.shadow),
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 4,
  },
  centered: {
    marginTop: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 13,
    color: colors.accentAlert,
    textAlign: "center",
  },
  materiaCard: {
    marginBottom: 20,
  },
  materiaCardInner: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  sectionMeta: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  chapterList: {
    gap: 8,
  },
  chapterCard: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  chapterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chapterIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  chapterContent: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  chapterSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

