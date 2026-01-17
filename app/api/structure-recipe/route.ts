import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript } = body

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      )
    }

    // Use Gemini to structure the recipe
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a recipe structuring assistant. Analyze the following recipe narration and extract structured information.

Recipe narration:
${transcript}

Extract and return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just the JSON):
{
  "title": "Recipe name",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "steps": ["step 1", "step 2", ...],
  "timing": {
    "prep": minutes as number,
    "cook": minutes as number,
    "total": minutes as number
  },
  "techniques": ["technique 1", "technique 2", ...]
}

Rules:
- Extract a clear, concise title
- List all ingredients with quantities
- Break down into clear, numbered steps
- Extract timing information (prep, cook, total in minutes)
- Identify cooking techniques mentioned (e.g., "sauté", "boil", "dice")
- Return ONLY the JSON object, no other text`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Clean up the response - remove markdown code blocks if present
    let jsonText = responseText.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    // Parse the JSON response
    const recipe = JSON.parse(jsonText)

    // Validate the structure
    if (!recipe.title || !recipe.ingredients || !recipe.steps) {
      throw new Error('Invalid recipe structure returned by AI')
    }

    return NextResponse.json({ recipe })
  } catch (error) {
    console.error('Error structuring recipe:', error)
    return NextResponse.json(
      { 
        error: 'Failed to structure recipe', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
