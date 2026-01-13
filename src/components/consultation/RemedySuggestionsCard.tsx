/**
 * Remedy Suggestions Card Component
 * 
 * Displays remedy suggestions with match score, confidence, and clinical reasoning
 */

import { useState } from 'react';
import {
  Pill,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RemedySuggestion } from '@/lib/api/classicalHomeopathy.api';
import { Badge } from '@/components/ui/badge';

interface RemedySuggestionsCardProps {
  suggestions: RemedySuggestion[];
  onSelectRemedy: (remedy: RemedySuggestion) => void;
  selectedRemedyId?: string;
}

export function RemedySuggestionsCard({
  suggestions,
  onSelectRemedy,
  selectedRemedyId,
}: RemedySuggestionsCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    suggestions[0]?.remedy.id || null
  );

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'very_high':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'high':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'low':
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case 'very_high':
        return 'Very High';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return confidence;
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="medical-card border-border/50">
        <div className="py-12 text-center">
          <Pill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No remedy suggestions available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Remedy Suggestions
        </h3>
        <Badge variant="outline" className="text-sm">
          {suggestions.length} {suggestions.length === 1 ? 'Remedy' : 'Remedies'}
        </Badge>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const isExpanded = expandedId === suggestion.remedy.id;
          const isSelected = selectedRemedyId === suggestion.remedy.id;

          return (
            <div
              key={suggestion.remedy.id}
              className={cn(
                'group relative overflow-hidden rounded-xl border transition-all duration-200',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border/50 hover:border-primary/30 hover:shadow-md'
              )}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-0 right-0 rounded-bl-lg bg-primary px-3 py-1">
                  <CheckCircle className="h-4 w-4 text-primary-foreground" />
                </div>
              )}

              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Pill className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {suggestion.remedy.name}
                        </h4>
                        {suggestion.remedy.abbreviation && (
                          <p className="text-xs text-muted-foreground">
                            {suggestion.remedy.abbreviation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        'border text-xs font-medium',
                        getConfidenceColor(suggestion.confidence)
                      )}
                    >
                      {getConfidenceLabel(suggestion.confidence)}
                    </Badge>
                  </div>
                </div>

                {/* Match Score */}
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Match Score: {suggestion.matchScore.toFixed(1)}%
                  </span>
                </div>

                {/* Potency & Repetition */}
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/30 bg-muted/30 p-2">
                    <div className="text-xs text-muted-foreground">Suggested Potency</div>
                    <div className="font-medium text-foreground">
                      {suggestion.suggestedPotency}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/30 bg-muted/30 p-2">
                    <div className="text-xs text-muted-foreground">Repetition</div>
                    <div className="font-medium text-foreground">
                      {suggestion.repetition}
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                {suggestion.warnings && suggestion.warnings.length > 0 && (
                  <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        Warnings
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {suggestion.warnings.map((warning, idx) => (
                        <li key={idx} className="text-xs text-amber-700 dark:text-amber-300">
                          • {warning.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Clinical Reasoning */}
                <div className="mb-3">
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : suggestion.remedy.id)
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-border/30 bg-muted/30 p-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        Clinical Reasoning
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="mt-2 rounded-lg border border-border/30 bg-muted/20 p-3">
                      <p className="text-sm text-foreground leading-relaxed">
                        {suggestion.clinicalReasoning}
                      </p>
                    </div>
                  )}
                </div>

                {/* Select Button */}
                <button
                  onClick={() => onSelectRemedy(suggestion)}
                  className={cn(
                    'w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-primary bg-background text-primary hover:bg-primary/10'
                  )}
                >
                  {isSelected ? 'Selected' : 'Select This Remedy'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
