import * as React from "react"
import { cn } from "../../components/utils"
import { Button } from "../../components/ui/button"
import { X, PanelLeft, ChevronLeft, ChevronRight } from "lucide-react"

// Sidebar Context
const SidebarContext = React.createContext({
  isOpen: false,
  setIsOpen: () => {},
  width: 200,
  setWidth: () => {},
  collapsed: false,
  setCollapsed: () => {},
})

// Sidebar Provider
export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [width, setWidth] = React.useState(200)
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <SidebarContext.Provider
      value={{ isOpen, setIsOpen, width, setWidth, collapsed, setCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

// Hook
export const useSidebar = () => React.useContext(SidebarContext)

// Main Sidebar Component
export const Sidebar = React.forwardRef(({ className, children, ...props }, ref) => {
  const { isOpen, width, setWidth, collapsed, setCollapsed } = useSidebar()

  const resizerRef = React.useRef(null)
  const isResizing = React.useRef(false)
  const prevWidthRef = React.useRef(width)

  // Resize Logic
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current || collapsed) return
      e.preventDefault()
      const newWidth = Math.max(180, Math.min(e.clientX, 220))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.userSelect = ""
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    const handleMouseDown = (e) => {
      e.preventDefault()
      if (collapsed) return
      isResizing.current = true
      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    const resizer = resizerRef.current
    if (resizer) {
      resizer.addEventListener("mousedown", handleMouseDown)
    }

    return () => {
      if (resizer) {
        resizer.removeEventListener("mousedown", handleMouseDown)
      }
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = ""
    }
  }, [setWidth, collapsed])

  // Collapse Toggle
  const toggleCollapse = () => {
    if (collapsed) {
      setWidth(prevWidthRef.current || 200)
      setCollapsed(false)
    } else {
      prevWidthRef.current = width
      setWidth(0)
      setCollapsed(true)
    }
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        ref={ref}
        style={{ width }}
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-all bg-white border-r group",
          isOpen && "translate-x-0",
          collapsed && "overflow-hidden",
          className
        )}
        {...props}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          {children}
        </div>

        {/* Resizer + Collapse Button */}
        <div
          ref={resizerRef}
          className="absolute top-0 right-0 h-full w-2 cursor-col-resize group-hover:bg-gray-200 transition-colors"
        >
          <button
            onClick={toggleCollapse}
            className="absolute top-1/2 -right-2 translate-x-full -translate-y-1/2 bg-gray-100 border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-white transition-opacity opacity-0 group-hover:opacity-100"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </aside>

      {/* Spacer for layout alignment */}
      <div className="hidden sm:block flex-shrink-0 transition-all" style={{ width }} />

      {/* Floating Expand Button (When Collapsed) */}
      {collapsed && (
        <button
          onClick={toggleCollapse}
          className="fixed top-1/2 left-0 z-50 -translate-y-1/2 translate-x-[-50%] bg-gray-100 border border-gray-300 rounded-r-full w-6 h-16 flex items-center justify-center shadow hover:bg-white"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </>
  )
})
Sidebar.displayName = "Sidebar"

//
// Subcomponents
//

export const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
))
SidebarHeader.displayName = "SidebarHeader"

export const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 p-4", className)} {...props} />
))
SidebarContent.displayName = "SidebarContent"

export const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mt-auto p-4", className)} {...props} />
))
SidebarFooter.displayName = "SidebarFooter"

export const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("space-y-1", className)} {...props} />
))
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

export const SidebarMenuButton = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant || "ghost"}
      size={size}
      className={cn("w-full justify-start", className)}
      asChild={asChild}
      {...props}
    />
  )
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export const SidebarTrigger = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
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
  }
)
SidebarTrigger.displayName = "SidebarTrigger"