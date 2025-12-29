"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type TabsContextValue = {
  value: string
  setValue: (next: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = React.useContext(TabsContext)
  if (!ctx) {
    throw new Error("Tabs components must be used within <Tabs>.")
  }
  return ctx
}

function Tabs({
  value: valueProp,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (next: string) => void
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? "")
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : uncontrolled

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolled(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange]
  )

  const ctx = React.useMemo(() => ({ value, setValue }), [value, setValue])

  return (
    <TabsContext.Provider value={ctx}>
      <div data-slot="tabs" className={cn("space-y-3", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-list"
      role="tablist"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-8 items-center justify-center rounded-md p-1",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  value,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { value: string }) {
  const { value: active, setValue } = useTabsContext()
  const isActive = active === value

  return (
    <button
      type="button"
      data-slot="tabs-trigger"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => setValue(value)}
      className={cn(
        "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({
  value,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  const { value: active } = useTabsContext()
  const isActive = active === value

  if (!isActive) return null

  return (
    <div
      data-slot="tabs-content"
      role="tabpanel"
      className={cn("space-y-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
