/**
 * Rubric Selector Component
 * 
 * Displays multiple rubric suggestions for a symptom with selection options
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Sparkles,
  Star,
  AlertCircle,
  Plus,
  Search,
  Loader2,
  Info,
} from 'lucide-react';
import { RubricSuggestion, suggestRubrics } from '@/lib/api/aiCaseTaking.api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExtractedSymptom } from '@/lib/api/aiCaseTaking.api';

interface RubricSelectorProps {
  symptom: ExtractedSymptom;
  onRubricsSelected: (selectedRubrics: RubricSuggestion[]) => void;
  onClose?: () => void;
  repertoryType?: 'kent' | 'bbcr' | 'boericke' | 'synthesis' | 'publicum';
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

export function RubricSelector({
  symptom,
  onRubricsSelected,
  onClose,
  repertoryType = 'publicum',
}: RubricSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [rubrics, setRubrics] = useState<RubricSuggestion[]>([]);
  const [rareRubrics, setRareRubrics] = useState<RubricSuggestion[]>([]);
  const [selectedRubrics, setSelectedRubrics] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showRareOnly, setShowRareOnly] = useState(false);
  const [selectedRepertory, setSelectedRepertory] = useState(repertoryType);

  useEffect(() => {
    loadRubrics();
  }, [symptom, selectedRepertory]);

  const loadRubrics = async () => {
    setLoading(true);
    try {
      const result = await suggestRubrics({
        symptom: {
          symptomCode: symptom.symptomCode,
          symptomName: symptom.symptomName,
          category: symptom.category,
          location: symptom.location,
          sensation: symptom.sensation,
        },
        repertoryType: selectedRepertory,
      });

      setRubrics(result.rubrics);
      setRareRubrics(result.rareRubrics);
      
      // Auto-select high-confidence rubrics
      const autoSelect = [...result.rubrics, ...result.rareRubrics]
        .filter(r => r.confidence === 'exact' || r.confidence === 'high')
        .slice(0, 3); // Auto-select top 3
      
      setSelectedRubrics(new Set(autoSelect.map(r => r.rubricId.toString())));
    } catch (error: any) {
      console.error('Error loading rubrics:', error);
      toast.error(error.message || 'Failed to load rubric suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRubric = (rubricId: string) => {
    const newSelected = new Set(selectedRubrics);
    if (newSelected.has(rubricId)) {
      newSelected.delete(rubricId);
    } else {
      newSelected.add(rubricId);
    }
    setSelectedRubrics(newSelected);
  };

  const handleConfirm = () => {
    const allRubrics = [...rubrics, ...rareRubrics];
    const selected = allRubrics.filter(r => 
      selectedRubrics.has(r.rubricId.toString())
    );
    
    if (selected.length === 0) {
      toast.warning('Please select at least one rubric');
      return;
    }

    onRubricsSelected(selected);
    toast.success(`Selected ${selected.length} rubric(s)`);
    if (onClose) {
      onClose();
    }
  };

  const filteredRubrics = [...rubrics, ...rareRubrics].filter(r => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!r.rubricText.toLowerCase().includes(query) &&
          !r.chapter.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Rare filter
    if (showRareOnly && !r.isRare) {
      return false;
    }
    
    return true;
  });

  const displayRubrics = filteredRubrics.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Rubric Suggestions for: {symptom.symptomName}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rubrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Select value={selectedRepertory} onValueChange={(v: any) => setSelectedRepertory(v)}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publicum">Publicum</SelectItem>
              <SelectItem value="kent">Kent</SelectItem>
              <SelectItem value="bbcr">BBCR</SelectItem>
              <SelectItem value="boericke">Boericke</SelectItem>
              <SelectItem value="synthesis">Synthesis</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Checkbox
              id="rare-only"
              checked={showRareOnly}
              onCheckedChange={(checked) => setShowRareOnly(checked as boolean)}
            />
            <label htmlFor="rare-only" className="text-xs cursor-pointer flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Rare Only
            </label>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading rubric suggestions...</span>
          </div>
        )}

        {/* Rubrics List */}
        {!loading && displayRubrics.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No rubrics found matching your criteria.</p>
          </div>
        )}

        {!loading && displayRubrics.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {displayRubrics.map((rubric) => {
              const isSelected = selectedRubrics.has(rubric.rubricId.toString());
              
              return (
                <div
                  key={rubric.rubricId.toString()}
                  className={cn(
                    'border rounded-lg p-3 cursor-pointer transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent/50',
                    rubric.isRare && 'border-blue-300 bg-blue-50/30'
                  )}
                  onClick={() => handleToggleRubric(rubric.rubricId.toString())}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleRubric(rubric.rubricId.toString())}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{rubric.rubricText}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {rubric.chapter}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {rubric.repertoryType}
                            </Badge>
                            {rubric.isRare && (
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Rare
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn('text-xs', confidenceColors[rubric.confidence])}
                          >
                            {confidenceLabels[rubric.confidence]}
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1 text-xs">
                                  <p>Match Score: {rubric.matchScore}%</p>
                                  <p>Relevance: {rubric.relevanceScore.toFixed(1)}%</p>
                                  {rubric.remedyCount !== undefined && (
                                    <p>Remedies: {rubric.remedyCount}</p>
                                  )}
                                  {rubric.avgGrade !== undefined && (
                                    <p>Avg Grade: {rubric.avgGrade.toFixed(1)}</p>
                                  )}
                                  {rubric.matchedText && (
                                    <p>Matched: "{rubric.matchedText}"</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      
                      {/* Additional Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {rubric.remedyCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {rubric.remedyCount} remedies
                          </span>
                        )}
                        {rubric.avgGrade !== undefined && rubric.avgGrade > 0 && (
                          <span>Avg Grade: {rubric.avgGrade.toFixed(1)}</span>
                        )}
                        <span>Relevance: {rubric.relevanceScore.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selection Summary */}
        {selectedRubrics.size > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
            <span className="text-sm font-medium">
              {selectedRubrics.size} rubric(s) selected
            </span>
            <Button size="sm" onClick={handleConfirm}>
              Confirm Selection
            </Button>
          </div>
        )}

        {/* Empty State */}
        {selectedRubrics.size === 0 && !loading && displayRubrics.length > 0 && (
          <div className="flex items-center justify-center p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
            <span className="text-xs text-amber-700">
              Select at least one rubric to continue
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
