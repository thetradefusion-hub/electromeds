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
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import {
  getRubricsByChapter,
  type RepertoryRubric,
} from "../../api/repertory";

type RouteParams = RouteProp<
  Record<string, { chapterId: string; name: string }>,
  string
>;

export default function RepertoryChapterScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const chapterId = route.params?.chapterId;
  const chapterName = route.params?.name ?? "Chapter";

  const [rubrics, setRubrics] = useState<RepertoryRubric[]>([]);
  const [filtered, setFiltered] = useState<RepertoryRubric[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions?.({ title: chapterName });
  }, [chapterName, navigation]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Pass chapter name to API for accurate backend query
        const data = await getRubricsByChapter(chapterId || "", chapterName);
        setRubrics(data);
        setFiltered(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [chapterId, chapterName]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(rubrics);
      return;
    }
    const q = search.trim().toLowerCase();
    setFiltered(
      rubrics.filter(
        (r) =>
          r.text.toLowerCase().includes(q) ||
          r.path.toLowerCase().includes(q)
      )
    );
  }, [search, rubrics]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{chapterName}</Text>
          <Text style={styles.headerSubtitle}>
            {rubrics.length > 0 ? `${rubrics.length} rubrics` : "Loading rubrics..."}
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons
          name="search-outline"
          size={20}
          color={colors.textTertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search within this chapter..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No rubrics found for this chapter.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((rubric) => (
            <TouchableOpacity
              key={rubric.id}
              style={styles.rubricCard}
              activeOpacity={0.7}
            >
              <View style={styles.rubricHeaderRow}>
                <Text style={styles.rubricPath}>{rubric.path}</Text>
              </View>
              <Text style={styles.rubricText}>{rubric.text}</Text>
            </TouchableOpacity>
          ))}
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
    paddingTop: Platform.OS === "ios" ? 48 : 16,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
    marginHorizontal: layout.spacing,
    marginBottom: 12,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.spacing,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  rubricCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rubricHeaderRow: {
    marginBottom: 4,
  },
  rubricPath: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  rubricText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
});

