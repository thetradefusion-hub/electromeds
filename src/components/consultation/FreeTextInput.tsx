/**
 * Free Text Input Component
 * 
 * Large textarea for narrative case input with auto-formatting
 */

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, X, Save, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FreeTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onExtract?: () => void;
  extracting?: boolean;
  placeholder?: string;
  maxLength?: number;
  showActions?: boolean;
}

export function FreeTextInput({
  value,
  onChange,
  onExtract,
  extracting = false,
  placeholder = 'Type or paste the patient case narrative here...\n\nExample:\n"Patient complains of anxiety in the morning, cannot tolerate cold weather, and has a throbbing headache on the right side."',
  maxLength = 10000,
  showActions = true,
}: FreeTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [characterCount, setCharacterCount] = useState(value.length);

  useEffect(() => {
    setCharacterCount(value.length);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const handleClear = () => {
    onChange('');
    textareaRef.current?.focus();
  };

  const handleFormat = () => {
    // Basic auto-formatting: capitalize first letter of sentences
    const formatted = value
      .split(/([.!?]\s+)/)
      .map((sentence, index) => {
        if (sentence.trim().length === 0) return sentence;
        return sentence.charAt(0).toUpperCase() + sentence.slice(1).toLowerCase();
      })
      .join('');
    onChange(formatted);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'min-h-[300px] resize-y font-mono text-sm',
            'focus:ring-2 focus:ring-primary/20',
            extracting && 'opacity-60 cursor-wait'
          )}
          disabled={extracting}
        />
        {value.length > 0 && (
          <div className="absolute top-2 right-2 flex gap-2">
            {showActions && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleFormat}
                className="h-7 px-2 text-xs"
                title="Auto-format text"
              >
                <FileText className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {characterCount.toLocaleString()} / {maxLength.toLocaleString()} characters
          </span>
          {characterCount > maxLength * 0.9 && (
            <span className="text-amber-600 font-medium">
              ({Math.round(((maxLength - characterCount) / maxLength) * 100)}% remaining)
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            {value.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={extracting}
                className="h-8"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            {onExtract && value.length > 0 && (
              <Button
                type="button"
                onClick={onExtract}
                disabled={extracting || value.trim().length === 0}
                className="h-8"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Extract Symptoms
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
