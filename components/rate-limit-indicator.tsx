"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GitHubAPI } from "@/lib/github-api"

interface RateLimitIndicatorProps {
  githubToken?: string
}

export function RateLimitIndicator({ githubToken }: RateLimitIndicatorProps) {
  const [rateLimit, setRateLimit] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkRateLimit = async () => {
      try {
        const githubAPI = new GitHubAPI(githubToken)
        const rateLimitData = await githubAPI.getRateLimitStatus()
        setRateLimit(rateLimitData)
      } catch (error) {
        console.error("Failed to fetch rate limit:", error)
      } finally {
        setLoading(false)
      }
    }

    checkRateLimit()
    const interval = setInterval(checkRateLimit, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [githubToken])

  if (loading || !rateLimit) return null

  const { core } = rateLimit.resources
  const remaining = core.remaining
  const limit = core.limit
  const resetTime = new Date(core.reset * 1000)
  const isLow = remaining < limit * 0.1 // Less than 10% remaining

  if (!isLow) return null

  return (
    <Alert className={`mb-4 ${isLow ? "border-orange-500 bg-orange-50" : "border-blue-500 bg-blue-50"}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          API Rate Limit: {remaining}/{limit} requests remaining
        </span>
        <div className="flex items-center text-xs text-slate-600">
          <Clock className="w-3 h-3 mr-1" />
          Resets at {resetTime.toLocaleTimeString()}
        </div>
      </AlertDescription>
    </Alert>
  )
}
