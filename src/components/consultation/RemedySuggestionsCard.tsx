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
  Target,
  List,
  BookOpen,
  Lightbulb,
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
  const [scoreBreakdownOpenId, setScoreBreakdownOpenId] = useState<string | null>(null);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'very_high':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                {/* Match Score + low-confidence reminder */}
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Match Score: {typeof suggestion.matchScore === 'number' ? suggestion.matchScore.toFixed(1) : suggestion.matchScore}
                    </span>
                  </div>
                  {(suggestion.confidence === 'low' || suggestion.confidence === 'medium') && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      Use clinical judgment when selecting.
                    </span>
                  )}
                </div>

                {/* Score breakdown – dropdown (doctor opens when needed) */}
                {suggestion.scoreBreakdown && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() =>
                        setScoreBreakdownOpenId((id) =>
                          id === suggestion.remedy.id ? null : suggestion.remedy.id
                        )
                      }
                      className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                    >
                      <span className="text-xs font-semibold text-foreground">
                        Score breakdown
                      </span>
                      {scoreBreakdownOpenId === suggestion.remedy.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {scoreBreakdownOpenId === suggestion.remedy.id && (
                      <div className="mt-2 rounded-lg border border-border/50 bg-muted/20 p-3">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                          <span className="text-muted-foreground">Base (rubrics)</span>
                          <span className="text-right font-medium">{suggestion.scoreBreakdown.baseScore.toFixed(1)}</span>
                          <span className="text-muted-foreground">Constitution</span>
                          <span className="text-right text-green-600 dark:text-green-400">+{suggestion.scoreBreakdown.constitutionBonus.toFixed(1)}</span>
                          <span className="text-muted-foreground">Modality</span>
                          <span className="text-right text-green-600 dark:text-green-400">+{suggestion.scoreBreakdown.modalityBonus.toFixed(1)}</span>
                          <span className="text-muted-foreground">Pathology</span>
                          <span className="text-right text-green-600 dark:text-green-400">+{suggestion.scoreBreakdown.pathologySupport.toFixed(1)}</span>
                          <span className="text-muted-foreground">Keynote</span>
                          <span className="text-right text-green-600 dark:text-green-400">+{suggestion.scoreBreakdown.keynoteBonus.toFixed(1)}</span>
                          <span className="text-muted-foreground">Coverage</span>
                          <span className="text-right text-green-600 dark:text-green-400">+{suggestion.scoreBreakdown.coverageBonus.toFixed(1)}</span>
                          <span className="text-muted-foreground">Penalty</span>
                          <span className="text-right text-red-600 dark:text-red-400">-{suggestion.scoreBreakdown.contradictionPenalty.toFixed(1)}</span>
                          <span className="text-muted-foreground font-medium">Total</span>
                          <span className="text-right font-semibold">{suggestion.scoreBreakdown.total.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Why This Remedy? - Prominent Section */}
                <div className="mb-3 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <h5 className="font-semibold text-foreground text-base">
                      Why This Remedy?
                    </h5>
                  </div>

                  {/* Matched Symptoms */}
                  {suggestion.matchedSymptoms && suggestion.matchedSymptoms.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Matched Symptoms ({suggestion.matchedSymptoms.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestion.matchedSymptoms.slice(0, 8).map((symptom, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs bg-primary/10 text-primary border-primary/20"
                          >
                            {symptom}
                          </Badge>
                        ))}
                        {suggestion.matchedSymptoms.length > 8 && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-muted text-muted-foreground"
                          >
                            +{suggestion.matchedSymptoms.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Matched Rubrics + Repertory */}
                  {suggestion.matchedRubrics && suggestion.matchedRubrics.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Matched Repertory Rubrics ({suggestion.matchedRubrics.length})
                        </span>
                        {suggestion.repertoryType && (
                          <Badge variant="outline" className="text-[10px]">
                            Repertory: {suggestion.repertoryType === 'publicum' ? 'Publicum (English)' : suggestion.repertoryType}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        This remedy appears in authentic repertory rubrics that map to the patient&apos;s symptoms.
                        Use this list to cross‑verify with your repertory.
                      </p>
                      <ul className="space-y-1 text-[11px] text-muted-foreground">
                        {suggestion.matchedRubrics.slice(0, 4).map((rubric, idx) => (
                          <li key={idx}>• {rubric}</li>
                        ))}
                      </ul>
                      {suggestion.matchedRubrics.length > 4 && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          +{suggestion.matchedRubrics.length - 4} more rubrics available in detailed analysis.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Clinical Reasoning Summary */}
                  <div className="mt-3 pt-3 border-t border-primary/20">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Clinical Reasoning:
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {suggestion.clinicalReasoning}
                        </p>
                      </div>
                    </div>
                  </div>
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

                {/* Detailed Clinical Reasoning - Expandable */}
                <div className="mb-3">
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : suggestion.remedy.id)
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-border/30 bg-muted/30 p-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        Detailed Analysis
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
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-foreground mb-2">
                          Complete Clinical Reasoning:
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                          {suggestion.clinicalReasoning}
                        </p>
                        {suggestion.matchedRubrics && suggestion.matchedRubrics.length > 4 && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <p className="text-xs font-medium text-foreground mb-2">
                              All Matched Rubrics ({suggestion.matchedRubrics.length}):
                            </p>
                            <ul className="space-y-1 text-[11px] text-muted-foreground">
                              {suggestion.matchedRubrics.map((rubric, idx) => (
                                <li key={idx}>• {rubric}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {suggestion.matchedSymptoms && suggestion.matchedSymptoms.length > 8 && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <p className="text-xs font-medium text-foreground mb-2">
                              All Matched Symptoms ({suggestion.matchedSymptoms.length}):
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {suggestion.matchedSymptoms.map((symptom, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {symptom}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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
