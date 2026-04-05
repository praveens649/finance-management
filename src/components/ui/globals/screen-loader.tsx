import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type LoaderComponentProps = {
  fullScreen?: boolean
  className?: string
}

export default function LoaderComponent({ fullScreen = false, className }: LoaderComponentProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        fullScreen && 'min-h-screen w-full bg-background',
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
