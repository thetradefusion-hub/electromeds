import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export default function CasesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Case</Text>
      <Text style={styles.subtitle}>Case Taking, Rule Engine & Prescription flow will open from here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    ...typography.h1,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

