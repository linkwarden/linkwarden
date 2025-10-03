import { useCallback, useEffect, useRef, useState } from 'react'

enum CopyTextStatus {
  Idle = "idle",
  Copied = "copied",
  Error = "error"
}

interface CopyTextOptions {
  onCopy?: () => void
  onError?: (error: Error) => void
  resetAfter?: number // milliseconds
}

const DEFAULT_RESET_AFTER = 2000

function useCopyText({
  onCopy,
  onError,
  resetAfter = DEFAULT_RESET_AFTER
}: CopyTextOptions = {}) {
  const [status, setStatus] = useState<CopyTextStatus>(CopyTextStatus.Idle)
  const mountedRef = useRef(true)
  const onCopyRef = useRef(onCopy)
  const onErrorRef = useRef(onError)
  const resetAfterRef = useRef(resetAfter)

  useEffect(() => { onCopyRef.current = onCopy }, [onCopy])
  useEffect(() => { onErrorRef.current = onError }, [onError])
  useEffect(() => { resetAfterRef.current = resetAfter }, [resetAfter])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const legacyCopy = useCallback((textToCopy: string) => {
    try {
      const ta = document.createElement('textarea')
      ta.value = textToCopy
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.top = '-9999px'
      ta.style.opacity = '0'

      const selection = document.getSelection()
      const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
      const activeEl = document.activeElement as HTMLElement | null

      document.body.appendChild(ta)
      ta.select()
      ta.setSelectionRange(0, ta.value.length)

      const ok = document.execCommand('copy')
      document.body.removeChild(ta)

      // restore previous selection
      if (originalRange && selection) {
        selection.removeAllRanges()
        selection.addRange(originalRange)
      }

      activeEl?.focus()

      return ok
    } catch {
      return false
    }
  }, [])

  const copy = useCallback(async (textToCopy: string): Promise<boolean> => {
    // SSR guard
    if (typeof window === "undefined" || typeof document === "undefined") {
      return false
    }

    try {
      let success = false

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy)
        success = true
      } else {
        success = legacyCopy(textToCopy)
      }

      if (!mountedRef.current) {
        return success
      }

      if (success) {
        setStatus(CopyTextStatus.Copied)
        onCopyRef.current?.()

        // Reset status after a delay
        setTimeout(() => {
          if (mountedRef.current) setStatus(CopyTextStatus.Idle)
        }, resetAfterRef.current)
      } else {
        setStatus(CopyTextStatus.Error)
        onErrorRef.current?.(new Error("Copy failed"))
      }

      return success
    } catch (err) {
      if (!mountedRef.current) return false
      setStatus(CopyTextStatus.Error)
      onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)))

      return false
    }
  }, [legacyCopy]);

  const reset = useCallback(() => {
    if (mountedRef.current) setStatus(CopyTextStatus.Idle)
  }, [])

  return {
    copy, 
    copied: status === CopyTextStatus.Copied,
    status,
    reset
  }
}

export { useCopyText }

