"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
  AlertTriangle,
  Menu,
  Download,
  GitBranch,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { GitHubAPI, type GitHubRepo, type StarHistoryData } from "@/lib/github-api"
import { GitHubTokenDialog } from "@/components/github-token-dialog"
import { RepositorySearch } from "@/components/repository-search"
import { RateLimitIndicator } from "@/components/rate-limit-indicator"
import { ExportDialog } from "@/components/export-dialog"
import { RepositoryComparison } from "@/components/repository-comparison"
import { RepositoryInsights } from "@/components/repository-insights"
import { EmbedDialog } from "@/components/embed-dialog"
import { AdvancedChart } from "@/components/advanced-chart"

interface SelectedRepo extends GitHubRepo {
  color: string
  starHistory?: StarHistoryData[]
  isLoading?: boolean
  error?: string
}

export default function StarHistoryClone() {
  const [selectedRepos, setSelectedRepos] = useState<SelectedRepo[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [githubToken, setGithubToken] = useState<string>()
  const [error, setError] = useState<string>()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  const [selectedTimeRange, setSelectedTimeRange] = useState<"all" | "1y" | "6m" | "3m" | "1m">("all")
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any>(null)
  const [showInsights, setShowInsights] = useState(false)
  const [zoomDomain, setZoomDomain] = useState<{ start?: number; end?: number }>({})

  const repoColors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]

  // Load GitHub token from localStorage on mount with error handling
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedToken = localStorage.getItem("github_token")
        if (savedToken) {
          setGithubToken(savedToken)
        }
      }
    } catch (error) {
      console.error("Error loading GitHub token:", error)
    }
  }, [])

  const handleTokenSave = (token: string) => {
    try {
      setGithubToken(token)
      if (typeof window !== "undefined") {
        localStorage.setItem("github_token", token)
      }
    } catch (error) {
      console.error("Error saving GitHub token:", error)
    }
  }

  const parseRepoInput = (input: string): { owner: string; repo: string } | null => {
    const patterns = [
      /^([^/]+)\/([^/]+)$/, // owner/repo
      /^https?:\/\/github\.com\/([^/]+)\/([^/]+)/, // GitHub URL
    ]

    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match) {
        return { owner: match[1], repo: match[2] }
      }
    }
    return null
  }

  const addRepositoryByInput = async () => {
    if (!searchInput.trim()) return

    const parsed = parseRepoInput(searchInput.trim())
    if (!parsed) {
      setError("Please enter a valid repository format (owner/repo) or GitHub URL")
      return
    }

    setIsLoading(true)
    setError(undefined)

    try {
      const githubAPI = new GitHubAPI(githubToken)
      const repoData = await githubAPI.getRepository(parsed.owner, parsed.repo)

      if (selectedRepos.some((repo) => repo.full_name === repoData.full_name)) {
        setError("Repository is already added")
        setIsLoading(false)
        return
      }

      const newRepo: SelectedRepo = {
        ...repoData,
        color: repoColors[selectedRepos.length % repoColors.length],
        isLoading: true,
      }

      setSelectedRepos((prev) => [...prev, newRepo])
      setSearchInput("")

      fetchStarHistory(newRepo, selectedRepos.length)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const addRepositoryFromSearch = async (repo: GitHubRepo) => {
    if (selectedRepos.some((r) => r.full_name === repo.full_name)) {
      setError("Repository is already added")
      return
    }

    const newRepo: SelectedRepo = {
      ...repo,
      color: repoColors[selectedRepos.length % repoColors.length],
      isLoading: true,
    }

    setSelectedRepos((prev) => [...prev, newRepo])
    fetchStarHistory(newRepo, selectedRepos.length)
  }

  const fetchStarHistory = async (repo: SelectedRepo, index: number) => {
    try {
      const githubAPI = new GitHubAPI(githubToken)
      const [owner, repoName] = repo.full_name.split("/")
      const starHistory = await githubAPI.getEnhancedStarHistory(owner, repoName)

      setSelectedRepos((prev) => prev.map((r, i) => (i === index ? { ...r, starHistory, isLoading: false } : r)))
    } catch (err: any) {
      setSelectedRepos((prev) => prev.map((r, i) => (i === index ? { ...r, error: err.message, isLoading: false } : r)))
    }
  }

  const removeRepo = (index: number) => {
    setSelectedRepos((prev) => prev.filter((_, i) => i !== index))
  }

  const clearAllRepos = () => {
    setSelectedRepos([])
    setError(undefined)
  }

  // Combine all star history data for the chart
  const combinedChartData = () => {
    try {
      if (!selectedRepos || selectedRepos.length === 0) return []

      const allDates = new Set<string>()
      selectedRepos.forEach((repo) => {
        if (repo.starHistory && Array.isArray(repo.starHistory)) {
          repo.starHistory.forEach((point) => {
            if (point && point.date) {
              allDates.add(point.date)
            }
          })
        }
      })

      const sortedDates = Array.from(allDates).sort()

      return sortedDates.map((date) => {
        const dataPoint: any = { date }

        selectedRepos.forEach((repo, index) => {
          if (repo.starHistory && Array.isArray(repo.starHistory)) {
            const historyPoint = repo.starHistory.find((p) => p && p.date === date)
            if (historyPoint) {
              dataPoint[`repo${index}`] = historyPoint.stars
              dataPoint[`displayDate`] = historyPoint.displayDate
            }
          }
        })

        return dataPoint
      })
    } catch (error) {
      console.error("Error combining chart data:", error)
      return []
    }
  }

  const chartData = combinedChartData()
  const totalStars = selectedRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
  const isAnyLoading = selectedRepos.some((repo) => repo.isLoading)

  // Prepare data for export with error handling
  const starHistoryData = useMemo(() => {
    try {
      return selectedRepos.reduce(
        (acc, repo) => {
          if (repo.starHistory && Array.isArray(repo.starHistory)) {
            acc[repo.full_name] = repo.starHistory
          }
          return acc
        },
        {} as Record<string, StarHistoryData[]>,
      )
    } catch (error) {
      console.error("Error preparing star history data:", error)
      return {}
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

  // Sidebar content component for reuse
  const SidebarContent = () => (
    <div className="p-6 h-full overflow-y-auto">
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
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl border-b border-slate-700">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Star className="w-5 h-5 text-white fill-current" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                StarHistory
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link href="#" className="hover:text-emerald-400 transition-all duration-200 font-medium">
                Blog
              </Link>
              <GitHubTokenDialog onTokenSave={handleTokenSave} hasToken={!!githubToken} />
              <Link href="#" className="hover:text-emerald-400 transition-all duration-200 font-medium">
                API
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center space-x-2">
              <ExportDialog repositories={selectedRepos} starHistoryData={starHistoryData} chartRef={chartRef} />
              <RepositoryComparison repositories={selectedRepos} githubToken={githubToken} />
            </div>

            <Button className="hidden sm:flex bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105">
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Subscribe to Newsletter</span>
              <span className="md:hidden">Subscribe</span>
            </Button>

            {/* Social Links */}
            <div className="hidden sm:flex items-center space-x-2">
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
            </div>

            <Button
              variant="outline"
              className="hidden sm:flex border-slate-600 text-white hover:bg-slate-700 transition-all duration-200"
            >
              <Star className="w-4 h-4 mr-2 fill-current" />
              <span className="hidden md:inline">Star 7,389</span>
              <span className="md:hidden">7,389</span>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded flex items-center justify-center">
                      <Star className="w-4 h-4 text-white fill-current" />
                    </div>
                    <span className="font-bold">StarHistory</span>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <GitHubTokenDialog onTokenSave={handleTokenSave} hasToken={!!githubToken} />
                  <ExportDialog repositories={selectedRepos} starHistoryData={starHistoryData} chartRef={chartRef} />
                  <RepositoryComparison repositories={selectedRepos} githubToken={githubToken} />
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Rss className="w-4 h-4 mr-2" />
                      RSS
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-80 border-r border-slate-200 min-h-screen bg-white/50 backdrop-blur-sm">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6">
          {/* News Banner */}
          <Card className="mb-6 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-emerald-600 text-white">{"What's new"}</Badge>
                  <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                    Star History Monthly May 2025 | Agent Protocol
                  </span>
                  <span className="text-sm font-medium text-slate-700 sm:hidden">May 2025 Update</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limit Indicator */}
          <RateLimitIndicator githubToken={githubToken} />

          {/* Error Alert */}
          {error && (
            <Alert className="mb-4 border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={() => setError(undefined)}>
                  <X className="w-4 h-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Search Section */}
          <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder="Enter GitHub repository (e.g., facebook/react)"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-10 h-12 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                      onKeyPress={(e) => e.key === "Enter" && addRepositoryByInput()}
                    />
                  </div>
                  <Button
                    onClick={addRepositoryByInput}
                    disabled={isLoading || !searchInput.trim()}
                    className="h-12 px-4 sm:px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Plus className="w-5 h-5 mr-2" />
                    )}
                    <span className="hidden sm:inline">Add Repository</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>

                {/* Repository Search */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Or search popular repositories:
                  </label>
                  <RepositorySearch onSelectRepository={addRepositoryFromSearch} githubToken={githubToken} />
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex sm:hidden space-x-2">
                  <Button variant="outline" size="sm" disabled={selectedRepos.length === 0} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" disabled={selectedRepos.length < 2} className="flex-1">
                    <GitBranch className="w-4 h-4 mr-2" />
                    Compare
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedRepos.length === 0}
                    className="flex-1"
                    onClick={() => setShowInsights(!showInsights)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Insights
                  </Button>
                </div>
              </div>

              {selectedRepos.length > 0 && (
                <div className="space-y-3 mt-6">
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
                        key={repo.id}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center space-x-2 shadow-sm min-w-0"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: repo.color }}
                        ></div>
                        <span className="text-sm font-medium text-slate-700 truncate max-w-32 sm:max-w-none">
                          {repo.full_name}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-slate-500 flex-shrink-0">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{repo.stargazers_count.toLocaleString()}</span>
                        </div>
                        {repo.isLoading && (
                          <div className="w-3 h-3 border border-slate-300 border-t-slate-600 rounded-full animate-spin flex-shrink-0" />
                        )}
                        {repo.error && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => removeRepo(index)}
                          className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
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
          {selectedRepos.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-700">Total Stars</p>
                      <p className="text-lg sm:text-2xl font-bold text-blue-900">{totalStars.toLocaleString()}</p>
                    </div>
                    <Star className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 fill-current" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-emerald-700">Repositories</p>
                      <p className="text-lg sm:text-2xl font-bold text-emerald-900">{selectedRepos.length}</p>
                    </div>
                    <GitFork className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-700">Total Forks</p>
                      <p className="text-lg sm:text-2xl font-bold text-purple-900">
                        {selectedRepos.reduce((sum, repo) => sum + repo.forks_count, 0).toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-orange-700">Languages</p>
                      <p className="text-lg sm:text-2xl font-bold text-orange-900">
                        {new Set(selectedRepos.map((repo) => repo.language).filter(Boolean)).size}
                      </p>
                    </div>
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chart Area */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <span className="text-lg sm:text-xl font-bold text-slate-800">Star History</span>
                {selectedRepos.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInsights(!showInsights)}
                      className="hidden sm:flex"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {showInsights ? "Hide Insights" : "Show Insights"}
                    </Button>
                    <EmbedDialog repositories={selectedRepos} starHistoryData={starHistoryData} chartData={chartData} />
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {showInsights && selectedRepos.length > 0 && (
                <div className="mb-6">
                  <RepositoryInsights
                    repositories={selectedRepos}
                    starHistoryData={starHistoryData}
                    githubToken={githubToken}
                  />
                </div>
              )}

              <AdvancedChart
                repositories={selectedRepos}
                starHistoryData={starHistoryData}
                isLoading={isAnyLoading}
                selectedTimeRange={selectedTimeRange}
                onTimeRangeChange={setSelectedTimeRange}
                hoveredDataPoint={hoveredDataPoint}
                onHoveredDataPointChange={setHoveredDataPoint}
                zoomDomain={zoomDomain}
                onZoomDomainChange={setZoomDomain}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
