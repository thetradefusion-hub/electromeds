import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import OnboardingScreen from "../screens/auth/OnboardingScreen";
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import AppointmentsListScreen from "../screens/dashboard/AppointmentsListScreen";
import ScheduleAppointmentScreen from "../screens/appointments/ScheduleAppointmentScreen";
import PrescriptionsListScreen from "../screens/dashboard/PrescriptionsListScreen";
import PatientsScreen from "../screens/patients/PatientsScreen";
import PatientProfileScreen from "../screens/patients/PatientProfileScreen";
import AddPatientScreen from "../screens/patients/AddPatientScreen";
import SelectPatientForCaseScreen from "../screens/cases/SelectPatientForCaseScreen";
import CaseModeScreen from "../screens/cases/CaseModeScreen";
import CaseTakingScreen from "../screens/cases/CaseTakingScreen";
import CaseTakingVoiceScreen from "../screens/cases/CaseTakingVoiceScreen";
import RemedySuggestionsScreen from "../screens/cases/RemedySuggestionsScreen";
import CaseCompletenessScreen from "../screens/cases/CaseCompletenessScreen";
import PrescriptionBuilderScreen from "../screens/cases/PrescriptionBuilderScreen";
import PrescriptionPreviewScreen from "../screens/cases/PrescriptionPreviewScreen";
import FollowUpComparisonScreen from "../screens/cases/FollowUpComparisonScreen";
import RepertoryScreen from "../screens/repertory/RepertoryScreen";
import RepertoryChapterScreen from "../screens/repertory/RepertoryChapterScreen";
import MateriaMedicaScreen from "../screens/materiaMedica/MateriaMedicaScreen";
import RemedyProfileScreen from "../screens/materiaMedica/RemedyProfileScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";

const AuthStack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const PatientsStack = createNativeStackNavigator();
const CasesStack = createNativeStackNavigator();
const RepertoryStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="AppointmentsList" component={AppointmentsListScreen} />
      <HomeStack.Screen name="ScheduleAppointment" component={ScheduleAppointmentScreen} />
      <HomeStack.Screen name="PrescriptionsList" component={PrescriptionsListScreen} />
    </HomeStack.Navigator>
  );
}

function PatientsStackNavigator() {
  return (
    <PatientsStack.Navigator screenOptions={{ headerShown: false }}>
      <PatientsStack.Screen name="PatientsList" component={PatientsScreen} />
      <PatientsStack.Screen name="AddPatient" component={AddPatientScreen} />
      <PatientsStack.Screen name="PatientProfile" component={PatientProfileScreen} />
      <PatientsStack.Screen name="FollowUpComparison" component={FollowUpComparisonScreen} />
    </PatientsStack.Navigator>
  );
}

function CasesStackNavigator() {
  return (
    <CasesStack.Navigator screenOptions={{ headerShown: false }}>
      <CasesStack.Screen name="SelectPatientForCase" component={SelectPatientForCaseScreen} />
      <CasesStack.Screen name="CaseMode" component={CaseModeScreen} />
      <CasesStack.Screen name="CaseTaking" component={CaseTakingScreen} />
      <CasesStack.Screen name="CaseTakingVoice" component={CaseTakingVoiceScreen} />
      <CasesStack.Screen name="RemedySuggestions" component={RemedySuggestionsScreen} />
      <CasesStack.Screen name="CaseCompleteness" component={CaseCompletenessScreen} />
      <CasesStack.Screen name="PrescriptionBuilder" component={PrescriptionBuilderScreen} />
      <CasesStack.Screen name="PrescriptionPreview" component={PrescriptionPreviewScreen} />
    </CasesStack.Navigator>
  );
}

function RepertoryStackNavigator() {
  return (
    <RepertoryStack.Navigator screenOptions={{ headerShown: false }}>
      <RepertoryStack.Screen name="RepertoryBrowser" component={RepertoryScreen} />
      <RepertoryStack.Screen name="RepertoryChapter" component={RepertoryChapterScreen} />
      <RepertoryStack.Screen name="MateriaMedica" component={MateriaMedicaScreen} />
      <RepertoryStack.Screen name="RemedyProfile" component={RemedyProfileScreen} />
    </RepertoryStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const isNewCase = route.name === "NewCase";
        return {
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
          tabBarLabel: route.name === "NewCase" ? "New Case" : route.name,
          tabBarIcon: ({ color }) => {
            let iconName: keyof typeof Ionicons.glyphMap = "home-outline";
            if (route.name === "Home") iconName = "home-outline";
            else if (route.name === "Patients") iconName = "people-outline";
            else if (route.name === "NewCase") iconName = "add-circle";
            else if (route.name === "Repertory") iconName = "book-outline";
            else if (route.name === "Settings") iconName = "settings-outline";
            return (
              <Ionicons
                name={iconName}
                size={isNewCase ? 28 : 24}
                color={color}
              />
            );
          },
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Patients" component={PatientsStackNavigator} />
      <Tab.Screen
        name="NewCase"
        component={CasesStackNavigator}
        options={{ tabBarLabel: "New Case" }}
      />
      <Tab.Screen name="Repertory" component={RepertoryStackNavigator} />
      <Tab.Screen name="Settings" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, hasAcceptedDisclaimer, initializing } = useAuth();
  const isLoggedIn = !!user;

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7242/ingest/1dfc81ad-c597-4667-9229-581e5b5698b5", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "RootNavigator.tsx:mount",
        message: "RootNavigator mounted",
        hypothesisId: "H5",
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, []);
  // #endregion

  if (initializing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isLoggedIn ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
        </AuthStack.Navigator>
      ) : !hasAcceptedDisclaimer ? (
        <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
          <OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
        </OnboardingStack.Navigator>
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
