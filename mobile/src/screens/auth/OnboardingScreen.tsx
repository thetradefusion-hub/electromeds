import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { layout } from "../../theme/layout";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

export default function OnboardingScreen() {
  const { acceptDisclaimer } = useAuth();

  const handleAgree = () => {
    acceptDisclaimer();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Clinical Safety & Disclaimers</Text>
        <Text style={styles.subtitle}>
          Homeolytics is designed to assist, not replace, your professional judgment. Please review the key
          points below before continuing.
        </Text>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>1. Clinical Responsibility</Text>
          <Text style={styles.blockText}>
            Final responsibility for all diagnostic and prescription decisions always lies with you, the
            practitioner. AI suggestions and rule engine outputs are decision-support only.
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>2. Data Privacy & Security</Text>
          <Text style={styles.blockText}>
            Patient data is handled according to modern security practices (encryption in transit, role-based
            access). You are responsible for using the app in a compliant environment (HIPAA/GDPR style
            workflows).
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>3. Limitations of AI & Rule Engine</Text>
          <Text style={styles.blockText}>
            Suggestions are derived from encoded repertories, materia medica and clinical rules. They may not
            cover all edge cases and must be cross-checked with the patient&apos;s full clinical picture.
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>4. Informed Consent</Text>
          <Text style={styles.blockText}>
            Where required by local regulations, you are responsible for informing patients that AI-assisted
            tools are being used as part of case analysis.
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>5. Emergency & Acute Scenarios</Text>
          <Text style={styles.blockText}>
            In emergency conditions, standard emergency protocols and local guidelines take precedence. Use the
            app&apos;s Acute Quick-Reference only as an adjunct, not a replacement.
          </Text>
        </View>

        <View style={styles.buttonWrap}>
          <Button title="I Agree & Continue" onPress={handleAgree} />
        </View>
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
    paddingTop: 32,
    paddingBottom: 32,
  },
  title: {
    ...typography.h1,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  block: {
    backgroundColor: colors.surface,
    borderRadius: layout.radius,
    padding: layout.spacing,
    marginBottom: layout.spacing,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  blockText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  buttonWrap: {
    marginTop: layout.spacing,
  },
});

