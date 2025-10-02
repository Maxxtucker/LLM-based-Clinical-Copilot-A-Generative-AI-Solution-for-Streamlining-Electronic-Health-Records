import * as React from "react"
import { cn } from "../../components/utils"
import { Button } from "../../components/ui/button"
import { X, PanelLeft } from "lucide-react"

// Context
const SidebarContext = React.createContext({
  isOpen: false,
  setIsOpen: () => {},
})

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

// Hooks
export const useSidebar = () => React.useContext(SidebarContext)

// Components
export const Sidebar = React.forwardRef(({ className, children, ...props }, ref) => {
  const { isOpen } = useSidebar()
  return (
    <>
      <aside
        ref={ref}
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 -translate-x-full transition-transform sm:translate-x-0",
          isOpen && "translate-x-0",
          className
        )}
        {...props}
      >
        <div className="flex h-full flex-col overflow-y-auto bg-white">
          {children}
        </div>
      </aside>
      <div className={cn("hidden sm:block sm:w-64 flex-shrink-0")}></div>
    </>
  )
})
Sidebar.displayName = "Sidebar"

export const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("p-4", className)} 
    {...props} 
  />
))
SidebarHeader.displayName = "SidebarHeader"

export const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("flex-1 p-4", className)} 
    {...props} 
  />
))
SidebarContent.displayName = "SidebarContent"

export const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("mt-auto p-4", className)} 
    {...props} 
  />
))
SidebarFooter.displayName = "SidebarFooter"

export const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul 
    ref={ref} 
    className={cn("space-y-1", className)} 
    {...props} 
  />
))
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li 
    ref={ref} 
    className={cn("", className)} 
    {...props} 
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

export const SidebarMenuButton = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => (
  <Button 
    ref={ref} 
    variant={variant || "ghost"} 
    size={size}
    className={cn("w-full justify-start", className)} 
    asChild={asChild}
    {...props} 
  />
))
SidebarMenuButton.displayName = "SidebarMenuButton"

export const SidebarTrigger = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const { isOpen, setIsOpen } = useSidebar()
  return (
    <Button
      ref={ref}
      variant={variant || "ghost"}
      size={size || "icon"}
      className={cn("sm:hidden", className)}
      onClick={() => setIsOpen(!isOpen)}
      asChild={asChild}
      {...props}
    >
      {isOpen ? <X className="h-6 w-6" /> : <PanelLeft className="h-6 w-6" />}
      <span className="sr-only">{isOpen ? "Close sidebar" : "Open sidebar"}</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"