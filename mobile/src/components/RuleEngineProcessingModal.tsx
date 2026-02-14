import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import {
  suggestRemedies,
  SuggestionResponse,
  StructuredCaseInput,
} from "../api/classicalHomeopathy";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const RULE_STEPS = [
  {
    title: "Case intake & symptom structuring",
    description: "Normalizing mental, general, particular, and modality symptoms.",
  },
  {
    title: "Mapping symptoms to repertory rubrics",
    description: "Finding matching rubrics in the English (publicum) repertory.",
  },
  {
    title: "Building remedy pool from rubrics",
    description: "Collecting all remedies related to the matched rubrics.",
  },
  {
    title: "Smart scoring & clinical filters",
    description: "Applying weights, modalities, pathology and safety checks.",
  },
  {
    title: "Generating final remedy suggestions",
    description: "Preparing ranked remedies with transparent reasoning.",
  },
] as const;

type Props = {
  visible: boolean;
  onSuccess: (response: SuggestionResponse) => void;
  onError: (error: unknown) => void;
  patientId: string;
  structuredCase: StructuredCaseInput;
  patientHistory?: Array<{ remedyId: string; date: string }>;
  selectedRubricIds?: string[];
};

const STEP_DURATION_MS = 900;

export function RuleEngineProcessingModal({
  visible,
  onSuccess,
  onError,
  patientId,
  structuredCase,
  patientHistory,
  selectedRubricIds,
}: Props) {
  const [completedThrough, setCompletedThrough] = useState(0);
  const [apiDone, setApiDone] = useState(false);
  const [apiResponse, setApiResponse] = useState<SuggestionResponse | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const successFiredRef = useRef(false);

  const animOpacity = useRef(new Animated.Value(0)).current;
  const animScale = useRef(new Animated.Value(0.92)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Reset when modal opens so success can fire again
  useEffect(() => {
    if (visible) {
      successFiredRef.current = false;
    }
  }, [visible]);

  // On web, use JS driver to avoid native driver style/DOM cleanup causing removeChild errors
  const useNativeDriver = Platform.OS !== "web";

  // Enter animation when modal becomes visible
  useEffect(() => {
    if (!visible) {
      animOpacity.setValue(0);
      animScale.setValue(0.92);
      progressAnim.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(animOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver,
      }),
      Animated.spring(animScale, {
        toValue: 1,
        friction: 10,
        tension: 80,
        useNativeDriver,
      }),
    ]).start();
  }, [visible]);

  // Animate progress bar when completedThrough or apiDone changes
  useEffect(() => {
    const p = (completedThrough >= 4 && apiDone ? 5 : completedThrough) / 5;
    Animated.timing(progressAnim, {
      toValue: p,
      duration: 380,
      useNativeDriver: false,
    }).start();
  }, [completedThrough, apiDone]);

  useEffect(() => {
    mountedRef.current = true;
    if (!visible) {
      setCompletedThrough(0);
      setApiDone(false);
      setApiResponse(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const runApi = async () => {
      try {
        const response = await suggestRemedies(
          patientId,
          structuredCase,
          patientHistory,
          selectedRubricIds
        );
        if (mountedRef.current) {
          setApiResponse(response);
          setApiDone(true);
        }
      } catch (err) {
        if (mountedRef.current) {
          onError(err);
        }
      }
    };

    runApi();

    timerRef.current = setInterval(() => {
      setCompletedThrough((prev) => {
        if (prev >= 4) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 4;
        }
        return prev + 1;
      });
    }, STEP_DURATION_MS);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, patientId]);

  // As soon as we have API response: mark step 5 complete and navigate (don't wait for timer)
  useEffect(() => {
    if (!visible || !apiResponse || successFiredRef.current) return;
    successFiredRef.current = true;
    setCompletedThrough(5);
    const response = apiResponse;
    const t = setTimeout(() => {
      onSuccess(response);
    }, 600);
    return () => clearTimeout(t);
  }, [visible, apiResponse, onSuccess]);

  if (!visible) return null;

  const currentStep = Math.min(completedThrough + 1, 5);
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const overlayContent = (
    <Animated.View style={[styles.overlay, { opacity: animOpacity }]}>
      <Animated.View
        style={[
          styles.dialog,
          {
            transform: [{ scale: animScale }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="flash" size={18} color={colors.primary} />
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.title} numberOfLines={2}>
                Rule Engine is analyzing this case
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                Processing symptoms through all clinical steps.
              </Text>
            </View>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{currentStep}/5</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressBarWrap}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
        </View>

        <View style={styles.stepsList}>
          {RULE_STEPS.map((step, index) => {
            const stepNum = index + 1;
            const isCompleted = completedThrough >= stepNum;
            const isCurrent = completedThrough === index;
            return (
              <View key={stepNum} style={styles.stepCard}>
                <View style={styles.stepIconWrap}>
                  {isCompleted ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  ) : isCurrent ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <View style={styles.stepIconCircle} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle} numberOfLines={1}>
                    {stepNum}. {step.title}
                  </Text>
                  <Text style={styles.stepDescription} numberOfLines={1}>
                    {step.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </Animated.View>
  );

  // On web, avoid React Native Modal (portal) to prevent "removeChild" DOM errors
  // when navigation unmounts the screen before the modal cleans up.
  if (Platform.OS === "web") {
    return (
      <View style={styles.webOverlay} pointerEvents="box-none">
        {overlayContent}
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      {overlayContent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  webOverlay: {
    position: Platform.OS === "web" ? ("fixed" as const) : "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialog: {
    width: "100%",
    maxWidth: Math.min(SCREEN_WIDTH - 32, 340),
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 2px 8px rgba(0,0,0,0.15)" as any }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }),
  },
  header: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0F7FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  stepBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF",
  },
  progressBarWrap: {
    marginBottom: 10,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  stepsList: {
    gap: 5,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  stepIconWrap: {
    width: 22,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  stepContent: {
    flex: 1,
    minWidth: 0,
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 0,
  },
  stepDescription: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});
