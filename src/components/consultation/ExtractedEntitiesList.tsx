/**
 * Extracted Entities List Component
 * 
 * Displays NLP-extracted entities (body parts, sensations, emotions, etc.)
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtractedEntity } from '@/lib/api/aiCaseTaking.api';
import { Brain, Activity, Target, Heart, Utensils, Moon, Thermometer, Droplet } from 'lucide-react';

interface ExtractedEntitiesListProps {
  entities: ExtractedEntity[];
}

const entityIcons = {
  body_part: <Target className="h-4 w-4 text-red-500" />,
  sensation: <Activity className="h-4 w-4 text-orange-500" />,
  complaint: <Heart className="h-4 w-4 text-pink-500" />,
  emotion: <Brain className="h-4 w-4 text-purple-500" />,
  food: <Utensils className="h-4 w-4 text-green-500" />,
  sleep: <Moon className="h-4 w-4 text-blue-500" />,
  thermal: <Thermometer className="h-4 w-4 text-yellow-500" />,
  discharge: <Droplet className="h-4 w-4 text-cyan-500" />,
  other: <Activity className="h-4 w-4 text-gray-500" />,
};

const entityColors = {
  body_part: 'bg-red-100 text-red-800 border-red-300',
  sensation: 'bg-orange-100 text-orange-800 border-orange-300',
  complaint: 'bg-pink-100 text-pink-800 border-pink-300',
  emotion: 'bg-purple-100 text-purple-800 border-purple-300',
  food: 'bg-green-100 text-green-800 border-green-300',
  sleep: 'bg-blue-100 text-blue-800 border-blue-300',
  thermal: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  discharge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  other: 'bg-gray-100 text-gray-800 border-gray-300',
};

export function ExtractedEntitiesList({ entities }: ExtractedEntitiesListProps) {
  if (!entities || entities.length === 0) {
    return null;
  }

  // Group entities by type
  const groupedEntities = entities.reduce((acc, entity) => {
    if (!acc[entity.type]) {
      acc[entity.type] = [];
    }
    acc[entity.type].push(entity);
    return acc;
  }, {} as Record<string, ExtractedEntity[]>);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Extracted Entities ({entities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedEntities).map(([type, typeEntities]) => (
            <div key={type} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground capitalize">
                {type.replace('_', ' ')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {typeEntities.map((entity, index) => (
                  <Badge
                    key={`${entity.type}-${index}`}
                    variant="outline"
                    className={`text-xs ${entityColors[entity.type] || entityColors.other}`}
                  >
                    <span className="flex items-center gap-1">
                      {entityIcons[entity.type] || entityIcons.other}
                      {entity.text}
                    </span>
                    {entity.confidence < 0.7 && (
                      <span className="ml-1 text-xs opacity-70">
                        ({Math.round(entity.confidence * 100)}%)
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
