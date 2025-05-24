"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { GitBranch, Star, GitFork, Calendar, TrendingUp, Trophy, Zap } from "lucide-react"
import { GitHubAPI, type GitHubRepo, type RepoComparison } from "@/lib/github-api"

interface RepositoryComparisonProps {
  repositories: GitHubRepo[]
  githubToken?: string
}

export function RepositoryComparison({ repositories, githubToken }: RepositoryComparisonProps) {
  const [comparison, setComparison] = useState<RepoComparison | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRepos, setSelectedRepos] = useState<[GitHubRepo?, GitHubRepo?]>([undefined, undefined])

  const handleCompare = async () => {
    if (!selectedRepos[0] || !selectedRepos[1]) return

    setIsLoading(true)
    try {
      const githubAPI = new GitHubAPI(githubToken)
      const comparisonResult = await githubAPI.compareRepositories(selectedRepos[0], selectedRepos[1])
      setComparison(comparisonResult)
    } catch (error) {
      console.error("Comparison failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectRepo = (repo: GitHubRepo, index: 0 | 1) => {
    const newSelection: [GitHubRepo?, GitHubRepo?] = [...selectedRepos]
    newSelection[index] = repo
    setSelectedRepos(newSelection)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDays = (days: number) => {
    if (days >= 365) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`
    if (days >= 30) return `${Math.floor(days / 30)}m ${days % 30}d`
    return `${days}d`
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={repositories.length < 2} className="hidden sm:flex">
          <GitBranch className="w-4 h-4 mr-2" />
          Compare Repos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <GitBranch className="w-5 h-5 mr-2" />
            Repository Comparison
          </DialogTitle>
          <DialogDescription>Compare growth metrics and performance between repositories.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Repository Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((index) => (
              <Card key={index} className="border-2 border-dashed border-slate-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Repository {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {repositories.map((repo) => (
                    <Button
                      key={repo.id}
                      variant={selectedRepos[index]?.id === repo.id ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-left h-auto p-2"
                      onClick={() => selectRepo(repo, index as 0 | 1)}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <img
                          src={repo.owner.avatar_url || "/placeholder.svg"}
                          alt={repo.owner.login}
                          className="w-4 h-4 rounded-full flex-shrink-0"
                        />
                        <span className="truncate text-sm">{repo.full_name}</span>
                        <div className="flex items-center space-x-1 text-xs text-slate-500 flex-shrink-0">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{formatNumber(repo.stargazers_count)}</span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Compare Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleCompare}
              disabled={!selectedRepos[0] || !selectedRepos[1] || isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Analyzing..." : "Compare Repositories"}
            </Button>
          </div>

          {/* Comparison Results */}
          {comparison && (
            <div className="space-y-6">
              {/* Winner Banner */}
              <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">
                      {comparison.metrics.winner === "repo1" && `${comparison.repo1.full_name} is growing faster!`}
                      {comparison.metrics.winner === "repo2" && `${comparison.repo2.full_name} is growing faster!`}
                      {comparison.metrics.winner === "tie" && "Both repositories have similar growth rates!"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[comparison.repo1, comparison.repo2].map((repo, index) => {
                  const isWinner = comparison.metrics.winner === (index === 0 ? "repo1" : "repo2")
                  const metrics =
                    index === 0
                      ? {
                          starsPerDay: comparison.metrics.starsPerDay1,
                          growthRate: comparison.metrics.starGrowthRate1,
                          age: comparison.metrics.ageInDays1,
                        }
                      : {
                          starsPerDay: comparison.metrics.starsPerDay2,
                          growthRate: comparison.metrics.starGrowthRate2,
                          age: comparison.metrics.ageInDays2,
                        }

                  return (
                    <Card key={repo.id} className={`relative ${isWinner ? "ring-2 ring-green-500" : ""}`}>
                      {isWinner && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-green-500 text-white">
                            <Trophy className="w-3 h-3 mr-1" />
                            Winner
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={repo.owner.avatar_url || "/placeholder.svg"}
                            alt={repo.owner.login}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="min-w-0">
                            <CardTitle className="text-lg truncate">{repo.full_name}</CardTitle>
                            {repo.description && (
                              <p className="text-sm text-slate-600 line-clamp-2 mt-1">{repo.description}</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Basic Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 text-yellow-600 mb-1">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">Stars</span>
                            </div>
                            <div className="text-2xl font-bold">{formatNumber(repo.stargazers_count)}</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                              <GitFork className="w-4 h-4" />
                              <span className="text-sm font-medium">Forks</span>
                            </div>
                            <div className="text-2xl font-bold">{formatNumber(repo.forks_count)}</div>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="space-y-3 pt-3 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Zap className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium">Stars per day</span>
                            </div>
                            <span className="font-bold text-orange-600">{metrics.starsPerDay.toFixed(1)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium">Growth rate</span>
                            </div>
                            <span className="font-bold text-green-600">{metrics.growthRate.toFixed(0)}%/year</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium">Repository age</span>
                            </div>
                            <span className="font-bold text-purple-600">{formatDays(metrics.age)}</span>
                          </div>

                          {repo.language && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Language</span>
                              <Badge variant="secondary">{repo.language}</Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
