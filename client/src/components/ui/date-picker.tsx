import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: boolean
  errorMessage?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Select date",
  className,
  disabled = false,
  error = false,
  errorMessage,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [inputDay, setInputDay] = React.useState("")
  const [inputMonth, setInputMonth] = React.useState("")
  const [inputYear, setInputYear] = React.useState("")
  const [isAnimating, setIsAnimating] = React.useState(false)

  // Initialize with current date if no date is provided
  React.useEffect(() => {
    if (!date && !selectedDate) {
      const today = new Date()
      setSelectedDate(today)
      setInputDay(today.getDate().toString().padStart(2, '0'))
      setInputMonth((today.getMonth() + 1).toString().padStart(2, '0'))
      setInputYear(today.getFullYear().toString())
      onDateChange?.(today)
    } else if (date) {
      setSelectedDate(date)
      setInputDay(date.getDate().toString().padStart(2, '0'))
      setInputMonth((date.getMonth() + 1).toString().padStart(2, '0'))
      setInputYear(date.getFullYear().toString())
    }
  }, [date, selectedDate, onDateChange])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 200)
      
      setSelectedDate(newDate)
      setInputDay(newDate.getDate().toString().padStart(2, '0'))
      setInputMonth((newDate.getMonth() + 1).toString().padStart(2, '0'))
      setInputYear(newDate.getFullYear().toString())
      onDateChange?.(newDate)
      setOpen(false)
    }
  }

  const handleInputChange = (type: 'day' | 'month' | 'year', value: string) => {
    let newDay = parseInt(inputDay) || 1
    let newMonth = parseInt(inputMonth) || 1
    let newYear = parseInt(inputYear) || new Date().getFullYear()

    switch (type) {
      case 'day':
        setInputDay(value)
        newDay = parseInt(value) || 1
        break
      case 'month':
        setInputMonth(value)
        newMonth = parseInt(value) || 1
        break
      case 'year':
        setInputYear(value)
        newYear = parseInt(value) || new Date().getFullYear()
        break
    }

    // Validate and create new date
    if (newDay >= 1 && newDay <= 31 && newMonth >= 1 && newMonth <= 12 && newYear >= 1900) {
      try {
        const newDate = new Date(newYear, newMonth - 1, newDay)
        if (newDate.getDate() === newDay && newDate.getMonth() === newMonth - 1) {
          setSelectedDate(newDate)
          onDateChange?.(newDate)
        }
      } catch (error) {
        // Invalid date, ignore
      }
    }
  }

  const handlePopoverOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 150)
    }
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal transition-all duration-200",
              !selectedDate && "text-muted-foreground",
              error && "border-red-500 focus:border-red-500",
              isAnimating && "scale-[0.98] transition-transform duration-200",
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className={cn(
              "mr-2 h-4 w-4 transition-transform duration-200",
              open && "rotate-180"
            )} />
            {selectedDate ? format(selectedDate, "PPP") : placeholder}
            <ChevronDown className={cn(
              "ml-auto h-4 w-4 transition-transform duration-200",
              open && "rotate-180"
            )} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-auto p-0 shadow-lg border-0 bg-white rounded-lg",
            isAnimating && "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          )} 
          align="start"
        >
          <div className="p-4 space-y-4">
            {/* Date Input Controls */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="day-input" className="text-xs text-gray-500">
                  Day
                </Label>
                <Input
                  id="day-input"
                  type="number"
                  min="1"
                  max="31"
                  value={inputDay}
                  onChange={(e) => handleInputChange('day', e.target.value)}
                  className="h-8 text-center text-sm"
                  placeholder="DD"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="month-input" className="text-xs text-gray-500">
                  Month
                </Label>
                <Input
                  id="month-input"
                  type="number"
                  min="1"
                  max="12"
                  value={inputMonth}
                  onChange={(e) => handleInputChange('month', e.target.value)}
                  className="h-8 text-center text-sm"
                  placeholder="MM"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="year-input" className="text-xs text-gray-500">
                  Year
                </Label>
                <Input
                  id="year-input"
                  type="number"
                  min="1900"
                  max="2100"
                  value={inputYear}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  className="h-8 text-center text-sm"
                  placeholder="YYYY"
                />
              </div>
            </div>
            
            {/* Calendar */}
            <div className="border-t pt-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                month={selectedDate}
                className="rounded-md border-0"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Error Message */}
      {error && errorMessage && (
        <p className="text-sm text-red-600 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {errorMessage}
        </p>
      )}
    </div>
  )
}