// COMPONENTE shadcn Progress: BARRA DE PROGRESO (DETERMINADA O INDETERMINADA).
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

// shadcn Progress; value null/undefined renders an indeterminate sliding bar (static full bar with reduced motion).
function Progress({ className, value, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const indeterminado = value === null || value === undefined;
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "bg-primary h-full flex-1 rounded-full",
          indeterminado ? "w-1/3 animate-indeterminate motion-reduce:w-full motion-reduce:animate-none" : "w-full transition-all",
        )}
        style={indeterminado ? undefined : { transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
