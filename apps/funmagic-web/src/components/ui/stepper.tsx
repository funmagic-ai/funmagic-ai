import { Fragment } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  label: string
}

interface StepperProps {
  steps: Step[]
  currentStep: string
  completedSteps: string[]
}

function Stepper({ steps, currentStep, completedSteps }: StepperProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {steps.map((step, index) => (
        <Fragment key={step.id}>
          {index > 0 && <div className="flex-1 h-px bg-border" />}
          <StepIndicator
            number={index + 1}
            label={step.label}
            isActive={step.id === currentStep}
            isComplete={completedSteps.includes(step.id)}
          />
        </Fragment>
      ))}
    </div>
  )
}

interface StepIndicatorProps {
  number: number
  label: string
  isActive: boolean
  isComplete: boolean
}

function StepIndicator({ number, label, isActive, isComplete }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
          isComplete && 'bg-green-500 text-white',
          isActive && !isComplete && 'bg-primary text-primary-foreground',
          !isActive && !isComplete && 'bg-muted text-muted-foreground'
        )}
      >
        {isComplete ? <Check className="w-3.5 h-3.5" /> : number}
      </div>
      <span
        className={cn(
          'hidden sm:inline',
          isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </div>
  )
}

export { Stepper, StepIndicator }
export type { Step, StepperProps, StepIndicatorProps }
