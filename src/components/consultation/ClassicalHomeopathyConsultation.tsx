/**
 * Classical Homeopathy Consultation Component
 * 
 * Complete UI for Classical Homeopathy case entry and remedy suggestions
 */

import { useState, useEffect } from 'react';
import {
  Brain,
  Activity,
  Target,
  TrendingUp,
  Loader2,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ClassicalSymptomSelector } from './ClassicalSymptomSelector';
import { RemedySuggestionsCard } from './RemedySuggestionsCard';
import { classicalHomeopathyApi, StructuredCaseInput, RemedySuggestion } from '@/lib/api/classicalHomeopathy.api';
import { Symptom } from '@/hooks/useSymptoms';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectedSymptom {
  symptomId: string;
  symptom: ExtendedSymptom;
  category: 'mental' | 'general' | 'particular' | 'modality';
  location?: string;
  sensation?: string;
  type?: 'better' | 'worse';
  weight?: number;
}

interface ClassicalHomeopathyConsultationProps {
  patientId: string;
  symptoms: ExtendedSymptom[];
  onCaseRecordCreated?: (caseRecordId: string) => void;
  onPrescriptionCreated?: (prescriptionId: string) => void;
}

export function ClassicalHomeopathyConsultation({
  patientId,
  symptoms,
  onCaseRecordCreated,
  onPrescriptionCreated,
}: ClassicalHomeopathyConsultationProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [pathologyTags, setPathologyTags] = useState<string[]>([]);
  const [pathologyInput, setPathologyInput] = useState('');
  const [suggestions, setSuggestions] = useState<RemedySuggestion[]>([]);
  const [caseRecordId, setCaseRecordId] = useState<string | null>(null);
  const [selectedRemedy, setSelectedRemedy] = useState<RemedySuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [finalRemedy, setFinalRemedy] = useState({
    potency: '',
    repetition: '',
    notes: '',
  });

  // Filter symptoms for Classical Homeopathy
  // Allow symptoms with classical_homeopathy modality or symptoms without modality set (for backward compatibility)
  const classicalSymptoms = symptoms.filter(
    (s) => s.modality === 'classical_homeopathy' || !s.modality
  );

  // Debug: Log symptoms count
  useEffect(() => {
    console.log('🔍 Classical Homeopathy Consultation Debug:');
    console.log('Total symptoms received:', symptoms.length);
    console.log('Classical symptoms filtered:', classicalSymptoms.length);
    console.log('Sample symptoms:', symptoms.slice(0, 5).map(s => ({ 
      name: s.name, 
      modality: s.modality, 
      category: s.category 
    })));
  }, [symptoms, classicalSymptoms]);

  const handleAddSymptom = (symptom: SelectedSymptom) => {
    setSelectedSymptoms((prev) => [...prev, symptom]);
  };

  const handleRemoveSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s.symptomId !== symptomId));
  };

  const handleUpdateSymptom = (symptomId: string, updates: Partial<SelectedSymptom>) => {
    setSelectedSymptoms((prev) =>
      prev.map((s) => (s.symptomId === symptomId ? { ...s, ...updates } : s))
    );
  };

  const handleAddPathologyTag = () => {
    if (pathologyInput.trim() && !pathologyTags.includes(pathologyInput.trim())) {
      setPathologyTags((prev) => [...prev, pathologyInput.trim()]);
      setPathologyInput('');
    }
  };

  const handleRemovePathologyTag = (tag: string) => {
    setPathologyTags((prev) => prev.filter((t) => t !== tag));
  };

  const buildStructuredCase = (): StructuredCaseInput => {
    return {
      mental: selectedSymptoms
        .filter((s) => s.category === 'mental')
        .map((s) => ({
          symptomText: s.symptom.name,
          weight: s.weight || 3,
        })),
      generals: selectedSymptoms
        .filter((s) => s.category === 'general')
        .map((s) => ({
          symptomText: s.symptom.name,
          weight: s.weight || 2,
        })),
      particulars: selectedSymptoms
        .filter((s) => s.category === 'particular')
        .map((s) => ({
          symptomText: s.symptom.name,
          location: s.location,
          sensation: s.sensation,
          weight: s.weight || 1,
        })),
      modalities: selectedSymptoms
        .filter((s) => s.category === 'modality')
        .map((s) => ({
          symptomText: s.symptom.name,
          type: s.type || 'worse',
          weight: s.weight || 1.5,
        })),
      pathologyTags,
    };
  };

  const handleGetSuggestions = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error('Please add at least one symptom');
      return;
    }

    setLoading(true);
    try {
      const structuredCase = buildStructuredCase();
      const response = await classicalHomeopathyApi.suggestRemedies(
        patientId,
        structuredCase
      );

      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to get suggestions');
        return;
      }

      setSuggestions(response.data.suggestions.topRemedies);
      setCaseRecordId(response.data.caseRecordId);
      
      if (onCaseRecordCreated) {
        onCaseRecordCreated(response.data.caseRecordId);
      }

      toast.success(
        `Found ${response.data.suggestions.topRemedies.length} remedy suggestions`
      );
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      toast.error(error.message || 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRemedy = (remedy: RemedySuggestion) => {
    setSelectedRemedy(remedy);
    setFinalRemedy({
      potency: remedy.suggestedPotency,
      repetition: remedy.repetition,
      notes: '',
    });
  };

  const handleSaveDecision = async () => {
    if (!selectedRemedy || !caseRecordId) {
      toast.error('Please select a remedy first');
      return;
    }

    if (!finalRemedy.potency || !finalRemedy.repetition) {
      toast.error('Please fill in potency and repetition');
      return;
    }

    setLoading(true);
    try {
      const response = await classicalHomeopathyApi.updateDoctorDecision(
        caseRecordId,
        {
          remedyId: selectedRemedy.remedy.id,
          remedyName: selectedRemedy.remedy.name,
          potency: finalRemedy.potency,
          repetition: finalRemedy.repetition,
          notes: finalRemedy.notes,
        }
      );

      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to save decision');
        return;
      }

      toast.success('Remedy decision saved and prescription created successfully');

      // Notify parent component about prescription creation
      if (onPrescriptionCreated && response.data.prescription?._id) {
        onPrescriptionCreated(response.data.prescription._id);
      }
    } catch (error: any) {
      console.error('Error saving decision:', error);
      toast.error(error.message || 'Failed to save decision');
    } finally {
      setLoading(false);
    }
  };

  const symptomCounts = {
    mental: selectedSymptoms.filter((s) => s.category === 'mental').length,
    general: selectedSymptoms.filter((s) => s.category === 'general').length,
    particular: selectedSymptoms.filter((s) => s.category === 'particular').length,
    modality: selectedSymptoms.filter((s) => s.category === 'modality').length,
  };

  // Show warning if no symptoms available
  if (classicalSymptoms.length === 0 && symptoms.length > 0) {
    return (
      <div className="medical-card border-warning/30 bg-warning/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">No Classical Homeopathy Symptoms Found</h3>
            <p className="text-sm text-muted-foreground mb-3">
              You have {symptoms.length} symptom(s) in your database, but none are marked for Classical Homeopathy.
            </p>
            <p className="text-sm text-muted-foreground">
              Please add Classical Homeopathy symptoms from the <strong>Symptoms</strong> page, or update existing symptoms to include <code className="text-xs bg-muted px-1.5 py-0.5 rounded">modality: classical_homeopathy</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (symptoms.length === 0) {
    return (
      <div className="medical-card border-warning/30 bg-warning/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">No Symptoms Available</h3>
            <p className="text-sm text-muted-foreground">
              Please add symptoms from the <strong>Symptoms</strong> page first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Structured Case Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Structured Case Entry
          </h2>
          <Badge variant="outline" className="text-sm">
            {selectedSymptoms.length} {selectedSymptoms.length === 1 ? 'Symptom' : 'Symptoms'}
            {classicalSymptoms.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({classicalSymptoms.length} available)
              </span>
            )}
          </Badge>
        </div>

        {/* Symptom Categories */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ClassicalSymptomSelector
            symptoms={classicalSymptoms}
            selectedSymptoms={selectedSymptoms}
            onAdd={handleAddSymptom}
            onRemove={handleRemoveSymptom}
            onUpdate={handleUpdateSymptom}
            category="mental"
            title="Mental Symptoms"
            icon={<Brain className="h-5 w-5" />}
            description="Mental state, emotions, fears, anxieties"
          />

          <ClassicalSymptomSelector
            symptoms={classicalSymptoms}
            selectedSymptoms={selectedSymptoms}
            onAdd={handleAddSymptom}
            onRemove={handleRemoveSymptom}
            onUpdate={handleUpdateSymptom}
            category="general"
            title="General Symptoms"
            icon={<Activity className="h-5 w-5" />}
            description="General body symptoms, appetite, sleep, etc."
          />

          <ClassicalSymptomSelector
            symptoms={classicalSymptoms}
            selectedSymptoms={selectedSymptoms}
            onAdd={handleAddSymptom}
            onRemove={handleRemoveSymptom}
            onUpdate={handleUpdateSymptom}
            category="particular"
            title="Particular Symptoms"
            icon={<Target className="h-5 w-5" />}
            description="Specific location with sensation"
          />

          <ClassicalSymptomSelector
            symptoms={classicalSymptoms}
            selectedSymptoms={selectedSymptoms}
            onAdd={handleAddSymptom}
            onRemove={handleRemoveSymptom}
            onUpdate={handleUpdateSymptom}
            category="modality"
            title="Modalities"
            icon={<TrendingUp className="h-5 w-5" />}
            description="Better or worse conditions"
          />
        </div>

        {/* Pathology Tags */}
        <div className="medical-card border-border/50">
          <h3 className="mb-3 font-semibold text-foreground">Pathology Tags</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={pathologyInput}
                onChange={(e) => setPathologyInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPathologyTag();
                  }
                }}
                placeholder="e.g., Acute, Chronic, Fever, etc."
                className="flex-1"
              />
              <Button onClick={handleAddPathologyTag} variant="outline">
                Add
              </Button>
            </div>
            {pathologyTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pathologyTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemovePathologyTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Get Suggestions Button */}
        <Button
          onClick={handleGetSuggestions}
          disabled={loading || selectedSymptoms.length === 0}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Case...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Get Remedy Suggestions
            </>
          )}
        </Button>
      </div>

      {/* Remedy Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <RemedySuggestionsCard
            suggestions={suggestions}
            onSelectRemedy={handleSelectRemedy}
            selectedRemedyId={selectedRemedy?.remedy.id}
          />

          {/* Final Remedy Selection */}
          {selectedRemedy && (
            <div className="medical-card border-primary/20 bg-primary/5">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Selected Remedy</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Remedy</Label>
                  <div className="rounded-lg border border-border/50 bg-background p-3">
                    <div className="font-medium text-foreground">
                      {selectedRemedy.remedy.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Match Score: {selectedRemedy.matchScore.toFixed(1)}% •{' '}
                      {selectedRemedy.confidence} confidence
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="potency">Potency *</Label>
                    <Select
                      value={finalRemedy.potency}
                      onValueChange={(value) =>
                        setFinalRemedy({ ...finalRemedy, potency: value })
                      }
                    >
                      <SelectTrigger id="potency">
                        <SelectValue placeholder="Select potency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6C">6C</SelectItem>
                        <SelectItem value="30C">30C</SelectItem>
                        <SelectItem value="200C">200C</SelectItem>
                        <SelectItem value="1M">1M</SelectItem>
                        <SelectItem value="10M">10M</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="repetition">Repetition *</Label>
                    <Select
                      value={finalRemedy.repetition}
                      onValueChange={(value) =>
                        setFinalRemedy({ ...finalRemedy, repetition: value })
                      }
                    >
                      <SelectTrigger id="repetition">
                        <SelectValue placeholder="Select repetition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OD">OD (Once Daily)</SelectItem>
                        <SelectItem value="BD">BD (Twice Daily)</SelectItem>
                        <SelectItem value="TDS">TDS (Thrice Daily)</SelectItem>
                        <SelectItem value="QID">QID (Four Times Daily)</SelectItem>
                        <SelectItem value="SOS">SOS (As Needed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={finalRemedy.notes}
                    onChange={(e) =>
                      setFinalRemedy({ ...finalRemedy, notes: e.target.value })
                    }
                    placeholder="Additional notes about this remedy selection..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSaveDecision}
                  disabled={loading || !finalRemedy.potency || !finalRemedy.repetition}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Remedy Decision
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
