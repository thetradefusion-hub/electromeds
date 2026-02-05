/**
 * Extracted Symptoms List Component
 * 
 * Displays list of extracted symptoms with filtering and bulk actions
 */

import { useState, useMemo, useEffect } from 'react';
import { ExtractedSymptomCard } from './ExtractedSymptomCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { ExtractedSymptom } from '@/lib/api/aiCaseTaking.api';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const categoryColors = {
  mental: 'border-blue-300 bg-blue-50/30',
  general: 'border-blue-300 bg-blue-50/30',
  particular: 'border-orange-300 bg-orange-50/30',
  modality: 'border-green-300 bg-green-50/30',
};

interface ExtractedSymptomsListProps {
  symptoms: ExtractedSymptom[];
  onConfirm: (symptom: ExtractedSymptom) => void;
  onReject: (symptom: ExtractedSymptom) => void;
  onUpdate?: (symptom: ExtractedSymptom, updates: Partial<ExtractedSymptom>) => void;
  onConfirmAll?: () => void;
  onRejectAll?: () => void;
  enableDragDrop?: boolean; // Enable drag-drop for category changes
  onSuggestRubrics?: (symptom: ExtractedSymptom) => void; // New prop for rubric suggestions
}

// Sortable Symptom Card Wrapper
function SortableSymptomCard({
  symptom,
  index,
  onConfirm,
  onReject,
  onUpdate,
  onSuggestRubrics,
}: {
  symptom: ExtractedSymptom;
  index: number;
  onConfirm: (symptom: ExtractedSymptom) => void;
  onReject: (symptom: ExtractedSymptom) => void;
  onUpdate?: (symptom: ExtractedSymptom, updates: Partial<ExtractedSymptom>) => void;
  onSuggestRubrics?: (symptom: ExtractedSymptom) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: symptom.symptomCode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ExtractedSymptomCard
        symptom={symptom}
        onConfirm={onConfirm}
        onReject={() => onReject(symptom)}
        onUpdate={(updates) => onUpdate?.(symptom, updates)}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        onSuggestRubrics={onSuggestRubrics}
      />
    </div>
  );
}

export function ExtractedSymptomsList({
  symptoms,
  onConfirm,
  onReject,
  onUpdate,
  onConfirmAll,
  onRejectAll,
  enableDragDrop = true,
  onSuggestRubrics,
}: ExtractedSymptomsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'category' | 'name'>('confidence');
  const [localSymptoms, setLocalSymptoms] = useState<ExtractedSymptom[]>(symptoms);

  // Update local symptoms when props change
  useEffect(() => {
    setLocalSymptoms(symptoms);
  }, [symptoms]);

  // Drag-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Check if dragging to a category drop zone
    const overId = over.id.toString();
    const categoryTypes = ['mental', 'general', 'particular', 'modality'];
    
    if (categoryTypes.includes(overId)) {
      // Change category
      const symptom = localSymptoms.find((s) => s.symptomCode === active.id);
      if (symptom && onUpdate) {
        onUpdate(symptom, { category: overId as ExtractedSymptom['category'] });
      }
    } else {
      // Reorder within list
      const oldIndex = localSymptoms.findIndex((s) => s.symptomCode === active.id);
      const newIndex = localSymptoms.findIndex((s) => s.symptomCode === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSymptoms = arrayMove(localSymptoms, oldIndex, newIndex);
        setLocalSymptoms(newSymptoms);
      }
    }
  };

  // Filter and sort symptoms
  const filteredSymptoms = useMemo(() => {
    let filtered = [...localSymptoms];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.symptomName.toLowerCase().includes(query) ||
          s.location?.toLowerCase().includes(query) ||
          s.sensation?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((s) => s.category === categoryFilter);
    }

    // Confidence filter
    if (confidenceFilter !== 'all') {
      filtered = filtered.filter((s) => s.confidence === confidenceFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          const confidenceOrder = { exact: 4, high: 3, medium: 2, low: 1 };
          return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
        case 'category':
          return a.category.localeCompare(b.category);
        case 'name':
          return a.symptomName.localeCompare(b.symptomName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [localSymptoms, searchQuery, categoryFilter, confidenceFilter, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const byCategory = {
      mental: localSymptoms.filter((s) => s.category === 'mental').length,
      general: localSymptoms.filter((s) => s.category === 'general').length,
      particular: localSymptoms.filter((s) => s.category === 'particular').length,
      modality: localSymptoms.filter((s) => s.category === 'modality').length,
    };
    const byConfidence = {
      exact: localSymptoms.filter((s) => s.confidence === 'exact').length,
      high: localSymptoms.filter((s) => s.confidence === 'high').length,
      medium: localSymptoms.filter((s) => s.confidence === 'medium').length,
      low: localSymptoms.filter((s) => s.confidence === 'low').length,
    };
    return { byCategory, byConfidence };
  }, [localSymptoms]);

  if (localSymptoms.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No symptoms extracted yet.</p>
        <p className="text-sm mt-1">Enter text and click "Extract Symptoms" to begin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">
            Extracted Symptoms ({localSymptoms.length})
          </h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>
              Mental: {stats.byCategory.mental} | General: {stats.byCategory.general} |
              Particular: {stats.byCategory.particular} | Modality: {stats.byCategory.modality}
            </span>
          </div>
        </div>
        {(onConfirmAll || onRejectAll) && (
          <div className="flex items-center gap-2">
            {onConfirmAll && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onConfirmAll}
                className="h-8"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Confirm All
              </Button>
            )}
            {onRejectAll && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRejectAll}
                className="h-8 text-destructive"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject All
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="mental">Mental</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="particular">Particular</SelectItem>
            <SelectItem value="modality">Modality</SelectItem>
          </SelectContent>
        </Select>
        <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Confidence</SelectItem>
            <SelectItem value="exact">Exact Match</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confidence">Sort by Confidence</SelectItem>
            <SelectItem value="category">Sort by Category</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      {filteredSymptoms.length !== localSymptoms.length && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredSymptoms.length} of {localSymptoms.length} symptoms
        </div>
      )}

      {/* Category Drop Zones (if drag-drop enabled) */}
      {enableDragDrop && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {(['mental', 'general', 'particular', 'modality'] as const).map((category) => (
            <div
              key={category}
              id={category}
              className={cn(
                'border-2 border-dashed rounded-lg p-3 text-center text-xs',
                'bg-muted/30 hover:bg-muted/50 transition-colors',
                categoryColors[category]
              )}
            >
              <div className="font-medium capitalize">{category}</div>
              <div className="text-muted-foreground mt-1">
                Drop here to change category
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Symptoms List */}
      <DndContext
        sensors={enableDragDrop ? sensors : undefined}
        collisionDetection={closestCenter}
        onDragEnd={enableDragDrop ? handleDragEnd : undefined}
      >
        <SortableContext
          items={filteredSymptoms.map((s) => s.symptomCode)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {filteredSymptoms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No symptoms match your filters.</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setConfidenceFilter('all');
                  }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              filteredSymptoms.map((symptom, index) => (
                <SortableSymptomCard
                  key={`${symptom.symptomCode}-${index}`}
                  symptom={symptom}
                  index={index}
                  onConfirm={onConfirm}
                  onReject={onReject}
                  onUpdate={onUpdate}
                  onSuggestRubrics={onSuggestRubrics}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
