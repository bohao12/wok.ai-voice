'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ChefHat, Clock, Loader2, Search } from 'lucide-react'

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

export default function RecipesPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRecipes()
        }, 500)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const fetchRecipes = async () => {
        try {
            setIsLoading(true)
            const params = new URLSearchParams()
            if (searchQuery) params.append('search', searchQuery)

            const response = await fetch(`/api/recipes?${params.toString()}`)
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
                    <Link href="/" className="flex items-center gap-2 text-2xl font-bold w-fit">
                        <ChefHat className="h-8 w-8 text-primary" />
                        <span>Wok.AI</span>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <div className="relative max-w-md">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search recipes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold">All Recipes</h1>
                        <Badge variant="outline" className="text-sm">
                            {recipes.length} recipes
                        </Badge>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : recipes.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-lg text-muted-foreground mb-4">
                                No recipes found.
                            </p>
                            <Link href="/record">
                                <Badge className="cursor-pointer">Record a new recipe</Badge>
                            </Link>
                        </div>
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
            </main>
        </div>
    )
}
