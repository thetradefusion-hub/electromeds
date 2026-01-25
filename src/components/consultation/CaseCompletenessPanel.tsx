/**
 * Case Completeness Panel Component
 * 
 * Displays case completeness analysis with missing domains and suggestions
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CompletenessAnalysis, MissingDomain } from '@/lib/api/aiCaseTaking.api';
import { cn } from '@/lib/utils';

interface CaseCompletenessPanelProps {
  analysis: CompletenessAnalysis;
  onGenerateQuestions?: (domain?: string) => void;
  onAddSymptom?: (domain: string, question: string) => void;
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
};

export function CaseCompletenessPanel({
  analysis,
  onGenerateQuestions,
  onAddSymptom,
}: CaseCompletenessPanelProps) {
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  const toggleDomain = (domain: string) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedDomains(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Complete';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Incomplete';
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Case Completeness Analysis
          </CardTitle>
          <Badge
            variant="outline"
            className={cn('text-sm font-semibold', getScoreColor(analysis.completenessScore))}
          >
            {analysis.completenessScore}% - {getScoreLabel(analysis.completenessScore)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completeness Score</span>
            <span className={cn('font-semibold', getScoreColor(analysis.completenessScore))}>
              {analysis.completenessScore}%
            </span>
          </div>
          <Progress value={analysis.completenessScore} className="h-2" />
        </div>

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Strengths
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
              {analysis.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div className="space-y-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4" />
              Critical Warnings
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-600 ml-6">
              {analysis.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Domains */}
        {analysis.missingDomains.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Missing Domains</h4>
              <Badge variant="outline" className="text-xs">
                {analysis.missingDomains.length} missing
              </Badge>
            </div>
            <div className="space-y-2">
              {analysis.missingDomains.map((domain, index) => (
                <MissingDomainCard
                  key={domain.domain}
                  domain={domain}
                  isExpanded={expandedDomains.has(domain.domain)}
                  onToggle={() => toggleDomain(domain.domain)}
                  onGenerateQuestions={() => onGenerateQuestions?.(domain.domain)}
                  onAddSymptom={onAddSymptom}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Missing Domains */}
        {analysis.missingDomains.length === 0 && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Case is complete! All required domains are covered.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MissingDomainCardProps {
  domain: MissingDomain;
  isExpanded: boolean;
  onToggle: () => void;
  onGenerateQuestions: () => void;
  onAddSymptom?: (domain: string, question: string) => void;
}

function MissingDomainCard({
  domain,
  isExpanded,
  onToggle,
  onGenerateQuestions,
  onAddSymptom,
}: MissingDomainCardProps) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="text-sm font-medium capitalize">{domain.domain.replace('_', ' ')}</h5>
            <Badge
              variant="outline"
              className={cn('text-xs', priorityColors[domain.priority])}
            >
              {domain.priority} priority
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{domain.description}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-6 w-6 p-0"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-2 border-t">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Suggested Questions
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerateQuestions}
                className="h-7 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Generate More
              </Button>
            </div>
            <ul className="space-y-1">
              {domain.suggestedQuestions.map((question, index) => (
                <li key={index} className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground mt-1">•</span>
                  <div className="flex-1 flex items-center justify-between">
                    <span>{question}</span>
                    {onAddSymptom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddSymptom(domain.domain, question)}
                        className="h-6 text-xs ml-2"
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
