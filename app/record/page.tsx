'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import { RecipeReview } from '@/components/RecipeReview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ChefHat } from 'lucide-react'
import Link from 'next/link'

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

export default function RecordPage() {
  const router = useRouter()
  const [transcript, setTranscript] = useState<string>('')
  const [recipe, setRecipe] = useState<RecipeData | null>(null)
  const [isStructuring, setIsStructuring] = useState(false)

  const handleTranscriptionComplete = async (text: string) => {
    setTranscript(text)
    setIsStructuring(true)

    try {
      const response = await fetch('/api/structure-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })

      if (!response.ok) throw new Error('Failed to structure recipe')

      const data = await response.json()
      setRecipe(data.recipe)
    } catch (error) {
      console.error('Error structuring recipe:', error)
      alert('Failed to structure recipe. Please try again.')
      setTranscript('')
    } finally {
      setIsStructuring(false)
    }
  }

  const handlePublish = () => {
    router.push('/')
  }

  const handleStartOver = () => {
    setTranscript('')
    setRecipe(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
            <ChefHat className="h-8 w-8 text-primary" />
            <span>Wok.AI</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Record Your Recipe</h1>

        {!transcript && !isStructuring && (
          <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
        )}

        {isStructuring && (
          <Card>
            <CardHeader>
              <CardTitle>Structuring Your Recipe</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                AI is analyzing your narration and creating a structured recipe...
              </p>
            </CardContent>
          </Card>
        )}

        {recipe && transcript && !isStructuring && (
          <RecipeReview
            recipe={recipe}
            transcript={transcript}
            onPublish={handlePublish}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  )
}
