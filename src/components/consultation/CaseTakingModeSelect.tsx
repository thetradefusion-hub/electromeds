/**
 * Select Case Taking Mode – First screen after patient is selected.
 * Doctor chooses Manual (classical) or AI-Enhanced case taking.
 * Reference: Homeolytics-style two-card layout.
 */

import { FileText, Stethoscope, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type CaseTakingMode = 'manual' | 'ai';

interface CaseTakingModeSelectProps {
  patientName?: string;
  patientId?: string;
  onSelectMode: (mode: CaseTakingMode) => void;
  onBack?: () => void;
}

export function CaseTakingModeSelect({
  patientName,
  patientId,
  onSelectMode,
  onBack,
}: CaseTakingModeSelectProps) {
  return (
    <div className="space-y-8">
      {/* Title & subtitle */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Select Case Taking Mode
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Choose how you would like to document today&apos;s session. You can leverage AI assistance or follow a traditional classical approach.
        </p>
      </div>

      {/* Two cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {/* Manual Case Taking */}
        <div
          className={cn(
            'relative flex flex-col rounded-2xl border-2 border-border/60 bg-card p-6 shadow-sm',
            'hover:border-primary/40 hover:shadow-md transition-all duration-200'
          )}
        >
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground text-center mb-2">
            Manual Case Taking
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-4 flex-1">
            Classical homeopathic workflow. Record symptoms, modalities, and rubrics manually at your own professional pace.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Badge variant="secondary" className="text-xs font-medium bg-muted text-muted-foreground">
              Classical
            </Badge>
            <Badge variant="secondary" className="text-xs font-medium bg-muted text-muted-foreground">
              Full Control
            </Badge>
          </div>
          <Button
            onClick={() => onSelectMode('manual')}
            className="w-full"
            size="lg"
          >
            Start Manual Case
          </Button>
        </div>

        {/* AI-Enhanced Case */}
        <div
          className={cn(
            'relative flex flex-col rounded-2xl border-2 border-primary/30 bg-card p-6 shadow-sm',
            'hover:border-primary/50 hover:shadow-md transition-all duration-200',
            'bg-gradient-to-b from-primary/5 to-transparent'
          )}
        >
          <div className="absolute top-4 right-4">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Stethoscope className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-foreground text-center">
              AI-Enhanced Case
            </h3>
            <Badge variant="outline" className="text-[10px] font-medium bg-primary/10 text-primary border-primary/30">
              ASSISTIVE
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground text-center mb-4 flex-1">
            Assistive workflow featuring real-time transcription, automated key symptom identification, and intelligent rubric suggestions.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-primary/20">
              Real-time Audio
            </Badge>
            <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-primary/20">
              Smart Rubrics
            </Badge>
          </div>
          <Button
            onClick={() => onSelectMode('ai')}
            className="w-full"
            size="lg"
            variant="default"
          >
            Start AI Case
          </Button>
        </div>
      </div>

      {/* Footnote */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Info className="h-4 w-4 flex-shrink-0" />
        <span>Mode can be switched anytime during the session without data loss.</span>
      </div>

      {/* Back to patient (optional) */}
      {onBack && (
        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Change patient
          </button>
        </div>
      )}
    </div>
  );
}
