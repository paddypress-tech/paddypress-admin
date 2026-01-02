import * as React from "react"

import { cn } from "@/lib/utils"

type SidebarContextValue = {
  isMobile: boolean
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined
)

function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia?.(`(max-width: ${breakpointPx}px)`)?.matches ?? false
  })

  React.useEffect(() => {
    const media = window.matchMedia?.(`(max-width: ${breakpointPx}px)`)
    if (!media) return

    const onChange = () => setIsMobile(media.matches)
    onChange()

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange)
      return () => media.removeEventListener("change", onChange)
    }

    media.addListener(onChange)
    return () => media.removeListener(onChange)
  }, [breakpointPx])

  return isMobile
}

function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()

  const value = React.useMemo<SidebarContextValue>(() => ({ isMobile }), [isMobile])

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  return ctx ?? { isMobile: useIsMobile() }
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("border-t border-border py-2", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn("list-none", className)}
      {...props}
    />
  )
}

function SidebarMenuButton({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"button"> & {
  size?: "default" | "lg"
}) {
  return (
    <button
      data-slot="sidebar-menu-button"
      data-size={size}
      className={cn(
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none",
        size === "lg" ? "min-h-12" : "min-h-9",
        className
      )}
      type="button"
      {...props}
    />
  )
}

export {
  SidebarProvider,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
}
