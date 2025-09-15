import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "../utils"

const Select = ({ children, value, onValueChange, ...props }) => {
  return (
    <div className="relative" {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange })
        }
        return child
      })}
    </div>
  )
}

const SelectTrigger = React.forwardRef(({ className, children, value, onValueChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <div className="relative">
      <button
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    </div>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }) => (
  <span className="text-gray-500">{placeholder}</span>
)

const SelectContent = ({ children, value, onValueChange }) => {
  return (
    <div className="absolute top-full left-0 z-50 w-full min-w-[8rem] overflow-hidden rounded-md border bg-white shadow-md">
      <div className="p-1">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { 
              selectedValue: value, 
              onSelect: onValueChange 
            })
          }
          return child
        })}
      </div>
    </div>
  )
}

const SelectItem = React.forwardRef(({ className, children, value, selectedValue, onSelect, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100",
      className
    )}
    onClick={() => onSelect && onSelect(value)}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {selectedValue === value && <Check className="h-4 w-4" />}
    </span>
    {children}
  </div>
))
SelectItem.displayName = "SelectItem"

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}