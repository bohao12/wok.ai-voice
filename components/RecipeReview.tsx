'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, ChefHat, Check, Loader2 } from 'lucide-react'

interface RecipeData {
  title: string
  ingredients: string[]
  steps: string[]
  timing?: {
    prep?: number
    cook?: number
    total?: number
  }
  techniques?: string[]
}

interface RecipeReviewProps {
  recipe: RecipeData
  transcript: string
  onPublish: () => void
  onStartOver: () => void
}

export function RecipeReview({ recipe, transcript, onPublish, onStartOver }: RecipeReviewProps) {
  const [isPublishing, setIsPublishing] = useState(false)

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...recipe,
          transcript,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to publish recipe')

      onPublish()
    } catch (error) {
      console.error('Error publishing recipe:', error)
      alert('Failed to publish recipe. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{recipe.title}</CardTitle>
          <div className="flex gap-2 pt-2">
            {recipe.timing && (
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                {recipe.timing.total || (recipe.timing.prep || 0) + (recipe.timing.cook || 0)} min
              </Badge>
            )}
            {recipe.techniques && recipe.techniques.length > 0 && (
              <Badge variant="secondary">
                <ChefHat className="mr-1 h-3 w-3" />
                {recipe.techniques.length} techniques
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-1 text-primary" />
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {recipe.steps.map((step, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  {idx + 1}
                </span>
                <p className="pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {recipe.techniques && recipe.techniques.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Techniques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recipe.techniques.map((technique, idx) => (
                <Badge key={idx} variant="outline">
                  {technique}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button
          onClick={handlePublish}
          disabled={isPublishing}
          size="lg"
          className="flex-1"
        >
          {isPublishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish Recipe'
          )}
        </Button>
        <Button
          onClick={onStartOver}
          disabled={isPublishing}
          variant="outline"
          size="lg"
        >
          Start Over
        </Button>
      </div>
    </div>
  )
}
