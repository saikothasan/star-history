"use client"

import { useState, useEffect } from "react"
import { Search, Star, GitFork, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitHubAPI, type GitHubRepo } from "@/lib/github-api"

interface RepositorySearchProps {
  onSelectRepository: (repo: GitHubRepo) => void
  githubToken?: string
}

export function RepositorySearch({ onSelectRepository, githubToken }: RepositorySearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<GitHubRepo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const githubAPI = new GitHubAPI(githubToken)

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true)
        try {
          const results = await githubAPI.searchRepositories(searchQuery, 8)
          setSearchResults(results)
          setShowResults(true)
        } catch (error) {
          console.error("Search error:", error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [searchQuery, githubToken])

  const handleSelectRepo = (repo: GitHubRepo) => {
    onSelectRepository(repo)
    setSearchQuery("")
    setShowResults(false)
    setSearchResults([])
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search GitHub repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl border-slate-200 max-h-96 overflow-y-auto">
          <CardContent className="p-2">
            {searchResults.map((repo) => (
              <div
                key={repo.id}
                className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleSelectRepo(repo)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <img
                        src={repo.owner.avatar_url || "/placeholder.svg"}
                        alt={repo.owner.login}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="font-medium text-slate-900 truncate">{repo.full_name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    </div>
                    {repo.description && <p className="text-sm text-slate-600 mb-2 line-clamp-2">{repo.description}</p>}
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{repo.stargazers_count.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <GitFork className="w-3 h-3" />
                        <span>{repo.forks_count.toLocaleString()}</span>
                      </div>
                      {repo.language && (
                        <Badge variant="secondary" className="text-xs">
                          {repo.language}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
