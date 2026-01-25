/**
 * Extracted Symptom Card Component
 * 
 * Displays an extracted symptom with options to confirm, reject, or edit
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  X,
  AlertCircle,
  Info,
  GripVertical,
  Star,
  Sparkles,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExtractedSymptom } from '@/lib/api/aiCaseTaking.api';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ExtractedSymptomCardProps {
  symptom: ExtractedSymptom;
  onConfirm: (symptom: ExtractedSymptom) => void;
  onReject: () => void;
  onUpdate?: (updates: Partial<ExtractedSymptom>) => void;
  showActions?: boolean;
  dragHandleProps?: any; // For drag-drop
  isDragging?: boolean;
  onSuggestRubrics?: (symptom: ExtractedSymptom) => void; // New prop for rubric suggestions
}

const confidenceColors = {
  exact: 'bg-green-100 text-green-800 border-green-300',
  high: 'bg-blue-100 text-blue-800 border-blue-300',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  low: 'bg-gray-100 text-gray-800 border-gray-300',
};

const confidenceLabels = {
  exact: 'Exact Match',
  high: 'High Confidence',
  medium: 'Medium Confidence',
  low: 'Low Confidence',
};

const categoryColors = {
  mental: 'bg-purple-100 text-purple-800 border-purple-300',
  general: 'bg-blue-100 text-blue-800 border-blue-300',
  particular: 'bg-orange-100 text-orange-800 border-orange-300',
  modality: 'bg-green-100 text-green-800 border-green-300',
};

export function ExtractedSymptomCard({
  symptom,
  onConfirm,
  onReject,
  onUpdate,
  showActions = true,
  dragHandleProps,
  isDragging = false,
  onSuggestRubrics,
}: ExtractedSymptomCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(symptom.symptomName);
  const [editedCategory, setEditedCategory] = useState(symptom.category);
  const [editedLocation, setEditedLocation] = useState(symptom.location || '');
  const [editedSensation, setEditedSensation] = useState(symptom.sensation || '');
  const [importance, setImportance] = useState(symptom.importance || 3);
  const [isSRP, setIsSRP] = useState(symptom.isSRP || false);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        symptomName: editedName,
        category: editedCategory as 'mental' | 'general' | 'particular' | 'modality',
        location: editedLocation || undefined,
        sensation: editedSensation || undefined,
        importance,
        isSRP,
      });
    }
    setIsEditing(false);
  };

  const handleImportanceChange = (value: number[]) => {
    const newImportance = value[0];
    setImportance(newImportance);
    if (onUpdate) {
      onUpdate({ importance: newImportance });
    }
  };

  const handleSRPChange = (checked: boolean) => {
    setIsSRP(checked);
    if (onUpdate) {
      onUpdate({ isSRP: checked });
    }
  };

  const handleCancel = () => {
    setEditedName(symptom.symptomName);
    setEditedCategory(symptom.category);
    setEditedLocation(symptom.location || '');
    setEditedSensation(symptom.sensation || '');
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'border rounded-lg p-4 space-y-3',
        'bg-card hover:bg-accent/50 transition-colors',
        symptom.confidence === 'low' && 'border-amber-300 bg-amber-50/50',
        isDragging && 'opacity-50 shadow-lg',
        isSRP && 'border-purple-400 bg-purple-50/30'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          {/* Drag Handle */}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-1"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          
          <div className="flex-1 space-y-2">
            {isEditing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="font-medium"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-sm">{symptom.symptomName}</h4>
                
                {/* Why Detected Button */}
                {symptom.whyDetected && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title="Why was this detected?"
                      >
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Why Detected?</h4>
                        <p className="text-xs text-muted-foreground">{symptom.whyDetected}</p>
                        {symptom.extractionMethod && (
                          <Badge variant="outline" className="text-xs">
                            Method: {symptom.extractionMethod.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                
                {/* AI Confidence Tooltip */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold">AI Confidence: {confidenceLabels[symptom.confidence]}</p>
                        {symptom.context && <p>Context: {symptom.context}</p>}
                        {symptom.matchedText && <p>Matched: "{symptom.matchedText}"</p>}
                        {symptom.extractionMethod && (
                          <p>Extraction: {symptom.extractionMethod === 'nlp' ? 'AI (NLP)' : 'Keyword Matching'}</p>
                        )}
                        {symptom.whyDetected && <p>Reason: {symptom.whyDetected}</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn('text-xs', confidenceColors[symptom.confidence])}
              >
                {confidenceLabels[symptom.confidence]}
              </Badge>
              <Badge
                variant="outline"
                className={cn('text-xs capitalize', categoryColors[symptom.category])}
              >
                {symptom.category}
              </Badge>
              {symptom.location && (
                <Badge variant="outline" className="text-xs">
                  Location: {symptom.location}
                </Badge>
              )}
              {symptom.sensation && (
                <Badge variant="outline" className="text-xs">
                  Sensation: {symptom.sensation}
                </Badge>
              )}
              {isSRP && (
                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-300">
                  <Sparkles className="h-3 w-3 mr-1" />
                  SRP
                </Badge>
              )}
            </div>

            {/* Importance Slider */}
            {!isEditing && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Importance</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Star
                        key={level}
                        className={cn(
                          'h-3 w-3',
                          level <= importance
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        )}
                      />
                    ))}
                    <span className="ml-1 font-medium">{importance}/5</span>
                  </div>
                </div>
                <Slider
                  value={[importance]}
                  onValueChange={handleImportanceChange}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>
            )}

            {/* SRP Checkbox */}
            {!isEditing && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`srp-${symptom.symptomCode}`}
                  checked={isSRP}
                  onCheckedChange={handleSRPChange}
                />
                <label
                  htmlFor={`srp-${symptom.symptomCode}`}
                  className="text-xs font-medium cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Strange, Rare, Peculiar
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && !isEditing && (
          <div className="flex items-center gap-1">
            {onSuggestRubrics && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSuggestRubrics(symptom)}
                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                title="Suggest rubrics"
              >
                <BookOpen className="h-3 w-3" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0"
              title="Edit symptom"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReject}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              title="Reject symptom"
            >
              <XCircle className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onConfirm(symptom)}
              className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
              title="Confirm symptom"
            >
              <CheckCircle2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Edit Mode */}
      {isEditing && (
        <div className="space-y-2 pt-2 border-t">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Category
              </label>
              <Select
                value={editedCategory}
                onValueChange={(value) =>
                  setEditedCategory(value as typeof symptom.category)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mental">Mental</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="particular">Particular</SelectItem>
                  <SelectItem value="modality">Modality</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Importance (1-5)
              </label>
              <div className="space-y-1">
                <Slider
                  value={[importance]}
                  onValueChange={(value) => setImportance(value[0])}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">1</span>
                  <span className="font-medium">{importance}/5</span>
                  <span className="text-muted-foreground">5</span>
                </div>
              </div>
            </div>
            {(editedCategory === 'particular' || editedCategory === 'modality') && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Location
                  </label>
                  <Input
                    value={editedLocation}
                    onChange={(e) => setEditedLocation(e.target.value)}
                    placeholder="e.g., right side, head"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Sensation
                  </label>
                  <Input
                    value={editedSensation}
                    onChange={(e) => setEditedSensation(e.target.value)}
                    placeholder="e.g., throbbing, burning"
                    className="h-8 text-xs"
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`srp-edit-${symptom.symptomCode}`}
              checked={isSRP}
              onCheckedChange={(checked) => setIsSRP(checked as boolean)}
            />
            <label
              htmlFor={`srp-edit-${symptom.symptomCode}`}
              className="text-xs font-medium cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Strange, Rare, Peculiar
            </label>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="h-7 text-xs"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Low Confidence Warning */}
      {symptom.confidence === 'low' && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            Low confidence match. Please review and edit if needed.
          </span>
        </div>
      )}
    </div>
  );
}
