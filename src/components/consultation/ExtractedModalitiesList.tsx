/**
 * Extracted Modalities List Component
 * 
 * Displays NLP-extracted modalities (better/worse factors, time patterns, etc.)
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtractedModality } from '@/lib/api/aiCaseTaking.api';
import { TrendingUp, TrendingDown, Clock, Cloud, Move, User, Utensils, Heart } from 'lucide-react';

interface ExtractedModalitiesListProps {
  modalities: ExtractedModality[];
}

const modalityIcons = {
  better: <TrendingUp className="h-4 w-4 text-green-500" />,
  worse: <TrendingDown className="h-4 w-4 text-red-500" />,
  time: <Clock className="h-4 w-4 text-blue-500" />,
  weather: <Cloud className="h-4 w-4 text-gray-500" />,
  motion: <Move className="h-4 w-4 text-blue-500" />,
  position: <User className="h-4 w-4 text-orange-500" />,
  eating: <Utensils className="h-4 w-4 text-yellow-500" />,
  emotional: <Heart className="h-4 w-4 text-pink-500" />,
};

const modalityColors = {
  better: 'bg-green-100 text-green-800 border-green-300',
  worse: 'bg-red-100 text-red-800 border-red-300',
  time: 'bg-blue-100 text-blue-800 border-blue-300',
  weather: 'bg-gray-100 text-gray-800 border-gray-300',
  motion: 'bg-blue-100 text-blue-800 border-blue-300',
  position: 'bg-orange-100 text-orange-800 border-orange-300',
  eating: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  emotional: 'bg-pink-100 text-pink-800 border-pink-300',
};

export function ExtractedModalitiesList({ modalities }: ExtractedModalitiesListProps) {
  if (!modalities || modalities.length === 0) {
    return null;
  }

  // Group modalities by type
  const groupedModalities = modalities.reduce((acc, modality) => {
    if (!acc[modality.type]) {
      acc[modality.type] = [];
    }
    acc[modality.type].push(modality);
    return acc;
  }, {} as Record<string, ExtractedModality[]>);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Extracted Modalities ({modalities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedModalities).map(([type, typeModalities]) => (
            <div key={type} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground capitalize">
                {type === 'better' ? 'Better With' : type === 'worse' ? 'Worse With' : type}
              </h4>
              <div className="space-y-2">
                {typeModalities.map((modality, index) => (
                  <div
                    key={`${modality.type}-${index}`}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-card"
                  >
                    <Badge
                      variant="outline"
                      className={`text-xs ${modalityColors[modality.type] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                    >
                      <span className="flex items-center gap-1">
                        {modalityIcons[modality.type] || <TrendingUp className="h-4 w-4" />}
                        {modality.type}
                      </span>
                    </Badge>
                    <span className="text-sm font-medium flex-1">{modality.value}</span>
                    {modality.linkedSymptom && (
                      <span className="text-xs text-muted-foreground">
                        → {modality.linkedSymptom}
                      </span>
                    )}
                    {modality.confidence < 0.7 && (
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(modality.confidence * 100)}%)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
