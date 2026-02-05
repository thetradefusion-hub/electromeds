/**
 * Meta Attributes Display Component
 * 
 * Displays extracted meta-attributes (intensity, duration, frequency, peculiarity)
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetaAttributes } from '@/lib/api/aiCaseTaking.api';
import { Gauge, Clock, Repeat, Star } from 'lucide-react';

interface MetaAttributesDisplayProps {
  metaAttributes: MetaAttributes;
}

const intensityColors = {
  mild: 'bg-green-100 text-green-800 border-green-300',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  severe: 'bg-red-100 text-red-800 border-red-300',
};

const frequencyColors = {
  constant: 'bg-red-100 text-red-800 border-red-300',
  intermittent: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  occasional: 'bg-green-100 text-green-800 border-green-300',
};

export function MetaAttributesDisplay({ metaAttributes }: MetaAttributesDisplayProps) {
  if (!metaAttributes || Object.keys(metaAttributes).length === 0) {
    return null;
  }

  const hasAnyAttribute =
    metaAttributes.intensity ||
    metaAttributes.duration ||
    metaAttributes.frequency ||
    metaAttributes.peculiarity;

  if (!hasAnyAttribute) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          Case Meta-Attributes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metaAttributes.intensity && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Gauge className="h-3 w-3" />
                Intensity
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${intensityColors[metaAttributes.intensity] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
              >
                {metaAttributes.intensity}
              </Badge>
            </div>
          )}

          {metaAttributes.duration && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Duration
              </div>
              <Badge variant="outline" className="text-xs">
                {metaAttributes.duration}
              </Badge>
            </div>
          )}

          {metaAttributes.frequency && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Repeat className="h-3 w-3" />
                Frequency
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${frequencyColors[metaAttributes.frequency] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
              >
                {metaAttributes.frequency}
              </Badge>
            </div>
          )}

          {metaAttributes.peculiarity !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3" />
                Peculiarity
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${
                  metaAttributes.peculiarity >= 70
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : metaAttributes.peculiarity >= 40
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300'
                }`}
              >
                {metaAttributes.peculiarity}/100
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
