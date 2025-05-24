"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Star,
  Twitter,
  Rss,
  ExternalLink,
  X,
  TrendingUp,
  Calendar,
  GitFork,
  Plus,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

// Mock data for the chart
const generateMockData = (repoName: string) => {
  const data = []
  const startDate = new Date("2023-01-01")
  const endDate = new Date()
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  let stars = Math.floor(Math.random() * 100) + 50

  for (let i = 0; i <= totalDays; i += 7) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const growth = Math.floor(Math.random() * 20) + 1
    stars += growth

    data.push({
      date: date.toISOString().split("T")[0],
      stars: stars,
      displayDate: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    })
  }

  return data
}

export default function StarHistoryClone() {
  const [selectedRepos, setSelectedRepos] = useState([
    { name: "x1xhlol/system-prompts-and-models-of-ai-tools", color: "#3b82f6", stars: 2847 },
  ])
  const [searchInput, setSearchInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [showStats, setShowStats] = useState(true)

  const repoColors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]

  useEffect(() => {
    if (selectedRepos.length > 0) {
      // Generate combined chart data
      const combinedData = generateMockData(selectedRepos[0].name)
      setChartData(combinedData)
    }
  }, [selectedRepos])

  const monthlyPicks = [
    { date: "2025 May", title: "Agent Protocol", category: "Agent Protocol", trending: true },
    { date: "2025 Apr", title: "AI Verse", category: "AI Verse", trending: false },
    { date: "2025 Mar", title: "MCP Server", category: "MCP Server", trending: true },
    { date: "2025 Feb", title: "DeepSeek", category: "DeepSeek", trending: true },
    { date: "2025 Jan", title: "Knowledge Management", category: "Knowledge Management", trending: false },
    { date: "2024 Dec", title: "AI Data Visualization", category: "AI Data Visualization", trending: false },
    { date: "2024 Nov", title: "AI DevTools", category: "AI DevTools", trending: true },
    { date: "2024 Oct", title: "Homelab", category: "Homelab", trending: false },
    { date: "2024 Sep", title: "AI Agents", category: "AI Agents", trending: true },
    { date: "2024 Aug", title: "RAG Frameworks", category: "RAG Frameworks", trending: false },
  ]

  const handleViewStarHistory = async () => {
    if (searchInput.trim()) {
      setIsLoading(true)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newRepo = {
        name: searchInput.trim(),
        color: repoColors[selectedRepos.length % repoColors.length],
        stars: Math.floor(Math.random() * 5000) + 100,
      }

      setSelectedRepos([...selectedRepos, newRepo])
      setSearchInput("")
      setIsLoading(false)
    }
  }

  const removeRepo = (index: number) => {
    const newRepos = selectedRepos.filter((_, i) => i !== index)
    setSelectedRepos(newRepos)
  }

  const clearAllRepos = () => {
    setSelectedRepos([])
    setChartData([])
  }

  const totalStars = selectedRepos.reduce((sum, repo) => sum + repo.stars, 0)
  const avgGrowth =
    chartData.length > 1
      ? Math.round(((chartData[chartData.length - 1]?.stars - chartData[0]?.stars) / chartData.length) * 7)
      : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl border-b border-slate-700">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Star className="w-5 h-5 text-white fill-current" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                StarHistory
              </span>
            </div>
            <nav className="flex items-center space-x-6">
              <Link href="#" className="hover:text-emerald-400 transition-all duration-200 font-medium">
                Blog
              </Link>
              <Link href="#" className="hover:text-emerald-400 transition-all duration-200 font-medium">
                Add Access Token
              </Link>
              <Link href="#" className="hover:text-emerald-400 transition-all duration-200 font-medium">
                API
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105">
              <Sparkles className="w-4 h-4 mr-2" />
              Subscribe to Newsletter
            </Button>
            <Link
              href="#"
              className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-slate-700"
            >
              <Twitter className="w-5 h-5" />
            </Link>
            <Link
              href="#"
              className="text-orange-400 hover:text-orange-300 transition-colors p-2 rounded-lg hover:bg-slate-700"
            >
              <Rss className="w-5 h-5" />
            </Link>
            <Button
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700 transition-all duration-200"
            >
              <Star className="w-4 h-4 mr-2 fill-current" />
              Star 7,389
            </Button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-80 border-r border-slate-200 min-h-screen bg-white/50 backdrop-blur-sm">
          <div className="p-6">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="w-6 h-6 text-white fill-current" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-slate-800">Starlet</span>
                  <div className="text-xs text-slate-500">by StarHistory</div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-700 flex items-center font-medium">
                  ⭐ Show your project for FREE
                  <ExternalLink className="w-3 h-3 ml-1" />
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
                Playbook
              </h3>
              <div className="space-y-3">
                <Card className="border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors cursor-pointer">
                  <CardContent className="p-3">
                    <Link href="#" className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      How to Use this Site
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer">
                  <CardContent className="p-3">
                    <Link href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      How to Get More Stars
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                Monthly Pick
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {monthlyPicks.map((pick, index) => (
                  <Card
                    key={index}
                    className="border-slate-200 hover:border-emerald-300 transition-all duration-200 cursor-pointer group"
                  >
                    <CardContent className="p-3">
                      <Link href="#" className="block">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">{pick.date}</div>
                            <div className="text-sm font-medium text-slate-700 group-hover:text-emerald-600 transition-colors">
                              {pick.category}
                            </div>
                          </div>
                          {pick.trending && (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                              Trending
                            </Badge>
                          )}
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* News Banner */}
          <Card className="mb-6 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-emerald-600 text-white">{"What's new"}</Badge>
                  <span className="text-sm font-medium text-slate-700">
                    Star History Monthly May 2025 | Agent Protocol
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Section */}
          <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex space-x-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Enter GitHub repository (e.g., facebook/react)"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10 h-12 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                    onKeyPress={(e) => e.key === "Enter" && handleViewStarHistory()}
                  />
                </div>
                <Button
                  onClick={handleViewStarHistory}
                  disabled={isLoading || !searchInput.trim()}
                  className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Plus className="w-5 h-5 mr-2" />
                  )}
                  Add Repository
                </Button>
              </div>

              {selectedRepos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-700">Selected Repositories</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllRepos}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedRepos.map((repo, index) => (
                      <div
                        key={index}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center space-x-2 shadow-sm"
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: repo.color }}></div>
                        <span className="text-sm font-medium text-slate-700">{repo.name}</span>
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{repo.stars.toLocaleString()}</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                        <button
                          onClick={() => removeRepo(index)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
          {selectedRepos.length > 0 && showStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Stars</p>
                      <p className="text-2xl font-bold text-blue-900">{totalStars.toLocaleString()}</p>
                    </div>
                    <Star className="w-8 h-8 text-blue-600 fill-current" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-700">Repositories</p>
                      <p className="text-2xl font-bold text-emerald-900">{selectedRepos.length}</p>
                    </div>
                    <GitFork className="w-8 h-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Avg Growth/Week</p>
                      <p className="text-2xl font-bold text-purple-900">+{avgGrowth}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Time Range</p>
                      <p className="text-2xl font-bold text-orange-900">{chartData.length}w</p>
                    </div>
                    <Calendar className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chart Area */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="text-xl font-bold text-slate-800">Star History</span>
                {selectedRepos.length > 0 && (
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span>Last updated: {new Date().toLocaleDateString()}</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-96">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Loading star history...</p>
                    <p className="text-sm text-slate-400">Fetching data from GitHub API</p>
                  </div>
                ) : selectedRepos.length > 0 && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorStars" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="displayDate" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value: any) => [value.toLocaleString(), "Stars"]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="stars"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#colorStars)"
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2, fill: "white" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-12 h-12 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">Ready to track star history?</h3>
                      <p className="text-slate-500 mb-4">Add a GitHub repository to see its star growth over time</p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
                        <Star className="w-4 h-4" />
                        <span>Powered by GitHub API</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
