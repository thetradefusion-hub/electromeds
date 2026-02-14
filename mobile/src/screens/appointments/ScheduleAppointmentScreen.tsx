import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import { Card } from "../../components/ui/Card";
import { createAppointment, getAvailability, getAppointments, type Availability } from "../../api/appointment";
import { fetchPatients, type Patient } from "../../api/patient";

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

export default function ScheduleAppointmentScreen() {
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [consultationType, setConsultationType] = useState<"walk_in" | "online">("walk_in");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<Availability[]>([]);

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
      if (onOk) onOk();
      return;
    }
    Alert.alert(
      title,
      message,
      onOk ? [{ text: "OK", onPress: onOk }] : undefined
    );
  };

  // Load availability and patients
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [avail, patients] = await Promise.all([getAvailability(), fetchPatients()]);
        setAvailability(avail);
        setFilteredPatients(patients);
      } catch (error: any) {
        showAlert("Error", error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate available slots when date changes
  useEffect(() => {
    const calculateSlots = async () => {
      if (!selectedDate) {
        setAvailableSlots([]);
        return;
      }

      try {
        // If no availability configured, use default slots (9 AM to 5 PM, 30 min intervals)
        if (availability.length === 0) {
          const defaultSlots: string[] = [];
          const date = new Date(selectedDate);
          // Generate default slots: 9:00 AM to 5:00 PM, 30 min intervals
          for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
              date.setHours(hour, minute, 0, 0);
              defaultSlots.push(formatTimeSlot(date));
            }
          }
          setAvailableSlots(defaultSlots);
          return;
        }

        // Get booked appointments for selected date
        const dateStr = selectedDate.toISOString().slice(0, 10);
        const bookedAppointments = await getAppointments({ date: dateStr });
        const bookedSlots = new Set(bookedAppointments.map((a) => a.timeSlot));

        // Get availability for selected day
        const dayOfWeek = selectedDate.getDay();
        const dayAvail = availability.find((a) => a.dayOfWeek === dayOfWeek && a.isActive);

        if (!dayAvail) {
          // If no availability for this day, show default slots
          const defaultSlots: string[] = [];
          const date = new Date(selectedDate);
          for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
              date.setHours(hour, minute, 0, 0);
              const slotStr = formatTimeSlot(date);
              if (!bookedSlots.has(slotStr)) {
                defaultSlots.push(slotStr);
              }
            }
          }
          setAvailableSlots(defaultSlots);
          return;
        }

        // Generate time slots from availability
        const slots: string[] = [];
        const start = parseTime(dayAvail.startTime);
        const end = parseTime(dayAvail.endTime);
        const duration = dayAvail.slotDuration || 30;

        let current = start;
        while (current < end) {
          const slotStr = formatTimeSlot(current);
          if (!bookedSlots.has(slotStr)) {
            slots.push(slotStr);
          }
          current = addMinutes(current, duration);
        }

        setAvailableSlots(slots);
      } catch (error) {
        console.error("Error calculating slots:", error);
        // Fallback to default slots on error
        const defaultSlots: string[] = [];
        const date = new Date(selectedDate);
        for (let hour = 9; hour < 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            date.setHours(hour, minute, 0, 0);
            defaultSlots.push(formatTimeSlot(date));
          }
        }
        setAvailableSlots(defaultSlots);
      }
    };

    calculateSlots();
  }, [selectedDate, availability]);

  // Filter patients based on search
  useEffect(() => {
    if (!patientSearch.trim()) {
      setFilteredPatients([]);
      return;
    }

    const loadPatients = async () => {
      try {
        const patients = await fetchPatients();
        const filtered = patients.filter(
          (p) =>
            p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
            p.mobile.includes(patientSearch)
        );
        setFilteredPatients(filtered.slice(0, 5)); // Limit to 5 results
      } catch (error) {
        console.error("Error filtering patients:", error);
      }
    };

    loadPatients();
  }, [patientSearch]);

  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date(selectedDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const addMinutes = (date: Date, minutes: number): Date => {
    return new Date(date.getTime() + minutes * 60000);
  };

  const formatTimeSlot = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const getTimeOfDay = (slot: string): string => {
    const hour = parseInt(slot.split(":")[0]);
    if (hour < 12) return "MORNING";
    if (hour < 17) return "NOON";
    return "EVENING";
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
    setSelectedSlot(""); // Reset slot when date changes
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.name);
    setFilteredPatients([]);
  };

  const handleAddPatient = () => {
    navigation.navigate("AddPatient", {
      onPatientAdded: (patient: Patient) => {
        setSelectedPatient(patient);
        setPatientSearch(patient.name);
      },
    });
  };

  const handleConfirm = async () => {
    if (!selectedSlot) {
      showAlert("Missing Information", "Please select a time slot");
      return;
    }

    // For now, require an existing patient selection so that backend always
    // receives a valid patientId + mobile (avoids validation errors).
    if (!selectedPatient) {
      showAlert(
        "Missing Information",
        "Please search and tap on an existing patient first."
      );
      return;
    }

    try {
      setSubmitting(true);
      const dateStr = selectedDate.toISOString().slice(0, 10);
      const created = await createAppointment({
        patientId: selectedPatient._id,
        patientName: selectedPatient.name,
        patientMobile: selectedPatient.mobile,
        appointmentDate: dateStr,
        timeSlot: selectedSlot,
        bookingType: consultationType === "online" ? "online" : "walk_in",
        notes: clinicalNotes.trim() || undefined,
        status: "pending",
      });

      console.log("Appointment created:", created);

      showAlert("Success", "Appointment scheduled successfully", () =>
        navigation.goBack()
      );
    } catch (error: any) {
      console.error("Create appointment failed:", error);
      showAlert("Error", error.message || "Failed to schedule appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const currentMonth = selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const currentDay = selectedDate.getDate();
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Get previous month's last days
  const prevMonthLastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0).getDate();
  const prevMonthDays: number[] = [];
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(prevMonthLastDay - i);
  }

  // Get current month's days
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Schedule Appointment</Text>
        </View>
        <TouchableOpacity
          style={styles.menuBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={Platform.OS === "ios" ? "ellipsis-horizontal" : "ellipsis-vertical"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Select Date Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Select Date</Text>
              <View style={styles.monthIndicator}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.monthText}>{currentMonth}</Text>
              </View>
            </View>

            <Card style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => navigateMonth("prev")} style={styles.monthNavBtn}>
                  <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.calendarMonthText}>{currentMonth}</Text>
                <TouchableOpacity onPress={() => navigateMonth("next")} style={styles.monthNavBtn}>
                  <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.daysOfWeek}>
                {DAYS_OF_WEEK.map((day, idx) => (
                  <View key={idx} style={styles.dayOfWeek}>
                    <Text style={styles.dayOfWeekText}>{day}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {/* Previous month days */}
                {prevMonthDays.map((day) => (
                  <View key={`prev-${day}`} style={styles.calendarDay}>
                    <Text style={styles.calendarDayTextInactive}>{day}</Text>
                  </View>
                ))}

                {/* Current month days */}
                {currentMonthDays.map((day) => {
                  const isSelected = day === currentDay;
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
                      onPress={() => handleDateSelect(day)}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          isSelected && styles.calendarDayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          </View>

          {/* Available Slots Section */}
          {selectedDate && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Available Slots</Text>
                {availability.length === 0 && (
                  <View style={styles.infoBadge}>
                    <Ionicons name="information-circle-outline" size={14} color={colors.accentAlert} />
                    <Text style={styles.infoBadgeText}>Using default</Text>
                  </View>
                )}
              </View>
              {availableSlots.length === 0 ? (
                <View style={styles.noSlotsCard}>
                  <Ionicons name="time-outline" size={24} color={colors.textTertiary} />
                  <Text style={styles.noSlotsText}>No available slots for this date</Text>
                  <Text style={styles.noSlotsHint}>
                    All slots are booked or availability not set. Try another date.
                  </Text>
                </View>
              ) : (
                <View style={styles.slotsGrid}>
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    const timeOfDay = getTimeOfDay(slot);
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[styles.slotBtn, isSelected && styles.slotBtnSelected]}
                        onPress={() => setSelectedSlot(slot)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.slotTimeOfDay, isSelected && styles.slotTimeOfDaySelected]}>
                          {timeOfDay}
                        </Text>
                        <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Patient Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patient Details</Text>
            <View style={styles.patientSearchRow}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search existing patient..."
                  placeholderTextColor={colors.textTertiary}
                  value={patientSearch}
                  onChangeText={setPatientSearch}
                />
              </View>
              <TouchableOpacity style={styles.addPatientBtn} onPress={handleAddPatient}>
                <Ionicons name="person-add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Patient search results */}
            {filteredPatients.length > 0 && (
              <View style={styles.patientResults}>
                {filteredPatients.map((patient) => (
                  <TouchableOpacity
                    key={patient._id}
                    style={styles.patientResultItem}
                    onPress={() => handlePatientSelect(patient)}
                  >
                    <Text style={styles.patientResultName}>{patient.name}</Text>
                    <Text style={styles.patientResultMobile}>{patient.mobile}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Selected patient display */}
            {selectedPatient && (
              <View style={styles.selectedPatientCard}>
                <Ionicons name="checkmark-circle" size={20} color={colors.accentSuccess} />
                <Text style={styles.selectedPatientText}>
                  {selectedPatient.name} • {selectedPatient.mobile}
                </Text>
              </View>
            )}
          </View>

          {/* Consultation Type Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consultation Type</Text>
            <View style={styles.consultationToggle}>
              <TouchableOpacity
                style={[
                  styles.consultationOption,
                  consultationType === "walk_in" && styles.consultationOptionSelected,
                ]}
                onPress={() => setConsultationType("walk_in")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={consultationType === "walk_in" ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.consultationOptionText,
                    consultationType === "walk_in" && styles.consultationOptionTextSelected,
                  ]}
                >
                  In-person
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.consultationOption,
                  consultationType === "online" && styles.consultationOptionSelected,
                ]}
                onPress={() => setConsultationType("online")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="videocam-outline"
                  size={18}
                  color={consultationType === "online" ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.consultationOptionText,
                    consultationType === "online" && styles.consultationOptionTextSelected,
                  ]}
                >
                  Online/Video
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Clinical Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clinical Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Symptoms, chronic history, or specific requirements..."
              placeholderTextColor={colors.textTertiary}
              value={clinicalNotes}
              onChangeText={setClinicalNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      )}

      {/* Confirm Button */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Confirm Appointment</Text>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
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
    paddingTop: Platform.OS === "ios" ? 52 : 24,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.spacing,
    paddingBottom: 24,
  },
  section: {
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  monthIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  monthText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  calendarCard: {
    padding: 16,
    borderRadius: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  monthNavBtn: {
    padding: 4,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  daysOfWeek: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayOfWeek: {
    flex: 1,
    alignItems: "center",
  },
  dayOfWeekText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDaySelected: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  calendarDayTextInactive: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  calendarDayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  slotBtn: {
    flex: 1,
    minWidth: "30%",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(0,0,0,0.1)" as any }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }),
  },
  slotBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotTimeOfDay: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  slotTimeOfDaySelected: {
    color: "#FFFFFF",
  },
  slotTime: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  slotTimeSelected: {
    color: "#FFFFFF",
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFF7ED",
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.accentAlert,
  },
  noSlotsCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noSlotsText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 12,
    textAlign: "center",
  },
  noSlotsHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  patientSearchRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 12,
  },
  addPatientBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  patientResults: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  patientResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  patientResultName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  patientResultMobile: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectedPatientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
  },
  selectedPatientText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  consultationToggle: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  consultationOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  consultationOptionSelected: {
    backgroundColor: "#E5EDFF",
    borderColor: colors.primary,
  },
  consultationOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  consultationOptionTextSelected: {
    color: colors.primary,
  },
  notesInput: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 100,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(0,0,0,0.1)" as any }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }),
  },
  footerBar: {
    paddingHorizontal: layout.spacing,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 16,
    backgroundColor: colors.primary,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
