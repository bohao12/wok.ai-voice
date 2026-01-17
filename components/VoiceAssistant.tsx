'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
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
  completedSteps: Set<number>
  onStepChange: (step: number) => void
  onTimerRequest: (minutes: number, label: string) => void
}

export function VoiceAssistant({ recipe, currentStep, completedSteps, onStepChange, onTimerRequest }: VoiceAssistantProps) {
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [agentResponse, setAgentResponse] = useState<string>('')

  // Ref to track source of step change to prevent double-speaking or loops
  const lastChangeSource = useRef<'user' | 'agent'>('user')

  // Ref to track current step for tools to avoid stale closures
  const currentStepRef = useRef(currentStep)

  // Keep step ref in sync
  useEffect(() => {
    console.log(`[VoiceAssistant] Step changed: ${currentStepRef.current} -> ${currentStep}`)
    currentStepRef.current = currentStep
  }, [currentStep])

  // Define client tools that the agent can call
  const clientTools = useMemo(() => ({
    nextStep: () => {
      console.log('Tool called: nextStep')
      lastChangeSource.current = 'agent'
      const step = currentStepRef.current
      if (step < recipe.steps.length - 1) {
        onStepChange(step + 1)
        return 'Moved to next step'
      }
      return 'Already at the last step'
    },
    previousStep: () => {
      console.log('Tool called: previousStep')
      lastChangeSource.current = 'agent'
      const step = currentStepRef.current
      if (step > 0) {
        onStepChange(step - 1)
        return 'Moved to previous step'
      }
      return 'Already at the first step'
    },
    repeatStep: () => {
      console.log('Tool called: repeatStep')
      const step = currentStepRef.current
      // Trigger re-announcement of current step
      onStepChange(step)
      return `Repeating step ${step + 1}`
    },
    setTimer: ({ minutes }: { minutes: number }) => {
      console.log('Tool called: setTimer with minutes:', minutes)
      onTimerRequest(minutes, `Step ${currentStepRef.current + 1}`)
      return `Timer set for ${minutes} minutes`
    },
    changeStep: ({ step }: { step: number }) => {
      console.log('Tool called: changeStep with step:', step)
      lastChangeSource.current = 'agent'

      const targetIndex = step - 1
      if (targetIndex >= 0 && targetIndex < recipe.steps.length) {
        onStepChange(targetIndex)
        return `Moved to step ${step}`
      }
      return `Step ${step} does not exist. Please specify a step between 1 and ${recipe.steps.length}`
    },

  }), [recipe, currentStep, onStepChange, onTimerRequest])

  const recipeContext = useMemo(() => {
    // We provide the FULL recipe context initially.
    // We DO NOT include the dynamic "currentStep" here to avoid re-creating the prompt and restarting the session.
    // The agent will track the step via the conversation history and tool outputs.

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

    return `You are helping the user cook "${recipe.title}". 
    
**All Ingredients:**
${ingredientsList}

**All Steps:**
${stepsList}

${timingInfo}
${techniquesList}

## Your Role:
- You help the user cook "${recipe.title}".
- You have FULL control to navigate to ANY step using the tool "changeStep". This tool updates the user's screen.
- If the user says "Go to step 5", "Jump to step 3", or "I'm on step 2", IMMEDIATELY call the "changeStep" tool.
- Answer questions about ingredients, techniques, and steps.
- Use "nextStep" and "previousStep" for sequential navigation.

## Tools:
- nextStep(): Move to next step
- previousStep(): Move to previous step
- repeatStep(): Read current step again
- changeStep({ step: number }): DIRECTLY jump to a specific step number. Example: call changeStep with argument { "step": 3 } to go to step 3.
- setTimer({ minutes: number }): Start a timer

IMPORTANT: To change the step on the UI, you MUST call one of the navigation tools (changeStep, nextStep, previousStep). Merely saying you are changing the step is NOT sufficient. The visible step only updates when a tool is called.

When you move to a new step (via any tool), the tool will return the text of that step. READ that text to the user naturally.`
  }, [recipe])

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

  // Ref to track previous step to prevent spurious interruptions
  const prevStepRef = useRef(currentStep)

  // Detect when currentStep changes from the outside (UI buttons)
  // and handle interruption of the voice assistant
  useEffect(() => {
    if (isActive) {
      // Check if step actually changed
      const stepChanged = prevStepRef.current !== currentStep

      if (stepChanged) {
        // Update ref
        prevStepRef.current = currentStep

        // If the change wasn't triggered by the agent (via tools), it's a manual user action
        if (lastChangeSource.current === 'user') {
          // Send a message to the agent to:
          // 1. Interrupt current speech (implicit in sending a new user message)
          // 2. Force the agent to acknowledge the new step and read it
          // 3. EXPLICITLY tell it not to call tools, to prevent a feedback loop

          const isCompleted = completedSteps.has(currentStep)
          const completionNote = isCompleted ? " NOTE: The user has already marked this step as completed." : ""

          conversation.sendUserMessage(`SYSTEM UPDATE: The user has manually moved to step ${currentStep + 1}.${completionNote} Do NOT call any navigation tools. Just stop speaking and read the instruction for step ${currentStep + 1}.`)
        }

        // Reset the source to 'user' for the next potential interaction
        lastChangeSource.current = 'user'
      }
    } else {
      // Keep ref in sync even if not active
      prevStepRef.current = currentStep
    }
  }, [currentStep, isActive, conversation, completedSteps])

  return (
    <div data-assistant-active={isActive}>
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
    </div>
  )
}
