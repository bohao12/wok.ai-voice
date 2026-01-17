import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export type Recipe = {
  id: string
  title: string
  ingredients: string[]
  steps: string[]
  timing?: Record<string, number>
  techniques?: string[]
  transcript?: string
  created_at: string
  updated_at: string
}
