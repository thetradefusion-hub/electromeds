import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { layout } from "../../theme/layout";
import { Card } from "../../components/ui/Card";

type Params = { patientName?: string };

const initialData = [
  { label: "Energy", value: "Low" },
  { label: "Sleep", value: "Disturbed" },
  { label: "Mood", value: "Anxious" },
  { label: "Appetite", value: "Poor" },
];

const currentData = [
  { label: "Energy", value: "Improved" },
  { label: "Sleep", value: "Better" },
  { label: "Mood", value: "Stable" },
  { label: "Appetite", value: "Normal" },
];

export default function FollowUpComparisonScreen() {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const navigation = useNavigation<any>();
  const patientName = route.params?.patientName ?? "Patient";

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Follow-up Comparison</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Initial vs Current</Text>
        <Text style={styles.subtitle}>
          Initial vs current state for {patientName}
        </Text>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.columnTitle}>Initial</Text>
            <Card style={styles.columnCard}>
              {initialData.map((item) => (
                <View key={item.label} style={styles.rowItem}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowValue}>{item.value}</Text>
                </View>
              ))}
            </Card>
          </View>
          <View style={styles.half}>
            <Text style={styles.columnTitle}>Current</Text>
            <Card style={[styles.columnCard, styles.currentCard]}>
              {currentData.map((item) => (
                <View key={item.label} style={styles.rowItem}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={[styles.rowValue, styles.currentValue]}>{item.value}</Text>
                </View>
              ))}
            </Card>
          </View>
        </View>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Text style={styles.summaryText}>
            Energy and sleep have improved since first consultation. Mood and appetite are now stable.
            Next follow-up recommended in 4–6 weeks.
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: layout.spacing,
    paddingTop: 16,
    paddingBottom: 32,
  },
  title: {
    ...typography.h1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  half: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  columnCard: {
    padding: 12,
  },
  currentCard: {
    borderColor: colors.accentSuccess,
    borderWidth: 1,
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  currentValue: {
    color: colors.primary,
  },
  summaryCard: {
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
