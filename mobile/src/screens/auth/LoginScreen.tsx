import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/ui/Button";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("doctor@homeolytics.com");
  const [password, setPassword] = useState("doctor123");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Please check your credentials and try again.";
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(`Login failed\n\n${message}`);
      } else {
        Alert.alert("Login failed", message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand block */}
        <View style={styles.brandBlock}>
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>Hx</Text>
            </View>
          </View>
          <Text style={styles.appName}>Homeolytics</Text>
          <Text style={styles.tagline}>Where homeopathy meets intelligence</Text>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in with your professional account to access the dashboard and patient care tools.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@clinic.com"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <Text style={[styles.label, styles.labelTop]}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.forgotWrap} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <View style={styles.btnWrap}>
            <Button title="Sign in" onPress={handleLogin} loading={loading} />
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.disclaimerText}>
            Homeolytics supports clinical decision-making. Professional judgment and responsibility remain with the practitioner.
          </Text>
        </View>

        {/* Sign up */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don&apos;t have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")} activeOpacity={0.7}>
            <Text style={styles.switchLink}>Create account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
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
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 40,
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoWrap: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 14px rgba(11,84,219,0.35)" as any } : {}),
  },
  logoText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 22,
  },
  appName: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
  },
  welcomeBlock: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === "web" ? { boxShadow: "0 2px 12px rgba(0,0,0,0.06)" as any } : layout.shadow),
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  labelTop: {
    marginTop: 16,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 14,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: 12,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },
  btnWrap: {
    marginTop: 24,
  },
  disclaimerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.primary + "0C",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary + "20",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  switchText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
    gap: 8,
  },
  footerLink: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  footerDot: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});
