'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useConversation } from '@elevenlabs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Volume2, VolumeX, Loader2 } from 'lucide-react'

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
}

interface VoiceAssistantProps {
  recipe: Recipe
  currentStep: number
  onStepChange: (step: number) => void
  onTimerRequest: (minutes: number, label: string) => void
}

export function VoiceAssistant({ recipe, currentStep, onStepChange, onTimerRequest }: VoiceAssistantProps) {
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [agentResponse, setAgentResponse] = useState<string>('')
  
  // Define client tools that the agent can call
  const clientTools = useMemo(() => ({
    nextStep: () => {
      console.log('Tool called: nextStep')
      if (currentStep < recipe.steps.length - 1) {
        onStepChange(currentStep + 1)
        return 'Moved to next step'
      }
      return 'Already at the last step'
    },
    previousStep: () => {
      console.log('Tool called: previousStep')
      if (currentStep > 0) {
        onStepChange(currentStep - 1)
        return 'Moved to previous step'
      }
      return 'Already at the first step'
    },
    repeatStep: () => {
      console.log('Tool called: repeatStep')
      // Trigger re-announcement of current step
      onStepChange(currentStep)
      return `Repeating step ${currentStep + 1}`
    },
    setTimer: ({ minutes }: { minutes: number }) => {
      console.log('Tool called: setTimer with minutes:', minutes)
      onTimerRequest(minutes, `Step ${currentStep + 1}`)
      return `Timer set for ${minutes} minutes`
    }
  }), [recipe, currentStep, onStepChange, onTimerRequest])

  // Format recipe context for the agent
  const recipeContext = useMemo(() => {
    const ingredientsList = recipe.ingredients
      .map((ing, i) => `${i + 1}. ${ing}`)
      .join('\n')

    const stepsList = recipe.steps
      .map((step, i) => `Step ${i + 1}: ${step}`)
      .join('\n')

    const timingInfo = recipe.timing 
      ? `Timing: Prep ${recipe.timing.prep || 0} min, Cook ${recipe.timing.cook || 0} min, Total ${recipe.timing.total || 0} min`
      : ''

    const techniquesList = recipe.techniques && recipe.techniques.length > 0
      ? `Techniques used: ${recipe.techniques.join(', ')}`
      : ''

    return `You are helping the user cook "${recipe.title}". They are currently on step ${currentStep + 1} of ${recipe.steps.length}.

**Current Step:** ${recipe.steps[currentStep]}

**All Ingredients:**
${ingredientsList}

**All Steps:**
${stepsList}

${timingInfo}
${techniquesList}

## Your Role:
- Answer questions about ingredients, techniques, and steps
- Use the client tools (nextStep, previousStep, repeatStep, setTimer) when the user requests navigation or timers
- Be encouraging and helpful
- Keep responses concise since the user is actively cooking

When the user says:
- "next step" or "next" → Call the nextStep tool
- "previous step" or "back" → Call the previousStep tool  
- "repeat" or "say that again" → Call the repeatStep tool
- "set timer for X minutes" → Call the setTimer tool with the minutes parameter

For other questions, provide helpful cooking advice based on the recipe information above.`
  }, [recipe, currentStep])

  // Initialize the conversation with the ElevenLabs React SDK
  const conversation = useConversation({
    clientTools,
    overrides: {
      agent: {
        prompt: {
          prompt: recipeContext
        },
        firstMessage: `Hi! I'm your cooking assistant for ${recipe.title}. You're currently on step ${currentStep + 1}. How can I help you?`
      }
    },
    onConnect: () => {
      console.log('✓ Connected to ElevenLabs')
      setError(null)
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs')
    },
    onError: (error: any) => {
      console.error('Conversation error:', error)
      setError(typeof error === 'string' ? error : (error as Error).message || 'Connection error occurred')
    },
    onMessage: (message: any) => {
      console.log('Message received:', message)
      
      // Handle user transcripts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((message as any).type === 'user_transcript' || (message as any).type === 'user_transcription') {
        const text = (message as any).user_transcription?.text || (message as any).message || ''
        if (text) {
          setTranscript(text)
        }
      }
      
      // Handle agent responses
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((message as any).type === 'agent_response') {
        const text = (message as any).agent_response || (message as any).message || ''
        if (text) {
          setAgentResponse(text)
        }
      }
    }
  })
  
  // Cleanup on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      // Cleanup function when component unmounts
      if (conversation.status === 'connected') {
        console.log('Component unmounting, ending session...')
        conversation.endSession()
      }
    }
  }, [])

  // Start the conversation
  const startConversation = async () => {
    try {
      setError(null)
      
      // Request microphone permissions first
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the tracks immediately as we only needed to request permission
      permissionStream.getTracks().forEach(track => track.stop())

      // Get signed URL from our API
      const response = await fetch('/api/conversation/signed-url')
      if (!response.ok) {
        throw new Error('Failed to get signed URL')
      }
      
      const { signedUrl } = await response.json()
      
      if (!signedUrl) {
        throw new Error('No signed URL returned')
      }

      console.log('Starting conversation with signed URL')

      // Start the session with WebSocket
      await conversation.startSession({
        signedUrl,
      })

    } catch (error) {
      console.error('Failed to start conversation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start voice assistant'
      setError(errorMessage)
    }
  }

  // Stop the conversation
  const stopConversation = async () => {
    await conversation.endSession()
  }

  // Toggle conversation on/off
  const toggleConversation = async () => {
    if (conversation.status === 'connected') {
      await stopConversation()
    } else {
      await startConversation()
    }
  }

  const isActive = conversation.status === 'connected'
  const isConnecting = conversation.status === 'connecting'
  const isSpeaking = conversation.isSpeaking

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">AI Voice Assistant</h3>
          {isActive && (
            <Badge variant="default" className={isSpeaking ? 'animate-pulse' : ''}>
              {isSpeaking ? 'Speaking' : 'Listening'}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Button
            onClick={toggleConversation}
            disabled={isConnecting}
            size="lg"
            className="w-full"
            variant={isActive ? "destructive" : "default"}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : isActive ? (
              <>
                <VolumeX className="mr-2 h-4 w-4" />
                Stop Voice Assistant
              </>
            ) : (
              <>
                <Volume2 className="mr-2 h-4 w-4" />
                Start Voice Assistant
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {transcript && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground mb-1">You said:</p>
              <p className="text-sm">{transcript}</p>
            </div>
          )}

          {agentResponse && (
            <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Assistant:</p>
              <p className="text-sm">{agentResponse}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Try saying:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>&quot;Next step&quot; - Move forward</li>
              <li>&quot;Previous step&quot; - Go back</li>
              <li>&quot;Repeat that&quot; - Hear current step again</li>
              <li>&quot;Set timer for X minutes&quot; - Start timer</li>
              <li>&quot;What is [ingredient]?&quot; - Get info</li>
              <li>&quot;How do I [technique]?&quot; - Get help</li>
            </ul>
          </div>

          {conversation.status === 'disconnected' && (
            <div className="text-xs text-muted-foreground">
              <p>💡 <strong>Tip:</strong> Make sure your microphone is enabled and you&apos;re in a quiet environment for best results.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
