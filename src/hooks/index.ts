import { useEffect, useState } from "react"

/**
 * Custom hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timeoutId)
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for responsive layout changes
 */
export function useResponsiveLayout(setLayout: (layout: { orientation: "horizontal" | "vertical" }) => void) {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)")
    const handleChange = () => setLayout({ 
      orientation: mediaQuery.matches ? "vertical" : "horizontal" 
    })
    
    handleChange()
    mediaQuery.addEventListener?.("change", handleChange)
    return () => mediaQuery.removeEventListener?.("change", handleChange)
  }, [setLayout])
}

/**
 * Custom hook to force dark mode
 */
export function useDarkMode() {
  useEffect(() => {
    document?.documentElement.classList.add("dark")
  }, [])
}