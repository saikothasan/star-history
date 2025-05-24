interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  stargazers_count: number
  forks_count: number
  language: string
  created_at: string
  updated_at: string
  html_url: string
  owner: {
    login: string
    avatar_url: string
  }
}

interface StarHistoryData {
  date: string
  stars: number
  displayDate: string
  timestamp: number
}

interface GitHubCommit {
  commit: {
    author: {
      date: string
    }
  }
  sha: string
}

interface Stargazer {
  starred_at: string
  user: {
    login: string
    id: number
  }
}

interface RepoComparison {
  repo1: GitHubRepo
  repo2: GitHubRepo
  metrics: {
    starGrowthRate1: number
    starGrowthRate2: number
    ageInDays1: number
    ageInDays2: number
    starsPerDay1: number
    starsPerDay2: number
    winner: "repo1" | "repo2" | "tie"
  }
}

class GitHubAPI {
  private baseUrl = "https://api.github.com"
  private token?: string

  constructor(token?: string) {
    this.token = token
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "StarHistory-Clone",
    }

    if (this.token) {
      headers["Authorization"] = `token ${this.token}`
    }

    return headers
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepo> {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found`)
      }
      if (response.status === 403) {
        throw new Error("API rate limit exceeded. Please add a GitHub token.")
      }
      throw new Error(`Failed to fetch repository: ${response.statusText}`)
    }

    return response.json()
  }

  async getEnhancedStarHistory(owner: string, repo: string): Promise<StarHistoryData[]> {
    try {
      // First, get the repository info
      const repoInfo = await this.getRepository(owner, repo)
      const currentStars = repoInfo.stargazers_count

      // Try to get actual stargazers data (limited by API)
      let stargazersData: Stargazer[] = []

      if (this.token && currentStars < 10000) {
        // Only fetch stargazers for smaller repos to avoid rate limiting
        stargazersData = await this.getStargazers(owner, repo)
      }

      if (stargazersData.length > 0) {
        return this.processStargazersData(stargazersData, repoInfo.created_at)
      } else {
        // Fallback to enhanced interpolation method
        const commits = await this.getCommitHistory(owner, repo)
        const releases = await this.getReleases(owner, repo)
        return this.enhancedInterpolateStarHistory(commits, releases, currentStars, repoInfo.created_at)
      }
    } catch (error) {
      console.error("Error fetching enhanced star history:", error)
      throw error
    }
  }

  private async getStargazers(owner: string, repo: string): Promise<Stargazer[]> {
    const stargazers: Stargazer[] = []
    let page = 1
    const perPage = 100
    const maxPages = 5 // Limit to avoid rate limiting

    while (page <= maxPages) {
      try {
        const response = await fetch(
          `${this.baseUrl}/repos/${owner}/${repo}/stargazers?page=${page}&per_page=${perPage}`,
          {
            headers: {
              ...this.getHeaders(),
              Accept: "application/vnd.github.v3.star+json",
            },
          },
        )

        if (!response.ok) {
          break
        }

        const pageStargazers = await response.json()
        if (pageStargazers.length === 0) {
          break
        }

        stargazers.push(...pageStargazers)
        page++
      } catch (error) {
        console.error("Error fetching stargazers:", error)
        break
      }
    }

    return stargazers
  }

  private processStargazersData(stargazers: Stargazer[], createdAt: string): StarHistoryData[] {
    const startDate = new Date(createdAt)
    const data: StarHistoryData[] = []

    // Group stargazers by week
    const starsByWeek = new Map<string, number>()

    stargazers.forEach((stargazer) => {
      const starDate = new Date(stargazer.starred_at)
      const weekKey = this.getWeekKey(starDate)
      starsByWeek.set(weekKey, (starsByWeek.get(weekKey) || 0) + 1)
    })

    // Create cumulative data
    let cumulativeStars = 0
    const sortedWeeks = Array.from(starsByWeek.keys()).sort()

    // Fill in missing weeks
    const current = new Date(startDate)
    const endDate = new Date()

    while (current <= endDate) {
      const weekKey = this.getWeekKey(current)
      const starsThisWeek = starsByWeek.get(weekKey) || 0
      cumulativeStars += starsThisWeek

      data.push({
        date: current.toISOString().split("T")[0],
        stars: cumulativeStars,
        displayDate: current.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        timestamp: current.getTime(),
      })

      current.setDate(current.getDate() + 7)
    }

    return data
  }

  private async getReleases(owner: string, repo: string) {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/releases?per_page=50`, {
        headers: this.getHeaders(),
      })

      if (response.ok) {
        return response.json()
      }
    } catch (error) {
      console.error("Error fetching releases:", error)
    }
    return []
  }

  private enhancedInterpolateStarHistory(
    commits: GitHubCommit[],
    releases: any[],
    currentStars: number,
    createdAt: string,
  ): StarHistoryData[] {
    const startDate = new Date(createdAt)
    const endDate = new Date()
    const data: StarHistoryData[] = []

    // Create time points (weekly intervals)
    const timePoints: Date[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      timePoints.push(new Date(current))
      current.setDate(current.getDate() + 7)
    }

    // Group commits and releases by time periods
    const commitsByPeriod = new Map<string, number>()
    const releasesByPeriod = new Map<string, boolean>()

    commits.forEach((commit) => {
      const commitDate = new Date(commit.commit.author.date)
      const weekKey = this.getWeekKey(commitDate)
      commitsByPeriod.set(weekKey, (commitsByPeriod.get(weekKey) || 0) + 1)
    })

    releases.forEach((release) => {
      const releaseDate = new Date(release.published_at || release.created_at)
      const weekKey = this.getWeekKey(releaseDate)
      releasesByPeriod.set(weekKey, true)
    })

    // Enhanced growth calculation
    let accumulatedStars = Math.max(1, Math.floor(currentStars * 0.05))

    timePoints.forEach((date, index) => {
      const weekKey = this.getWeekKey(date)
      const commitActivity = commitsByPeriod.get(weekKey) || 0
      const hasRelease = releasesByPeriod.get(weekKey) || false

      // More sophisticated growth model
      const timeProgress = index / timePoints.length
      const ageInWeeks = index + 1

      // Base exponential growth that slows over time
      const baseGrowth = currentStars * Math.pow(timeProgress, 1.5)

      // Activity multiplier (commits boost growth)
      const activityMultiplier = 1 + commitActivity * 0.1

      // Release boost (releases create spikes)
      const releaseBoost = hasRelease ? currentStars * 0.05 : 0

      // Early adoption boost (faster growth in early weeks)
      const earlyBoost = ageInWeeks < 10 ? Math.pow(2, 10 - ageInWeeks) * 0.01 : 0

      const calculatedStars = Math.floor(baseGrowth * activityMultiplier + releaseBoost + currentStars * earlyBoost)

      accumulatedStars = Math.min(currentStars, Math.max(accumulatedStars, calculatedStars))

      data.push({
        date: date.toISOString().split("T")[0],
        stars: Math.floor(accumulatedStars),
        displayDate: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        timestamp: date.getTime(),
      })
    })

    // Ensure smooth progression and final accuracy
    if (data.length > 0) {
      data[data.length - 1].stars = currentStars

      // Smooth out any irregularities
      for (let i = data.length - 2; i >= 0; i--) {
        if (data[i].stars > data[i + 1].stars) {
          data[i].stars = Math.floor(data[i + 1].stars * 0.95)
        }
      }
    }

    return data
  }

  private async getCommitHistory(owner: string, repo: string): Promise<GitHubCommit[]> {
    const commits: GitHubCommit[] = []
    let page = 1
    const perPage = 100
    const maxPages = 5

    while (page <= maxPages) {
      try {
        const response = await fetch(
          `${this.baseUrl}/repos/${owner}/${repo}/commits?page=${page}&per_page=${perPage}&since=2020-01-01T00:00:00Z`,
          {
            headers: this.getHeaders(),
          },
        )

        if (!response.ok) {
          break
        }

        const pageCommits = await response.json()
        if (pageCommits.length === 0) {
          break
        }

        commits.push(...pageCommits)
        page++
      } catch (error) {
        console.error("Error fetching commits:", error)
        break
      }
    }

    return commits
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear()
    const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
    return `${year}-W${week}`
  }

  async searchRepositories(query: string, limit = 5): Promise<GitHubRepo[]> {
    const response = await fetch(
      `${this.baseUrl}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`,
      {
        headers: this.getHeaders(),
      },
    )

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || []
  }

  async compareRepositories(repo1: GitHubRepo, repo2: GitHubRepo): Promise<RepoComparison> {
    const repo1Age = Math.floor((Date.now() - new Date(repo1.created_at).getTime()) / (1000 * 60 * 60 * 24))
    const repo2Age = Math.floor((Date.now() - new Date(repo2.created_at).getTime()) / (1000 * 60 * 60 * 24))

    const starsPerDay1 = repo1.stargazers_count / Math.max(repo1Age, 1)
    const starsPerDay2 = repo2.stargazers_count / Math.max(repo2Age, 1)

    // Calculate growth rates (simplified)
    const starGrowthRate1 = (repo1.stargazers_count / Math.max(repo1Age / 365, 0.1)) * 100
    const starGrowthRate2 = (repo2.stargazers_count / Math.max(repo2Age / 365, 0.1)) * 100

    let winner: "repo1" | "repo2" | "tie" = "tie"
    if (starsPerDay1 > starsPerDay2 * 1.1) winner = "repo1"
    else if (starsPerDay2 > starsPerDay1 * 1.1) winner = "repo2"

    return {
      repo1,
      repo2,
      metrics: {
        starGrowthRate1,
        starGrowthRate2,
        ageInDays1: repo1Age,
        ageInDays2: repo2Age,
        starsPerDay1,
        starsPerDay2,
        winner,
      },
    }
  }

  async getRateLimitStatus() {
    const response = await fetch(`${this.baseUrl}/rate_limit`, {
      headers: this.getHeaders(),
    })

    if (response.ok) {
      return response.json()
    }
    return null
  }
}

export { GitHubAPI, type GitHubRepo, type StarHistoryData, type RepoComparison }
