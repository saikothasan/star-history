"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  Award,
  Target,
  Activity,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import type { GitHubRepo, StarHistoryData } from "@/lib/github-api"

interface RepositoryInsightsProps {
  repositories?: Array<GitHubRepo & { color: string; starHistory?: StarHistoryData[] }>
  starHistoryData?: Record<string, StarHistoryData[]>
  githubToken?: string
}

interface Insight {
  type: "milestone" | "trend" | "prediction" | "comparison"
  title: string
  description: string
  value?: string
  trend?: "up" | "down" | "stable"
  severity?: "low" | "medium" | "high"
  date?: string
  repository?: string
}

interface RepositoryMetrics {
  velocityScore: number
  consistencyScore: number
  momentumScore: number
  milestones: Array<{ date: string; stars: number; type: string }>
  growthRate: number
  averageDailyGrowth: number
  bestPeriod: { start: string; end: string; growth: number }
  prediction30Days: number
}

export function RepositoryInsights({ repositories = [], starHistoryData = {}, githubToken }: RepositoryInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [metrics, setMetrics] = useState<Record<string, RepositoryMetrics>>({})
  const [selectedRepo, setSelectedRepo] = useState<string>()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [repoMetrics, setRepoMetrics] = useState<Record<string, RepositoryMetrics>>({})

  // Calculate repository metrics
  const calculateMetrics = () => {
    const metrics: Record<string, RepositoryMetrics> = {}

    if (!repositories || repositories.length === 0) return metrics

    repositories.forEach((repo) => {
      try {
        if (!repo.starHistory || !Array.isArray(repo.starHistory) || repo.starHistory.length < 2) return

        const history = repo.starHistory
          .filter((point) => point && point.date && typeof point.stars === "number")
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        if (history.length < 2) return

        const totalDays = Math.max(
          1,
          (new Date(history[history.length - 1].date).getTime() - new Date(history[0].date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
        const totalGrowth = Math.max(0, history[history.length - 1].stars - history[0].stars)

        // Calculate velocity (stars per day)
        const averageDailyGrowth = totalGrowth / totalDays

        // Calculate consistency score (based on growth variance)
        const dailyGrowths = history.slice(1).map((point, index) => Math.max(0, point.stars - history[index].stars))
        const avgGrowth = dailyGrowths.reduce((sum, growth) => sum + growth, 0) / Math.max(1, dailyGrowths.length)
        const variance =
          dailyGrowths.reduce((sum, growth) => sum + Math.pow(growth - avgGrowth, 2), 0) /
          Math.max(1, dailyGrowths.length)
        const consistencyScore = avgGrowth > 0 ? Math.max(0, 100 - (Math.sqrt(variance) / avgGrowth) * 100) : 0

        // Calculate momentum (recent vs overall performance)
        const recent30Days = history.slice(-Math.min(30, history.length))
        const recentGrowth =
          recent30Days.length > 1
            ? Math.max(0, (recent30Days[recent30Days.length - 1].stars - recent30Days[0].stars) / recent30Days.length)
            : 0
        const momentumScore = Math.min(100, averageDailyGrowth > 0 ? (recentGrowth / averageDailyGrowth) * 100 : 0)

        // Find milestones
        const milestones: Array<{ date: string; stars: number; type: string }> = []
        const milestoneTargets = [100, 500, 1000, 5000, 10000, 50000, 100000]

        milestoneTargets.forEach((target) => {
          const milestone = history.find((point) => point.stars >= target)
          if (milestone) {
            milestones.push({
              date: milestone.date,
              stars: target,
              type: target >= 10000 ? "major" : target >= 1000 ? "significant" : "minor",
            })
          }
        })

        // Find best growth period (30-day window)
        let bestPeriod = { start: "", end: "", growth: 0 }
        const windowSize = Math.min(30, Math.floor(history.length / 2))

        for (let i = 0; i < history.length - windowSize; i++) {
          const windowGrowth = Math.max(0, history[i + windowSize].stars - history[i].stars)
          if (windowGrowth > bestPeriod.growth) {
            bestPeriod = {
              start: history[i].date,
              end: history[i + windowSize].date,
              growth: windowGrowth,
            }
          }
        }

        // Simple prediction (linear projection)
        const prediction30Days = Math.max(
          repo.stargazers_count,
          Math.round(repo.stargazers_count + averageDailyGrowth * 30),
        )

        metrics[repo.full_name] = {
          velocityScore: Math.min(100, Math.max(0, averageDailyGrowth * 10)),
          consistencyScore: Math.round(Math.max(0, Math.min(100, consistencyScore))),
          momentumScore: Math.round(Math.max(0, Math.min(100, momentumScore))),
          milestones,
          growthRate: repo.stargazers_count > 0 ? (totalGrowth / repo.stargazers_count) * 100 : 0,
          averageDailyGrowth: Math.max(0, averageDailyGrowth),
          bestPeriod,
          prediction30Days,
        }
      } catch (error) {
        console.error(`Error calculating metrics for ${repo.full_name}:`, error)
      }
    })

    return metrics
  }

  const calculatedRepoMetrics = useMemo(() => {
    return calculateMetrics()
  }, [repositories])

  // Early return if no repositories
  if (!repositories || repositories.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600">No repositories to analyze</p>
        <p className="text-sm text-slate-500">Add repositories to generate insights</p>
      </div>
    )
  }

  // Generate insights
  useEffect(() => {
    setMetrics(calculatedRepoMetrics)

    const newInsights: Insight[] = []

    repositories.forEach((repo) => {
      const repoMetrics = calculatedRepoMetrics[repo.full_name]
      if (!repoMetrics) return

      // Momentum insights
      if (repoMetrics.momentumScore > 120) {
        newInsights.push({
          type: "trend",
          title: "Strong Growth Momentum",
          description: `${repo.full_name} is experiencing accelerated growth, outpacing its historical average by ${Math.round(repoMetrics.momentumScore - 100)}%`,
          trend: "up",
          severity: "high",
          repository: repo.full_name,
        })
      } else if (repoMetrics.momentumScore < 50) {
        newInsights.push({
          type: "trend",
          title: "Slowing Growth",
          description: `${repo.full_name} growth has slowed significantly compared to its historical pattern`,
          trend: "down",
          severity: "medium",
          repository: repo.full_name,
        })
      }

      // Milestone insights
      const recentMilestones = repoMetrics.milestones.filter((m) => {
        const milestoneDate = new Date(m.date)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return milestoneDate > thirtyDaysAgo
      })

      recentMilestones.forEach((milestone) => {
        newInsights.push({
          type: "milestone",
          title: `${milestone.stars.toLocaleString()} Stars Milestone`,
          description: `${repo.full_name} recently reached ${milestone.stars.toLocaleString()} stars`,
          date: milestone.date,
          severity: milestone.type === "major" ? "high" : "medium",
          repository: repo.full_name,
        })
      })

      // Prediction insights
      const growthProjection = repoMetrics.prediction30Days - repo.stargazers_count
      if (growthProjection > 0) {
        newInsights.push({
          type: "prediction",
          title: "30-Day Growth Forecast",
          description: `${repo.full_name} is projected to gain ~${growthProjection.toLocaleString()} stars in the next 30 days`,
          value: `+${growthProjection.toLocaleString()}`,
          trend: "up",
          severity: "low",
          repository: repo.full_name,
        })
      }
    })

    // Comparison insights
    if (repositories.length > 1) {
      const sortedByMomentum = repositories.sort((a, b) => {
        const aMetrics = calculatedRepoMetrics[a.full_name]
        const bMetrics = calculatedRepoMetrics[b.full_name]
        return (bMetrics?.momentumScore || 0) - (aMetrics?.momentumScore || 0)
      })

      newInsights.push({
        type: "comparison",
        title: "Growth Leader",
        description: `${sortedByMomentum[0]?.full_name} has the strongest current growth momentum among compared repositories`,
        trend: "up",
        severity: "medium",
        repository: sortedByMomentum[0]?.full_name,
      })
    }

    setInsights(newInsights)
  }, [repositories, calculatedRepoMetrics])

  const getMetricColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getMetricBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    if (score >= 40) return "bg-orange-100"
    return "bg-red-100"
  }

  const getInsightIcon = (insight: Insight) => {
    switch (insight.type) {
      case "milestone":
        return <Award className="w-4 h-4" />
      case "trend":
        return insight.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
      case "prediction":
        return <Target className="w-4 h-4" />
      case "comparison":
        return <Activity className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "border-emerald-500 bg-emerald-50"
      case "medium":
        return "border-blue-500 bg-blue-50"
      default:
        return "border-slate-300 bg-slate-50"
    }
  }

  return (
    <div className="space-y-6">
      {/* Repository Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {repositories.map((repo) => {
          const repoMetrics = metrics[repo.full_name]
          if (!repoMetrics) return null

          return (
            <Card
              key={repo.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedRepo === repo.full_name ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedRepo(selectedRepo === repo.full_name ? undefined : repo.full_name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-700 truncate">{repo.full_name}</CardTitle>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: repo.color }} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Velocity Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      Velocity
                    </span>
                    <span className={`text-xs font-bold ${getMetricColor(repoMetrics.velocityScore)}`}>
                      {Math.round(repoMetrics.velocityScore)}/100
                    </span>
                  </div>
                  <Progress value={repoMetrics.velocityScore} className="h-2" />
                  <p className="text-xs text-slate-500 mt-1">
                    {repoMetrics.averageDailyGrowth.toFixed(1)} stars/day avg
                  </p>
                </div>

                {/* Consistency Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 flex items-center">
                      <Activity className="w-3 h-3 mr-1" />
                      Consistency
                    </span>
                    <span className={`text-xs font-bold ${getMetricColor(repoMetrics.consistencyScore)}`}>
                      {repoMetrics.consistencyScore}/100
                    </span>
                  </div>
                  <Progress value={repoMetrics.consistencyScore} className="h-2" />
                </div>

                {/* Momentum Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Momentum
                    </span>
                    <span className={`text-xs font-bold ${getMetricColor(repoMetrics.momentumScore)}`}>
                      {repoMetrics.momentumScore}/100
                    </span>
                  </div>
                  <Progress value={repoMetrics.momentumScore} className="h-2" />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Next 30 days</p>
                    <p className="text-sm font-bold text-emerald-600">
                      +{(repoMetrics.prediction30Days - repo.stargazers_count).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Milestones</p>
                    <p className="text-sm font-bold text-purple-600">{repoMetrics.milestones.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Metrics for Selected Repo */}
      {selectedRepo && metrics[selectedRepo] && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Detailed Analysis: {selectedRepo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-slate-700 mb-2">Best Growth Period</h4>
                <p className="text-sm text-slate-600 mb-1">
                  {new Date(metrics[selectedRepo].bestPeriod.start).toLocaleDateString()} -{" "}
                  {new Date(metrics[selectedRepo].bestPeriod.end).toLocaleDateString()}
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  +{metrics[selectedRepo].bestPeriod.growth.toLocaleString()} stars
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-slate-700 mb-2">Growth Rate</h4>
                <p className="text-lg font-bold text-blue-600">{metrics[selectedRepo].growthRate.toFixed(1)}%</p>
                <p className="text-sm text-slate-600">Total growth</p>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-slate-700 mb-2">Recent Milestones</h4>
                <div className="space-y-1">
                  {metrics[selectedRepo].milestones.slice(-3).map((milestone, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{milestone.stars.toLocaleString()} stars</span>
                      <Badge variant="secondary" className="text-xs">
                        {new Date(milestone.date).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-purple-600" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.slice(0, 6).map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(insight.severity)}`}>
                  <div className="flex items-start space-x-3">
                    <div
                      className={`mt-0.5 ${
                        insight.severity === "high"
                          ? "text-emerald-600"
                          : insight.severity === "medium"
                            ? "text-blue-600"
                            : "text-slate-600"
                      }`}
                    >
                      {getInsightIcon(insight)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-slate-800">{insight.title}</h4>
                        {insight.value && (
                          <Badge variant="secondary" className="ml-2">
                            {insight.value}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{insight.description}</p>
                      {insight.date && (
                        <p className="text-xs text-slate-500 mt-2 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(insight.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No insights available yet</p>
              <p className="text-sm text-slate-500">Add repositories to generate insights</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
