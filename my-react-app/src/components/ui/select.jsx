import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "../utils" // assuming you have a classnames util

const SelectContext = React.createContext()

const Select = ({ children, value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const toggleOpen = () => setIsOpen(prev => !prev)
  const close = () => setIsOpen(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, toggleOpen, close }}>
      <div className="relative w-full" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef(({ className }, ref) => {
  const { isOpen, toggleOpen, value } = React.useContext(SelectContext)

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggleOpen}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <span className="truncate">
        {value ? value.charAt(0).toUpperCase() + value.slice(1) : <SelectValue />}
      </span>
      <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder = "Select an option" }) => (
  <span className="text-gray-500">{placeholder}</span>
)

const SelectContent = ({ children }) => {
  const { isOpen } = React.useContext(SelectContext)

  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-white shadow-md">
      <div className="p-1">
        {children}
      </div>
    </div>
  )
}

const SelectItem = React.forwardRef(({ children, value, className }, ref) => {
  const { value: selectedValue, onValueChange, close } = React.useContext(SelectContext)

  const handleSelect = () => {
    onValueChange(value)
    close()
  }

  return (
    <div
      ref={ref}
      onClick={handleSelect}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-gray-800 hover:bg-gray-100",
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {selectedValue === value && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}
