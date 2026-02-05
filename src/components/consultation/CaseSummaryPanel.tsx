/**
 * Case Summary Panel Component
 * 
 * Displays AI-generated case summaries (clinical and homeopathic)
 * with keynotes and strange/rare/peculiar symptoms
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Sparkles,
  Star,
  AlertTriangle,
  Edit,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { CaseSummary, generateSummary, GenerateSummaryRequest } from '@/lib/api/aiCaseTaking.api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CaseSummaryPanelProps {
  structuredCase: GenerateSummaryRequest['structuredCase'];
  normalizedCase: GenerateSummaryRequest['normalizedCase'];
  onSave?: (summary: CaseSummary) => void;
  onClose?: () => void;
}

export function CaseSummaryPanel({
  structuredCase,
  normalizedCase,
  onSave,
  onClose,
}: CaseSummaryPanelProps) {
  const [summary, setSummary] = useState<CaseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{
    clinical?: boolean;
    homeopathic?: boolean;
  }>({});
  const [editedSummary, setEditedSummary] = useState<CaseSummary | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateSummary({
        structuredCase,
        normalizedCase,
      });
      setSummary(result);
      setEditedSummary(result);
      toast.success('Case summary generated successfully');
    } catch (error: any) {
      console.error('Error generating summary:', error);
      toast.error(error.message || 'Failed to generate case summary');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: 'clinical' | 'homeopathic') => {
    setEditing({ ...editing, [field]: true });
  };

  const handleSaveEdit = (field: 'clinical' | 'homeopathic') => {
    if (!editedSummary) return;
    setEditing({ ...editing, [field]: false });
    setSummary(editedSummary);
    toast.success(`${field === 'clinical' ? 'Clinical' : 'Homeopathic'} summary updated`);
  };

  const handleCancelEdit = (field: 'clinical' | 'homeopathic') => {
    setEditing({ ...editing, [field]: false });
    if (summary) {
      setEditedSummary(summary);
    }
  };

  const handleSave = () => {
    if (!summary) {
      toast.warning('Please generate summary first');
      return;
    }
    if (onSave) {
      onSave(summary);
      toast.success('Case summary saved');
    }
  };

  const displaySummary = editedSummary || summary;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Case Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            {!summary && (
              <Button
                onClick={handleGenerate}
                disabled={loading}
                size="sm"
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Summary
                  </>
                )}
              </Button>
            )}
            {summary && onSave && (
              <Button onClick={handleSave} size="sm" variant="default" className="gap-2">
                <Save className="h-4 w-4" />
                Save Summary
              </Button>
            )}
            {onClose && (
              <Button onClick={onClose} size="sm" variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!summary && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Generate Summary" to create AI-powered case summaries</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Generating case summary...</p>
          </div>
        )}

        {displaySummary && (
          <>
            {/* Clinical Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Clinical Summary
                </Label>
                {!editing.clinical && (
                  <Button
                    onClick={() => handleEdit('clinical')}
                    size="sm"
                    variant="ghost"
                    className="gap-2"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                )}
              </div>
              {editing.clinical ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedSummary?.clinicalSummary || ''}
                    onChange={(e) =>
                      setEditedSummary({
                        ...editedSummary!,
                        clinicalSummary: e.target.value,
                      })
                    }
                    className="min-h-[120px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveEdit('clinical')}
                      size="sm"
                      className="gap-2"
                    >
                      <Save className="h-3 w-3" />
                      Save
                    </Button>
                    <Button
                      onClick={() => handleCancelEdit('clinical')}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {displaySummary.clinicalSummary}
                  </p>
                </div>
              )}
            </div>

            {/* Homeopathic Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Homeopathic Summary
                </Label>
                {!editing.homeopathic && (
                  <Button
                    onClick={() => handleEdit('homeopathic')}
                    size="sm"
                    variant="ghost"
                    className="gap-2"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                )}
              </div>
              {editing.homeopathic ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedSummary?.homeopathicSummary || ''}
                    onChange={(e) =>
                      setEditedSummary({
                        ...editedSummary!,
                        homeopathicSummary: e.target.value,
                      })
                    }
                    className="min-h-[150px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveEdit('homeopathic')}
                      size="sm"
                      className="gap-2"
                    >
                      <Save className="h-3 w-3" />
                      Save
                    </Button>
                    <Button
                      onClick={() => handleCancelEdit('homeopathic')}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {displaySummary.homeopathicSummary}
                  </p>
                </div>
              )}
            </div>

            {/* Keynotes */}
            {displaySummary.keynotes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  Keynotes ({displaySummary.keynotes.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {displaySummary.keynotes.map((keynote, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200"
                    >
                      {keynote}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Strange/Rare/Peculiar Symptoms */}
            {displaySummary.strangeSymptoms.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Strange, Rare, Peculiar Symptoms ({displaySummary.strangeSymptoms.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {displaySummary.strangeSymptoms.map((symptom, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200"
                    >
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
