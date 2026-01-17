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
      const response = await fetch('/api/recipes')
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

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Chef Recording
                </CardTitle>
                <CardDescription>
                  Narrate your recipe while cooking and let AI structure it for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/record">
                  <Button className="w-full" size="lg">
                    Start Recording
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Voice Assistant
                </CardTitle>
                <CardDescription>
                  Cook with hands-free voice guidance and real-time help
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg" variant="outline" disabled={recipes.length === 0}>
                  {recipes.length === 0 ? 'No recipes yet' : 'Browse Recipes'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-6">Recipe Library</h2>
            
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
                        <CardTitle className="line-clamp-2">{recipe.title}</CardTitle>
                        <div className="flex gap-2 pt-2">
                          {recipe.timing && (
                            <Badge variant="secondary" className="text-xs">
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
