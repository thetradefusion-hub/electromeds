/**
 * Classical Homeopathy Symptom Selector Component
 * 
 * Allows selection of symptoms with category, location, and sensation
 */

import { useState, useMemo } from 'react';
import { Search, Plus, X, Brain, Activity, Target, TrendingUp, Info, Lightbulb, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Symptom } from '@/hooks/useSymptoms';
import { Badge } from '@/components/ui/badge';

// Extend Symptom interface to include modality
interface ExtendedSymptom extends Symptom {
  modality?: 'electro_homeopathy' | 'classical_homeopathy';
  code?: string;
}

interface SelectedSymptom {
  symptomId: string;
  symptom: ExtendedSymptom;
  category: 'mental' | 'general' | 'particular' | 'modality';
  location?: string;
  sensation?: string;
  type?: 'better' | 'worse'; // For modalities
  weight?: number;
}

interface ClassicalSymptomSelectorProps {
  symptoms: ExtendedSymptom[];
  selectedSymptoms: SelectedSymptom[];
  onAdd: (symptom: SelectedSymptom) => void;
  onRemove: (symptomId: string) => void;
  onUpdate: (symptomId: string, updates: Partial<SelectedSymptom>) => void;
  category: 'mental' | 'general' | 'particular' | 'modality';
  title: string;
  icon: React.ReactNode;
  description?: string;
}

export function ClassicalSymptomSelector({
  symptoms,
  selectedSymptoms,
  onAdd,
  onRemove,
  onUpdate,
  category,
  title,
  icon,
  description,
}: ClassicalSymptomSelectorProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSymptomId, setSelectedSymptomId] = useState<string>('');
  const [location, setLocation] = useState('');
  const [sensation, setSensation] = useState('');
  const [type, setType] = useState<'better' | 'worse'>('worse');

  // Filter symptoms by category and modality
  // Allow all symptoms that match modality filter - users can assign them to any category
  const filteredSymptoms = useMemo(() => {
    const filtered = symptoms.filter(
      (s) => {
        // Check modality - allow classical_homeopathy or symptoms without modality set (for backward compatibility)
        const modalityMatch = s.modality === 'classical_homeopathy' || !s.modality;
        
        // Don't filter by category - allow all symptoms, user will assign category when adding
        // This is more flexible and user-friendly
        
        const searchMatch = s.name.toLowerCase().includes(search.toLowerCase());
        const notSelected = !selectedSymptoms.find((ss) => ss.symptomId === s.id);
        
        return modalityMatch && searchMatch && notSelected;
      }
    );
    
    // Debug logging
    if (search && filtered.length === 0) {
      console.log('🔍 ClassicalSymptomSelector Debug:', {
        category,
        search,
        totalSymptoms: symptoms.length,
        modalityMatch: symptoms.filter(s => s.modality === 'classical_homeopathy' || !s.modality).length,
        searchMatch: symptoms.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).length,
      });
    }
    
    return filtered;
  }, [symptoms, search, selectedSymptoms, category]);

  // Get selected symptoms for this category
  const categorySymptoms = selectedSymptoms.filter((s) => s.category === category);

  const handleAddSymptom = () => {
    if (!selectedSymptomId) {
      return;
    }

    const symptom = symptoms.find((s) => s.id === selectedSymptomId);
    if (!symptom) return;

    const newSymptom: SelectedSymptom = {
      symptomId: symptom.id,
      symptom,
      category,
      ...(category === 'particular' && { location, sensation }),
      ...(category === 'modality' && { type }),
    };

    onAdd(newSymptom);
    setSelectedSymptomId('');
    setLocation('');
    setSensation('');
    setShowAddForm(false);
    setSearch('');
  };

  const getDefaultWeight = (cat: string): number => {
    switch (cat) {
      case 'mental':
        return 3;
      case 'general':
        return 2;
      case 'particular':
        return 1;
      case 'modality':
        return 1.5;
      default:
        return 1;
    }
  };

  // Category-specific suggestions/examples
  const categorySuggestions: Record<string, { examples: string[]; tip: string }> = {
    mental: {
      examples: ['Anxiety', 'Fear', 'Irritability', 'Depression', 'Confusion', 'Anger', 'Restlessness', 'Memory Loss'],
      tip: 'Mental symptoms include emotions, fears, anxieties, mental states, and behavioral patterns. These are MOST important in Classical Homeopathy.',
    },
    general: {
      examples: ['Fever', 'Thirst', 'Appetite', 'Sleep', 'Sweating', 'Weakness', 'Fatigue', 'Cold Intolerance'],
      tip: 'General symptoms affect the whole body - appetite, sleep, thirst, temperature preferences, energy levels, etc.',
    },
    particular: {
      examples: ['Headache', 'Back Pain', 'Throat Pain', 'Joint Pain', 'Skin Rash', 'Eye Pain', 'Chest Pain'],
      tip: 'Particular symptoms are localized to a specific body part with specific sensations (burning, throbbing, etc.).',
    },
    modality: {
      examples: ['Worse from Motion', 'Better from Rest', 'Worse at Night', 'Better from Heat', 'Worse from Cold'],
      tip: 'Modalities describe conditions that make symptoms better or worse (time, weather, position, etc.).',
    },
  };

  const suggestions = categorySuggestions[category] || { examples: [], tip: '' };
  
  // Find matching symptoms from suggestions
  const suggestedSymptoms = useMemo(() => {
    return suggestions.examples
      .map(example => symptoms.find(s => 
        s.name.toLowerCase().includes(example.toLowerCase()) ||
        example.toLowerCase().includes(s.name.toLowerCase())
      ))
      .filter((s): s is ExtendedSymptom => s !== undefined && !selectedSymptoms.find(ss => ss.symptomId === s.id))
      .slice(0, 6); // Limit to 6 suggestions
  }, [symptoms, suggestions.examples, selectedSymptoms]);

  return (
    <div className="medical-card border-border/50">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/50 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Symptom
        </button>
      </div>

      {/* Guidance Info Card */}
      {categorySymptoms.length === 0 && !showAddForm && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-1.5 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                What to add in {title}?
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{suggestions.tip}</p>
              
              {suggestions.examples.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">Example symptoms:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.examples.slice(0, 8).map((example, idx) => {
                      const matchingSymptom = symptoms.find(s => 
                        s.name.toLowerCase().includes(example.toLowerCase()) ||
                        example.toLowerCase().includes(s.name.toLowerCase())
                      );
                      const isSelected = matchingSymptom && selectedSymptoms.find(ss => ss.symptomId === matchingSymptom.id);
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (matchingSymptom && !isSelected) {
                              const newSymptom: SelectedSymptom = {
                                symptomId: matchingSymptom.id,
                                symptom: matchingSymptom,
                                category,
                                ...(category === 'modality' && { type: 'worse' }),
                              };
                              onAdd(newSymptom);
                            }
                          }}
                          disabled={!matchingSymptom || !!isSelected}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                            matchingSymptom && !isSelected
                              ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 cursor-pointer"
                              : matchingSymptom && isSelected
                              ? "border-green-500/30 bg-green-500/10 text-green-600 cursor-not-allowed"
                              : "border-border/30 bg-muted/50 text-muted-foreground cursor-not-allowed"
                          )}
                        >
                          {isSelected ? '✓ ' : ''}{example}
                        </button>
                      );
                    })}
                  </div>
                  {suggestedSymptoms.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>{suggestedSymptoms.length} matching symptom{suggestedSymptoms.length > 1 ? 's' : ''} available in your database</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Symptom Form */}
      {showAddForm && (
        <div className="mb-4 space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
          {/* Quick Suggestions */}
          {suggestedSymptoms.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-medium text-foreground">Quick Add - Suggested for {title}:</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedSymptoms.map((symptom) => (
                  <button
                    key={symptom.id}
                    onClick={() => {
                      const newSymptom: SelectedSymptom = {
                        symptomId: symptom.id,
                        symptom,
                        category,
                        ...(category === 'modality' && { type: 'worse' }),
                      };
                      onAdd(newSymptom);
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20 hover:border-primary/50"
                  >
                    <Plus className="h-3 w-3" />
                    {symptom.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}... (e.g., ${suggestions.examples.slice(0, 2).join(', ')})`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="medical-input pl-10"
            />
          </div>

          {search && (
            <>
              {filteredSymptoms.length > 0 ? (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border/30 bg-background">
                  {filteredSymptoms.slice(0, 10).map((symptom) => (
                    <button
                      key={symptom.id}
                      onClick={() => {
                        setSelectedSymptomId(symptom.id);
                        setSearch(symptom.name);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors"
                    >
                      <div className="font-medium text-foreground">{symptom.name}</div>
                      {symptom.code && (
                        <div className="text-xs text-muted-foreground">{symptom.code}</div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border/30 bg-muted/30 p-3 text-center text-sm text-muted-foreground">
                  {symptoms.length === 0 ? (
                    <div>
                      <p className="font-medium">No symptoms available</p>
                      <p className="text-xs mt-1">Please add symptoms from the Symptoms page first</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">No symptoms found</p>
                      <p className="text-xs mt-1">
                        Try a different search term. Total symptoms: {symptoms.length}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {category === 'particular' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Head, Chest, Right side"
                  className="medical-input text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Sensation (Optional)
                </label>
                <input
                  type="text"
                  value={sensation}
                  onChange={(e) => setSensation(e.target.value)}
                  placeholder="e.g., Burning, Throbbing, Aching"
                  className="medical-input text-sm"
                />
              </div>
            </div>
          )}

          {category === 'modality' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setType('better')}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    type === 'better'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/50 bg-background text-foreground hover:bg-secondary'
                  )}
                >
                  Better
                </button>
                <button
                  onClick={() => setType('worse')}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    type === 'worse'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/50 bg-background text-foreground hover:bg-secondary'
                  )}
                >
                  Worse
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAddSymptom}
              disabled={!selectedSymptomId}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setSearch('');
                setSelectedSymptomId('');
              }}
              className="rounded-lg border border-border/50 bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Selected Symptoms */}
      {categorySymptoms.length > 0 && (
        <div className="space-y-2">
          {categorySymptoms.map((selected) => (
            <div
              key={selected.symptomId}
              className="group flex items-center justify-between rounded-lg border border-border/50 bg-card p-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {selected.symptom.name}
                  </span>
                  {selected.symptom.code && (
                    <span className="text-xs text-muted-foreground">
                      ({selected.symptom.code})
                    </span>
                  )}
                  {selected.category === 'modality' && selected.type && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        selected.type === 'better'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      )}
                    >
                      {selected.type}
                    </span>
                  )}
                </div>
                {selected.location && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Location: {selected.location}
                  </div>
                )}
                {selected.sensation && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Sensation: {selected.sensation}
                  </div>
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  Weight: {selected.weight || getDefaultWeight(selected.category)}x
                </div>
              </div>
              <button
                onClick={() => onRemove(selected.symptomId)}
                className="ml-2 rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {categorySymptoms.length === 0 && !showAddForm && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No {title.toLowerCase()} symptoms added yet
        </div>
      )}
    </div>
  );
}
