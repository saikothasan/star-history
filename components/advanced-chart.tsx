"use client"

import { useState, useMemo } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Brush,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Star, Activity, ZoomIn, ZoomOut } from "lucide-react"
import type { GitHubRepo, StarHistoryData } from "@/lib/github-api"

interface AdvancedChartProps {
  repositories: Array<GitHubRepo & { color: string; starHistory?: StarHistoryData[] }>
  starHistoryData: Record<string, StarHistoryData[]>
  isLoading: boolean
  selectedTimeRange: "all" | "1y" | "6m" | "3m" | "1m"
  onTimeRangeChange: (range: "all" | "1y" | "6m" | "3m" | "1m") => void
  hoveredDataPoint: any
  onHoveredDataPointChange: (point: any) => void
  zoomDomain: { start?: number; end?: number }
  onZoomDomainChange: (domain: { start?: number; end?: number }) => void
}

export function AdvancedChart({
  repositories = [],
  starHistoryData = {},
  isLoading = false,
  selectedTimeRange = "all",
  onTimeRangeChange,
  hoveredDataPoint,
  onHoveredDataPointChange,
  zoomDomain = {},
  onZoomDomainChange,
}: AdvancedChartProps) {
  const [showBrush, setShowBrush] = useState(false)
  const [crosshairData, setCrosshairData] = useState<any>(null)

  // Early return if no repositories
  if (!repositories || repositories.length === 0) {
    return (
      <div className="h-64 sm:h-96 flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-lg">
          <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" />
        </div>
        <div className="text-center px-4">
          <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">Ready to track star history?</h3>
          <p className="text-slate-500 mb-4 text-sm sm:text-base">
            Add a GitHub repository to see its star growth over time
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
            <Star className="w-4 h-4" />
            <span>Powered by GitHub API</span>
          </div>
        </div>
      </div>
    )
  }

  const calculateDailyGrowth = (history: StarHistoryData[], currentDate: string): number => {
    if (!history || history.length === 0) return 0

    const currentIndex = history.findIndex((p) => p.date === currentDate)
    if (currentIndex <= 0) return 0

    const current = history[currentIndex]
    const previous = history[currentIndex - 1]

    if (!current || !previous) return 0

    return current.stars - previous.stars
  }

  const [filteredChartData, setFilteredChartData] = useState<any[]>([])

  useMemo(() => {
    if (!repositories || repositories.length === 0) {
      setFilteredChartData([])
      return
    }

    try {
      const now = new Date()
      let startDate: Date

      switch (selectedTimeRange) {
        case "1m":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case "3m":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case "6m":
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
          break
        case "1y":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date("1970-01-01")
      }

      const allDates = new Set<string>()
      repositories.forEach((repo) => {
        if (repo.starHistory && Array.isArray(repo.starHistory)) {
          repo.starHistory.forEach((point) => {
            if (point && point.date) {
              const pointDate = new Date(point.date)
              if (pointDate >= startDate && !isNaN(pointDate.getTime())) {
                allDates.add(point.date)
              }
            }
          })
        }
      })

      const sortedDates = Array.from(allDates).sort()

      const newFilteredChartData = sortedDates.map((date) => {
        const dataPoint: any = {
          date,
          timestamp: new Date(date).getTime(),
          displayDate: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: selectedTimeRange === "all" ? "numeric" : undefined,
          }),
        }

        repositories.forEach((repo, index) => {
          if (repo.starHistory && Array.isArray(repo.starHistory)) {
            const historyPoint = repo.starHistory.find((p) => p && p.date === date)
            if (historyPoint) {
              dataPoint[`repo${index}`] = historyPoint.stars
              dataPoint[`repo${index}_growth`] = calculateDailyGrowth(repo.starHistory, date)
            }
          }
        })

        return dataPoint
      })
      setFilteredChartData(newFilteredChartData)
    } catch (error) {
      console.error("Error processing chart data:", error)
      setFilteredChartData([])
    }
  }, [repositories, selectedTimeRange])

  const timeRangeOptions = [
    { value: "all" as const, label: "All Time" },
    { value: "1y" as const, label: "1 Year" },
    { value: "6m" as const, label: "6 Months" },
    { value: "3m" as const, label: "3 Months" },
    { value: "1m" as const, label: "1 Month" },
  ]

  const handleZoomIn = () => {
    if (filteredChartData.length > 0) {
      const total = filteredChartData.length
      const start = Math.floor(total * 0.25)
      const end = Math.floor(total * 0.75)
      onZoomDomainChange({
        start: filteredChartData[start]?.timestamp,
        end: filteredChartData[end]?.timestamp,
      })
    }
  }

  const handleZoomOut = () => {
    onZoomDomainChange({})
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0]?.payload
    if (!data) return null

    return (
      <Card className="border shadow-lg bg-white/95 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="space-y-3">
            <div className="border-b pb-2">
              <p className="font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-500">
                {new Date(data.timestamp).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {payload.map((entry: any, index: number) => {
              const repoIndex = Number.parseInt(entry.dataKey.replace("repo", ""))
              const repo = repositories[repoIndex]
              if (!repo) return null

              const growth = data[`repo${repoIndex}_growth`] || 0

              return (
                <div key={index} className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm font-medium text-slate-700 truncate">{repo.full_name}</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="font-bold text-slate-800">{entry.value?.toLocaleString()}</span>
                    </div>
                    {growth > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{growth.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="h-64 sm:h-96 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Loading star history...</p>
        <p className="text-sm text-slate-400">Fetching data from GitHub API</p>
      </div>
    )
  }

  if (repositories.length === 0 || filteredChartData.length === 0) {
    return (
      <div className="h-64 sm:h-96 flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-lg">
          <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" />
        </div>
        <div className="text-center px-4">
          <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">Ready to track star history?</h3>
          <p className="text-slate-500 mb-4 text-sm sm:text-base">
            Add a GitHub repository to see its star growth over time
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
            <Star className="w-4 h-4" />
            <span>Powered by GitHub API</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-wrap gap-2">
          {timeRangeOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedTimeRange === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onTimeRangeChange(option.value)}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={filteredChartData.length === 0}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={!zoomDomain.start && !zoomDomain.end}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBrush(!showBrush)}>
            <Activity className="w-4 h-4 mr-1" />
            Timeline
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredChartData}
            onMouseMove={(e) => {
              if (e?.activePayload?.[0]) {
                setCrosshairData(e.activePayload[0].payload)
                onHoveredDataPointChange(e.activePayload[0].payload)
              }
            }}
            onMouseLeave={() => {
              setCrosshairData(null)
              onHoveredDataPointChange(null)
            }}
          >
            <defs>
              {repositories.map((repo, index) => (
                <linearGradient key={index} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={repo.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={repo.color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="displayDate"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              interval="preserveStartEnd"
              domain={zoomDomain.start && zoomDomain.end ? [zoomDomain.start, zoomDomain.end] : ["dataMin", "dataMax"]}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => value.toLocaleString()}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />

            {repositories.map(
              (repo, index) =>
                repo.starHistory && (
                  <Area
                    key={index}
                    type="monotone"
                    dataKey={`repo${index}`}
                    stroke={repo.color}
                    strokeWidth={2}
                    fill={`url(#color${index})`}
                    dot={false}
                    activeDot={{
                      r: 5,
                      stroke: repo.color,
                      strokeWidth: 2,
                      fill: "white",
                      boxShadow: "0 0 0 2px rgba(0,0,0,0.1)",
                    }}
                  />
                ),
            )}

            {crosshairData && (
              <ReferenceLine x={crosshairData.displayDate} stroke="#64748b" strokeDasharray="2 2" strokeOpacity={0.5} />
            )}

            {showBrush && <Brush dataKey="displayDate" height={30} stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200">
        {repositories.map((repo, index) => (
          <div key={repo.id} className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: repo.color }} />
            <span className="text-sm font-medium text-slate-700">{repo.full_name}</span>
            <Badge variant="secondary" className="text-xs">
              {repo.stargazers_count.toLocaleString()} stars
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
