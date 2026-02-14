import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button } from "../../components/ui/Button";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { layout } from "../../theme/layout";
import { useAuth } from "../../context/AuthContext";

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const { signupDoctor, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [qualification, setQualification] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSignup = async () => {
    if (!name || !email || !password || !registrationNo || !qualification || !clinicName) {
      Alert.alert("Missing details", "Please fill all required fields marked with *.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    try {
      await signupDoctor({
        name,
        email,
        password,
        registration_no: registrationNo,
        qualification,
        clinic_name: clinicName,
        phone: phone || undefined,
      });
      // After signup, user is logged in; RootNavigator will show disclaimers first.
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data?.errors) && error.response.data.errors[0]?.msg) ||
        error?.message ||
        "Signup failed. Please check your details and try again.";
      Alert.alert("Signup failed", message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Set up your doctor profile to start using Homeolytics.</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Dr. Julian Smith"
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="doctor@clinic.com"
        />

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 6 characters"
        />

        <Text style={styles.label}>Registration Number *</Text>
        <TextInput
          style={styles.input}
          value={registrationNo}
          onChangeText={setRegistrationNo}
          placeholder="e.g. EH/1234"
        />

        <Text style={styles.label}>Qualification *</Text>
        <TextInput
          style={styles.input}
          value={qualification}
          onChangeText={setQualification}
          placeholder="e.g. BEMS, BHMS, MD"
        />

        <Text style={styles.label}>Clinic Name *</Text>
        <TextInput
          style={styles.input}
          value={clinicName}
          onChangeText={setClinicName}
          placeholder="Homeolytics Care Clinic"
        />

        <Text style={styles.label}>Phone (optional)</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+91 98XXXXXXXX"
        />

        <View style={{ marginTop: layout.spacing }}>
          <Button title="Create Account" onPress={handleSignup} loading={loading} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account?</Text>
          <Text style={styles.switchLink} onPress={() => navigation.navigate("Login")}>
            Log in
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: layout.spacing,
    paddingTop: 40,
    paddingBottom: 32,
  },
  title: {
    ...typography.h1,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  label: {
    ...typography.body,
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 4,
  },
  switchText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  switchLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
});

