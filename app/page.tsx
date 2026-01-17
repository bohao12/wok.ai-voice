'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChefHat, Mic, BookOpen, Clock, Loader2 } from 'lucide-react'

interface Recipe {
  id: string
  title: string
  ingredients: string[]
  steps: string[]
  timing?: {
    prep?: number
    cook?: number
    total?: number
  }
  techniques?: string[]
  created_at: string
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecipes()
  }, [])

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/recipes?limit=3')
      if (!response.ok) throw new Error('Failed to fetch recipes')
      const data = await response.json()
      setRecipes(data.recipes || [])
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <ChefHat className="h-8 w-8 text-primary" />
              <span>Wok.AI</span>
            </div>
            <Link href="/record">
              <Button size="lg">
                <Mic className="mr-2 h-4 w-4" />
                Record Recipe
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Voice-Powered Recipe App</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Record recipes while cooking and cook with voice guidance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Audio Recording
                </CardTitle>
                <CardDescription>
                  Quick audio recording - narrate and let AI structure it
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Link href="/record">
                  <Button className="w-full" size="lg">
                    Start Audio
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-primary/50 flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Video Recording
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">New</span>
                </CardTitle>
                <CardDescription>
                  Full video with AI photo extraction at key moments
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Link href="/record-video">
                  <Button className="w-full" size="lg" variant="default">
                    Start Video
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Recipe Library
                </CardTitle>
                <CardDescription>
                  Browse all recipes and cook with voice guidance
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Link href="/recipes">
                  <Button className="w-full" size="lg" variant="outline" disabled={recipes.length === 0}>
                    {recipes.length === 0 ? 'No recipes yet' : 'View All Recipes'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Recent Recipes</h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recipes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12">
                  <ChefHat className="h-16 w-16 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">
                    No recipes yet. Start by recording your first recipe!
                  </p>
                  <Link href="/record">
                    <Button size="lg">
                      <Mic className="mr-2 h-4 w-4" />
                      Record First Recipe
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <Link key={recipe.id} href={`/cook/${recipe.id}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="line-clamp-2 flex-1">{recipe.title}</CardTitle>
                          {recipe.timing && (
                            <Badge variant="secondary" className="text-xs shrink-0 whitespace-nowrap">
                              <Clock className="mr-1 h-3 w-3" />
                              {recipe.timing.total || (recipe.timing.prep || 0) + (recipe.timing.cook || 0)} min
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {recipe.ingredients.length} ingredients • {recipe.steps.length} steps
                        </p>
                        {recipe.techniques && recipe.techniques.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {recipe.techniques.slice(0, 3).map((technique, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {technique}
                              </Badge>
                            ))}
                            {recipe.techniques.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{recipe.techniques.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
