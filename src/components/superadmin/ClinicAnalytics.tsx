import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';
import { patientApi } from '@/lib/api/patient.api';
import { prescriptionApi } from '@/lib/api/prescription.api';
import { medicineApi } from '@/lib/api/medicine.api';
import { symptomApi } from '@/lib/api/symptom.api';
import { doctorApi } from '@/lib/api/doctor.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Pill, Stethoscope, TrendingUp, Calendar, FileText, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

const COLORS = ['hsl(226, 71%, 40%)', 'hsl(162, 91%, 31%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(280, 65%, 60%)'];

const ClinicAnalytics = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-analytics-enhanced'],
    queryFn: async () => {
      const [platformStats, doctorsResult, patientsResult, prescriptionsResult, symptomsResult, medicinesResult] = await Promise.all([
        adminApi.getPlatformStats(),
        adminApi.getAllDoctors(),
        patientApi.getPatients(),
        prescriptionApi.getPrescriptions(),
        adminApi.getGlobalSymptoms(), // Use admin API for all global symptoms
        adminApi.getGlobalMedicines(), // Use admin API for all global medicines
      ]);

      const today = startOfDay(new Date());
      const last30Days = subDays(today, 30);
      const last7Days = subDays(today, 7);

      const patients = patientsResult.data?.data || [];
      const prescriptions = prescriptionsResult.data?.data || [];
      const doctors = doctorsResult.data?.data || [];
      // adminApi.getGlobalSymptoms() and getGlobalMedicines() return { success, data, count }
      const symptoms = symptomsResult.data?.data || [];
      const medicines = medicinesResult.data?.data || [];

      // Calculate daily patient registrations for last 30 days
      const dailyPatients = eachDayOfInterval({ start: last30Days, end: today }).map(date => {
        const dayStr = format(date, 'yyyy-MM-dd');
        const count = patients.filter((p: any) => 
          format(new Date(p.createdAt), 'yyyy-MM-dd') === dayStr
        ).length || 0;
        return { date: format(date, 'MMM dd'), patients: count };
      });

      // Calculate daily prescriptions for last 30 days
      const dailyPrescriptions = eachDayOfInterval({ start: last30Days, end: today }).map(date => {
        const dayStr = format(date, 'yyyy-MM-dd');
        const count = prescriptions.filter((p: any) => 
          format(new Date(p.createdAt), 'yyyy-MM-dd') === dayStr
        ).length || 0;
        return { date: format(date, 'MMM dd'), prescriptions: count };
      });

      // Weekly comparison
      const thisWeekPatients = patients.filter((p: any) => new Date(p.createdAt) >= last7Days).length || 0;
      const lastWeekStart = subDays(last7Days, 7);
      const lastWeekPatients = patients.filter((p: any) => {
        const date = new Date(p.createdAt);
        return date >= lastWeekStart && date < last7Days;
      }).length || 0;

      // Case type distribution
      const newCases = patients.filter((p: any) => p.caseType === 'new').length || 0;
      const followUpCases = patients.filter((p: any) => p.caseType === 'old').length || 0;

      // Gender distribution
      const malePatients = patients.filter((p: any) => p.gender?.toLowerCase() === 'male').length || 0;
      const femalePatients = patients.filter((p: any) => p.gender?.toLowerCase() === 'female').length || 0;
      const otherPatients = patients.length - malePatients - femalePatients;

      // Today's stats
      const todayPatientsCount = patients.filter((p: any) => new Date(p.createdAt) >= today).length || 0;
      const todayPrescriptionsCount = prescriptions.filter((p: any) => new Date(p.createdAt) >= today).length || 0;

      // Global symptoms and medicines count (already filtered by adminApi, but use platformStats for accuracy)
      const globalSymptomsCount = platformStats.data?.totalGlobalSymptoms || symptoms.length || 0;
      const globalMedicinesCount = platformStats.data?.totalGlobalMedicines || medicines.length || 0;

      // Modality breakdown
      const electroPrescriptions = prescriptions.filter((p: any) => p.modality === 'electro_homeopathy').length || 0;
      const classicalPrescriptions = prescriptions.filter((p: any) => p.modality === 'classical_homeopathy').length || 0;
      const electroDoctors = doctors.filter((d: any) => d.modality === 'electro_homeopathy').length || 0;
      const classicalDoctors = doctors.filter((d: any) => d.modality === 'classical_homeopathy').length || 0;
      const bothModalityDoctors = doctors.filter((d: any) => d.modality === 'both').length || 0;

      return {
        totalDoctors: platformStats.data?.totalDoctors || doctors.length || 0,
        totalPatients: platformStats.data?.totalPatients || patients.length || 0,
        totalPrescriptions: platformStats.data?.totalPrescriptions || prescriptions.length || 0,
        todayPatients: todayPatientsCount,
        todayPrescriptions: todayPrescriptionsCount,
        globalSymptoms: globalSymptomsCount,
        globalMedicines: globalMedicinesCount,
        // Classical Homeopathy stats
        totalCaseRecords: platformStats.data?.totalCaseRecords || 0,
        totalRemedies: platformStats.data?.totalRemedies || 0,
        totalRubrics: platformStats.data?.totalRubrics || 0,
        // Modality breakdown
        electroPrescriptions,
        classicalPrescriptions,
        electroDoctors,
        classicalDoctors,
        bothModalityDoctors,
        dailyPatients,
        dailyPrescriptions,
        thisWeekPatients,
        lastWeekPatients,
        weeklyGrowth: lastWeekPatients > 0 
          ? Math.round(((thisWeekPatients - lastWeekPatients) / lastWeekPatients) * 100) 
          : thisWeekPatients > 0 ? 100 : 0,
        caseDistribution: [
          { name: 'New Cases', value: newCases },
          { name: 'Follow-ups', value: followUpCases },
        ],
        genderDistribution: [
          { name: 'Male', value: malePatients },
          { name: 'Female', value: femalePatients },
          { name: 'Other', value: otherPatients },
        ].filter(g => g.value > 0),
        modalityDistribution: [
          { name: 'Electro Homeopathy', value: electroPrescriptions },
          { name: 'Classical Homeopathy', value: classicalPrescriptions },
        ].filter(m => m.value > 0),
      };
    },
  });

  const analyticsCards = [
    {
      title: 'Total Doctors',
      value: stats?.totalDoctors || 0,
      icon: Users,
      description: 'Registered doctors',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: UserPlus,
      description: 'All-time patients',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Total Prescriptions',
      value: stats?.totalPrescriptions || 0,
      icon: FileText,
      description: 'All-time prescriptions',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: "Today's Visits",
      value: stats?.todayPatients || 0,
      icon: Calendar,
      description: 'New patients today',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Global Symptoms',
      value: stats?.globalSymptoms || 0,
      icon: Stethoscope,
      description: 'Symptom library',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Global Medicines',
      value: stats?.globalMedicines || 0,
      icon: Pill,
      description: 'Medicine library',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Case Records',
      value: stats?.totalCaseRecords || 0,
      icon: FileText,
      description: 'Classical Homeopathy',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Remedies',
      value: stats?.totalRemedies || 0,
      icon: Pill,
      description: 'Classical Homeopathy',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: 'Electro Prescriptions',
      value: stats?.electroPrescriptions || 0,
      icon: FileText,
      description: 'Electro Homeopathy',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Classical Prescriptions',
      value: stats?.classicalPrescriptions || 0,
      icon: FileText,
      description: 'Classical Homeopathy',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {analyticsCards.map((card, index) => {
          const gradients = [
            'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
            'from-purple-500/10 to-pink-500/10 border-purple-500/20',
            'from-green-500/10 to-emerald-500/10 border-green-500/20',
            'from-orange-500/10 to-amber-500/10 border-orange-500/20',
            'from-red-500/10 to-rose-500/10 border-red-500/20',
            'from-teal-500/10 to-cyan-500/10 border-teal-500/20',
          ];
          const gradient = gradients[index % gradients.length];
          
          return (
            <Card 
              key={card.title}
              className={`relative overflow-hidden border-2 bg-gradient-to-br ${gradient} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold">{card.title}</CardTitle>
                <div className={`rounded-xl p-2.5 ${card.bgColor} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {card.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Patient Registration Trend */}
        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent border-b border-blue-500/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Patient Registration Trend
            </CardTitle>
            <CardDescription className="mt-1">Daily new patient registrations (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.dailyPatients || []}>
                  <defs>
                    <linearGradient id="patientGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(226, 71%, 40%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(226, 71%, 40%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="patients"
                    stroke="hsl(226, 71%, 40%)"
                    strokeWidth={2}
                    fill="url(#patientGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Prescription Trend */}
        <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-transparent border-b border-green-500/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-green-500/20">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              Prescription Trend
            </CardTitle>
            <CardDescription className="mt-1">Daily prescriptions issued (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.dailyPrescriptions || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar 
                    dataKey="prescriptions" 
                    fill="hsl(162, 91%, 31%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Weekly Comparison */}
        <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-transparent border-b border-purple-500/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              Weekly Growth
            </CardTitle>
            <CardDescription className="mt-1">Patient comparison with last week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="text-2xl font-bold">{stats?.thisWeekPatients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Week</span>
                <span className="text-lg font-medium text-muted-foreground">{stats?.lastWeekPatients}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Growth</span>
                <span className={`text-lg font-bold ${(stats?.weeklyGrowth || 0) >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {(stats?.weeklyGrowth || 0) >= 0 ? '+' : ''}{stats?.weeklyGrowth}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Distribution */}
        <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent border-b border-orange-500/20">
            <CardTitle className="text-lg">Case Distribution</CardTitle>
            <CardDescription className="mt-1">New vs Follow-up cases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.caseDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats?.caseDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {stats?.caseDistribution?.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card className="border-2 border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-teal-500/10 to-transparent border-b border-teal-500/20">
            <CardTitle className="text-lg">Gender Distribution</CardTitle>
            <CardDescription className="mt-1">Patient demographics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.genderDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats?.genderDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {stats?.genderDistribution?.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[(index + 1) % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClinicAnalytics;
