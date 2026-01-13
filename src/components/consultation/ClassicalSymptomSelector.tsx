/**
 * Classical Homeopathy Symptom Selector Component
 * 
 * Allows selection of symptoms with category, location, and sensation
 */

import { useState, useMemo } from 'react';
import { Search, Plus, X, Brain, Activity, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Symptom } from '@/hooks/useSymptoms';

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

      {/* Add Symptom Form */}
      {showAddForm && (
        <div className="mb-4 space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search symptoms..."
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
