/**
 * Smart Questions Panel Component
 * 
 * Displays AI-generated questions with answer tracking
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';
import { Question, QuestionGenerationResult, extractSymptomsFromAnswers, QuestionAnswer as QuestionAnswerType } from '@/lib/api/aiCaseTaking.api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SmartQuestionsPanelProps {
  questions: Question[];
  reasoning?: string;
  onAnswer: (questionId: string, answer: string, question: Question) => void;
  onSkip?: (questionId: string) => void;
  onComplete?: (allAnswers: Array<{ question: Question; answer: string }>) => void;
  autoAddSymptoms?: boolean; // Auto-add symptoms from answers
  onSymptomsExtracted?: (symptoms: any[]) => void;
}

interface QuestionAnswer {
  questionId: string;
  answer: string;
  question: Question;
}

export function SmartQuestionsPanel({
  questions,
  reasoning,
  onAnswer,
  onSkip,
  onComplete,
  autoAddSymptoms = false,
  onSymptomsExtracted,
}: SmartQuestionsPanelProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, QuestionAnswer>>(new Map());
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [extractingSymptoms, setExtractingSymptoms] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = answers.size;
  const totalQuestions = questions.length;

  const handleAnswer = () => {
    if (!currentAnswer.trim() && currentQuestion.type !== 'yes_no') {
      return;
    }

    const answer = currentAnswer || 'Yes'; // Default for yes_no if not set
    const answerObj: QuestionAnswer = { 
      questionId: currentQuestion.id, 
      answer,
      question: currentQuestion,
    };
    
    // Update answers state
    const updatedAnswers = new Map(answers);
    updatedAnswers.set(currentQuestion.id, answerObj);
    setAnswers(updatedAnswers);
    
    onAnswer(currentQuestion.id, answer, currentQuestion);
    setCurrentAnswer('');

    // Move to next question or handle completion
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, handle completion with updated answers
      // Symptoms will be extracted here from all answers at once
      handleAllAnswered(updatedAnswers);
    }
  };

  const handleAllAnswered = async (answersMap?: Map<string, QuestionAnswer>) => {
    // Use provided map or current state
    const answersToUse = answersMap || answers;
    const allAnswers = Array.from(answersToUse.values()).map(a => ({
      question: a.question,
      answer: a.answer,
    }));

    // Auto-extract symptoms from ALL answers at once if enabled
    // This ensures symptoms are analyzed together for better context and rubric matching
    if (autoAddSymptoms && onSymptomsExtracted) {
      setExtractingSymptoms(true);
      try {
        // Filter out "No" answers and empty answers
        const validAnswers = Array.from(answersToUse.values()).filter(a => {
          // Skip "No" answers for yes/no questions
          if (a.question.type === 'yes_no' && a.answer.toLowerCase() === 'no') {
            return false;
          }
          // Skip empty answers
          if (!a.answer || a.answer.trim().length === 0) {
            return false;
          }
          return true;
        });

        if (validAnswers.length === 0) {
          toast.info('No valid answers found to extract symptoms from.');
          setExtractingSymptoms(false);
          if (onComplete) {
            onComplete(allAnswers);
          }
          return;
        }

        const answerPayload: QuestionAnswerType[] = validAnswers.map(a => ({
          questionId: a.question.id,
          questionText: a.question.text,
          answer: a.answer,
          domain: a.question.domain,
          type: a.question.type,
        }));

        console.log('[SmartQuestionsPanel] Analyzing all answers together:', answerPayload);
        console.log('[SmartQuestionsPanel] Total valid answers:', validAnswers.length);
        
        // Extract symptoms from all answers together for better context
        const result = await extractSymptomsFromAnswers(answerPayload, true);
        console.log('[SmartQuestionsPanel] Extracted symptoms result:', result);
        console.log('[SmartQuestionsPanel] Extracted symptoms count:', result.extractedSymptoms?.length || 0);
        
        if (result.extractedSymptoms && result.extractedSymptoms.length > 0) {
          console.log('[SmartQuestionsPanel] Calling onSymptomsExtracted with:', result.extractedSymptoms);
          onSymptomsExtracted(result.extractedSymptoms);
          toast.success(`Analyzed all answers and extracted ${result.extractedSymptoms.length} symptom(s) for rubric matching`);
        } else {
          console.warn('[SmartQuestionsPanel] No symptoms extracted from answers. Answer payload:', answerPayload);
          toast.info('No symptoms could be extracted from the answers. You can add symptoms manually.');
        }
      } catch (error) {
        console.error('[SmartQuestionsPanel] Error extracting symptoms:', error);
        toast.error('Failed to extract symptoms from answers');
      } finally {
        setExtractingSymptoms(false);
      }
    }

    if (onComplete) {
      onComplete(allAnswers);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip(currentQuestion.id);
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevAnswer = answers.get(questions[currentQuestionIndex - 1].id);
      setCurrentAnswer(prevAnswer?.answer || '');
    }
  };

  const handleSelectAnswer = (value: string) => {
    setCurrentAnswer(value);
    // Auto-submit for yes_no and multiple_choice
    if (currentQuestion.type === 'yes_no' || currentQuestion.type === 'multiple_choice') {
      setTimeout(() => {
        const answerObj: QuestionAnswer = {
          questionId: currentQuestion.id,
          answer: value,
          question: currentQuestion,
        };
        
        // Update answers state
        const updatedAnswers = new Map(answers);
        updatedAnswers.set(currentQuestion.id, answerObj);
        setAnswers(updatedAnswers);
        
        onAnswer(currentQuestion.id, value, currentQuestion);
        setCurrentAnswer('');
        
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          // All questions answered, handle completion with updated answers
          // Symptoms will be extracted here from all answers at once
          handleAllAnswered(updatedAnswers);
        }
      }, 300);
    }
  };

  if (questions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No questions available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Smart Questions
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {answeredCount} / {totalQuestions} answered
          </Badge>
        </div>
        {reasoning && (
          <p className="text-xs text-muted-foreground mt-2">{reasoning}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Question */}
        <div className="space-y-3 p-4 rounded-lg border bg-card">
          {extractingSymptoms && (
            <div className="flex items-center gap-2 p-2 rounded bg-blue-50 border border-blue-200">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-xs text-blue-700">Analyzing all answers and extracting symptoms for rubric matching...</span>
            </div>
          )}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-medium">{currentQuestion.text}</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1 text-xs max-w-xs">
                        <p className="font-medium">Domain: {currentQuestion.domain}</p>
                        <p className="font-medium">Priority: {currentQuestion.priority}</p>
                        {currentQuestion.reasoning && (
                          <p>{currentQuestion.reasoning}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  currentQuestion.priority === 'high'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : currentQuestion.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                )}
              >
                {currentQuestion.priority} priority
              </Badge>
            </div>
          </div>

          {/* Answer Input */}
          <div className="space-y-2">
            {currentQuestion.type === 'yes_no' && (
              <div className="flex gap-2">
                <Button
                  variant={currentAnswer === 'Yes' ? 'default' : 'outline'}
                  onClick={() => handleSelectAnswer('Yes')}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Yes
                </Button>
                <Button
                  variant={currentAnswer === 'No' ? 'default' : 'outline'}
                  onClick={() => handleSelectAnswer('No')}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  No
                </Button>
              </div>
            )}

            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <Select value={currentAnswer} onValueChange={handleSelectAnswer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an answer" />
                </SelectTrigger>
                <SelectContent>
                  {currentQuestion.options.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {currentQuestion.type === 'open_ended' && (
              <Textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={3}
                className="resize-none"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {currentQuestionIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                className="flex-1"
              >
                Previous
              </Button>
            )}
            {currentQuestion.type === 'open_ended' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip
              </Button>
            )}
            {currentQuestion.type === 'open_ended' && (
              <Button
                size="sm"
                onClick={handleAnswer}
                disabled={!currentAnswer.trim()}
                className="flex-1"
              >
                {currentQuestionIndex < questions.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  'Complete & Analyze'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Completion Message */}
        {answeredCount === totalQuestions && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700">All questions answered!</p>
              {extractingSymptoms ? (
                <p className="text-xs text-green-600">AI is analyzing all answers together and extracting symptoms for better rubric matching...</p>
              ) : autoAddSymptoms ? (
                <p className="text-xs text-green-600">Symptoms have been analyzed and automatically added to your case for remedy suggestion.</p>
              ) : (
                <p className="text-xs text-green-600">Review your answers and add symptoms to the case.</p>
              )}
            </div>
            {onComplete && !extractingSymptoms && (
              <Button size="sm" onClick={() => {
                const allAnswers = Array.from(answers.values()).map(a => ({
                  question: a.question,
                  answer: a.answer,
                }));
                onComplete(allAnswers);
              }}>
                Done
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
