/**
 * AI Case Input Component
 * 
 * Main component for AI-powered case input with tabs for different input modes
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FreeTextInput } from './FreeTextInput';
import { VoiceInput } from './VoiceInput';
import { ExtractedSymptomsList } from './ExtractedSymptomsList';
import { RubricSelector } from './RubricSelector';
import { ExtractedEntitiesList } from './ExtractedEntitiesList';
import { ExtractedModalitiesList } from './ExtractedModalitiesList';
import { MetaAttributesDisplay } from './MetaAttributesDisplay';
import { Loader2, FileText, Mic } from 'lucide-react';
import { extractSymptoms, ExtractedSymptom, ExtractedEntity, ExtractedModality, MetaAttributes } from '@/lib/api/aiCaseTaking.api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface AICaseInputProps {
  onSymptomsExtracted?: (symptoms: ExtractedSymptom[]) => void;
  onSymptomsConfirmed?: (symptoms: ExtractedSymptom[]) => void;
}

export function AICaseInput({
  onSymptomsExtracted,
  onSymptomsConfirmed,
}: AICaseInputProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'voice' | 'structured'>('text');
  const [textInput, setTextInput] = useState('');
  const [extractedSymptoms, setExtractedSymptoms] = useState<ExtractedSymptom[]>([]);
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
  const [extractedModalities, setExtractedModalities] = useState<ExtractedModality[]>([]);
  const [metaAttributes, setMetaAttributes] = useState<MetaAttributes | undefined>();
  const [extracting, setExtracting] = useState(false);
  const [confirmedSymptoms, setConfirmedSymptoms] = useState<ExtractedSymptom[]>([]);
  const [useNLP, setUseNLP] = useState(true); // Default to NLP if available
  const [extractionMethod, setExtractionMethod] = useState<'nlp' | 'keyword' | 'hybrid' | undefined>();
  const [showRubricSelector, setShowRubricSelector] = useState(false);
  const [selectedSymptomForRubrics, setSelectedSymptomForRubrics] = useState<ExtractedSymptom | null>(null);

  const handleExtract = async (text?: string) => {
    // Ensure textToExtract is always a string
    const textToExtract = typeof text === 'string' ? text : (typeof textInput === 'string' ? textInput : '');
    
    if (!textToExtract || typeof textToExtract !== 'string' || !textToExtract.trim()) {
      toast.error('Please enter some text to extract symptoms from');
      return;
    }

    setExtracting(true);
    // Clear previous extractions
    setExtractedSymptoms([]);
    setExtractedEntities([]);
    setExtractedModalities([]);
    setMetaAttributes(undefined);
    
    try {
      const result = await extractSymptoms({
        text: textToExtract,
        language: 'en',
        useNLP: useNLP,
      });

      setExtractedSymptoms(result.symptoms);
      setExtractedEntities(result.entities || []);
      setExtractedModalities(result.modalities || []);
      setMetaAttributes(result.metaAttributes);
      setExtractionMethod(result.extractionMethod);
      
      if (onSymptomsExtracted) {
        onSymptomsExtracted(result.symptoms);
      }

      const methodLabel = result.extractionMethod === 'nlp' ? 'AI (NLP)' : 'Keyword';
      toast.success(
        `Extracted ${result.symptoms.length} symptoms using ${methodLabel} (${result.overallConfidence}% confidence)`
      );
    } catch (error: any) {
      console.error('Error extracting symptoms:', error);
      
      // Handle timeout specifically
      if (error.message?.includes('timeout') || error.message?.includes('timeout of')) {
        if (useNLP) {
          toast.error('NLP extraction timed out. Trying keyword extraction instead...', {
            duration: 5000,
          });
          // Fallback to keyword extraction
          try {
            const keywordResult = await extractSymptoms({
              text: textToExtract,
              language: 'en',
              useNLP: false, // Force keyword extraction
            });
            setExtractedSymptoms(keywordResult.symptoms);
            setExtractedEntities(keywordResult.entities || []);
            setExtractedModalities(keywordResult.modalities || []);
            setMetaAttributes(keywordResult.metaAttributes);
            setExtractionMethod('keyword');
            
            if (onSymptomsExtracted) {
              onSymptomsExtracted(keywordResult.symptoms);
            }
            
            toast.success(
              `Extracted ${keywordResult.symptoms.length} symptoms using Keyword extraction (${keywordResult.overallConfidence}% confidence)`
            );
            return;
          } catch (fallbackError: any) {
            toast.error(fallbackError.message || 'Both NLP and keyword extraction failed');
          }
        } else {
          toast.error('Request timeout. Please try again with a shorter text or check your internet connection.');
        }
      } else {
        toast.error(error.message || 'Failed to extract symptoms');
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    // Update text input with voice transcript
    setTextInput(transcript);
  };

  const handleConfirmSymptom = (symptom: ExtractedSymptom) => {
    // Remove from extracted, add to confirmed
    setExtractedSymptoms((prev) => prev.filter((s) => s.symptomCode !== symptom.symptomCode));
    setConfirmedSymptoms((prev) => [...prev, symptom]);
    
    if (onSymptomsConfirmed) {
      onSymptomsConfirmed([...confirmedSymptoms, symptom]);
    }
  };

  const handleRejectSymptom = (symptom: ExtractedSymptom) => {
    setExtractedSymptoms((prev) => prev.filter((s) => s.symptomCode !== symptom.symptomCode));
  };

  const handleUpdateSymptom = (symptom: ExtractedSymptom, updates: Partial<ExtractedSymptom>) => {
    setExtractedSymptoms((prev) =>
      prev.map((s) => (s.symptomCode === symptom.symptomCode ? { ...s, ...updates } : s))
    );
  };

  const handleConfirmAll = () => {
    setConfirmedSymptoms((prev) => [...prev, ...extractedSymptoms]);
    if (onSymptomsConfirmed) {
      onSymptomsConfirmed([...confirmedSymptoms, ...extractedSymptoms]);
    }
    setExtractedSymptoms([]);
    toast.success(`Confirmed ${extractedSymptoms.length} symptoms`);
  };

  const handleRejectAll = () => {
    setExtractedSymptoms([]);
    setExtractedEntities([]);
    setExtractedModalities([]);
    setMetaAttributes(undefined);
    toast.info('Rejected all extracted symptoms');
  };

  const handleSuggestRubrics = (symptom: ExtractedSymptom) => {
    setSelectedSymptomForRubrics(symptom);
    setShowRubricSelector(true);
  };

  const handleRubricsSelected = (selectedRubrics: any[]) => {
    toast.success(`Selected ${selectedRubrics.length} rubric(s) for ${selectedSymptomForRubrics?.symptomName}`);
    // TODO: Store selected rubrics with the symptom
    setShowRubricSelector(false);
    setSelectedSymptomForRubrics(null);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Free Text
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="structured" disabled className="flex items-center gap-2">
            Structured Form
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Enter Case Narrative</h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={useNLP}
                      onChange={(e) => setUseNLP(e.target.checked)}
                      className="rounded"
                    />
                    Use AI (NLP)
                  </label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Type or paste the patient case in natural language. The AI will extract symptoms automatically.
                {extractionMethod && (
                  <span className="ml-2 text-primary">
                    (Using: {extractionMethod === 'nlp' ? 'AI/NLP' : 'Keyword Matching'})
                  </span>
                )}
              </p>
              <FreeTextInput
                value={textInput}
                onChange={setTextInput}
                onExtract={() => handleExtract()}
                extracting={extracting}
              />
            </div>

            {/* Meta Attributes (shown first if available) */}
            {metaAttributes && (
              <div className="border-t pt-4">
                <MetaAttributesDisplay metaAttributes={metaAttributes} />
              </div>
            )}

            {/* Extracted Entities */}
            {extractedEntities.length > 0 && (
              <div className="border-t pt-4">
                <ExtractedEntitiesList entities={extractedEntities} />
              </div>
            )}

            {/* Extracted Modalities */}
            {extractedModalities.length > 0 && (
              <div className="border-t pt-4">
                <ExtractedModalitiesList modalities={extractedModalities} />
              </div>
            )}

            {/* Extracted Symptoms */}
            {extractedSymptoms.length > 0 && (
              <div className="border-t pt-4">
                <ExtractedSymptomsList
                  symptoms={extractedSymptoms}
                  onConfirm={handleConfirmSymptom}
                  onReject={handleRejectSymptom}
                  onUpdate={handleUpdateSymptom}
                  onConfirmAll={handleConfirmAll}
                  onRejectAll={handleRejectAll}
                  onSuggestRubrics={handleSuggestRubrics}
                />
              </div>
            )}

            {/* Confirmed Symptoms Summary */}
            {confirmedSymptoms.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">
                    Confirmed Symptoms ({confirmedSymptoms.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {confirmedSymptoms.map((symptom, index) => (
                    <div
                      key={`${symptom.symptomCode}-${index}`}
                      className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded border border-green-300"
                    >
                      {symptom.symptomName} ({symptom.category})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Voice Case Input</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Record your case notes using voice. The system will transcribe and extract symptoms automatically.
              </p>
              <VoiceInput
                onTranscriptReady={handleVoiceTranscript}
                onExtract={handleExtract}
                extracting={extracting}
              />
            </div>

            {/* Meta Attributes (shown first if available) */}
            {metaAttributes && (
              <div className="border-t pt-4">
                <MetaAttributesDisplay metaAttributes={metaAttributes} />
              </div>
            )}

            {/* Extracted Entities */}
            {extractedEntities.length > 0 && (
              <div className="border-t pt-4">
                <ExtractedEntitiesList entities={extractedEntities} />
              </div>
            )}

            {/* Extracted Modalities */}
            {extractedModalities.length > 0 && (
              <div className="border-t pt-4">
                <ExtractedModalitiesList modalities={extractedModalities} />
              </div>
            )}

            {/* Extracted Symptoms */}
            {extractedSymptoms.length > 0 && (
              <div className="border-t pt-4">
                <ExtractedSymptomsList
                  symptoms={extractedSymptoms}
                  onConfirm={handleConfirmSymptom}
                  onReject={handleRejectSymptom}
                  onUpdate={handleUpdateSymptom}
                  onConfirmAll={handleConfirmAll}
                  onRejectAll={handleRejectAll}
                  onSuggestRubrics={handleSuggestRubrics}
                />
              </div>
            )}

            {/* Confirmed Symptoms Summary */}
            {confirmedSymptoms.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">
                    Confirmed Symptoms ({confirmedSymptoms.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {confirmedSymptoms.map((symptom, index) => (
                    <div
                      key={`${symptom.symptomCode}-${index}`}
                      className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded border border-green-300"
                    >
                      {symptom.symptomName} ({symptom.category})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="structured" className="mt-4">
          <div className="text-center py-12 text-muted-foreground">
            <p>Structured form input coming soon</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rubric Selector Modal */}
      {showRubricSelector && selectedSymptomForRubrics && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <RubricSelector
              symptom={selectedSymptomForRubrics}
              onRubricsSelected={handleRubricsSelected}
              onClose={() => {
                setShowRubricSelector(false);
                setSelectedSymptomForRubrics(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
