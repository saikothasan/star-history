import type { GitHubRepo, StarHistoryData } from "./github-api"

export interface ExportData {
  repositories: GitHubRepo[]
  starHistory: Record<string, StarHistoryData[]>
  exportDate: string
  metadata: {
    totalStars: number
    totalRepositories: number
    dateRange: {
      start: string
      end: string
    }
  }
}

export class ExportUtils {
  static exportToCSV(repositories: GitHubRepo[], starHistoryData: Record<string, StarHistoryData[]>): string {
    const headers = ["Date", ...repositories.map((repo) => repo.full_name)]
    const rows = [headers.join(",")]

    // Get all unique dates
    const allDates = new Set<string>()
    Object.values(starHistoryData).forEach((history) => {
      history.forEach((point) => allDates.add(point.date))
    })

    const sortedDates = Array.from(allDates).sort()

    sortedDates.forEach((date) => {
      const row = [date]
      repositories.forEach((repo) => {
        const history = starHistoryData[repo.full_name] || []
        const point = history.find((p) => p.date === date)
        row.push(point ? point.stars.toString() : "")
      })
      rows.push(row.join(","))
    })

    return rows.join("\n")
  }

  static exportToJSON(data: ExportData): string {
    return JSON.stringify(data, null, 2)
  }

  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  static async exportChartAsImage(chartElement: HTMLElement, filename: string): Promise<void> {
    try {
      // Use html2canvas if available, otherwise provide fallback
      const html2canvas = (await import("html2canvas")).default
      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      })

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, "image/png")
    } catch (error) {
      console.error("Error exporting chart:", error)
      throw new Error("Failed to export chart. Please try again.")
    }
  }

  static generateReportData(
    repositories: GitHubRepo[],
    starHistoryData: Record<string, StarHistoryData[]>,
  ): ExportData {
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)

    // Find date range
    let earliestDate = new Date()
    let latestDate = new Date(0)

    Object.values(starHistoryData).forEach((history) => {
      history.forEach((point) => {
        const date = new Date(point.date)
        if (date < earliestDate) earliestDate = date
        if (date > latestDate) latestDate = date
      })
    })

    return {
      repositories,
      starHistory: starHistoryData,
      exportDate: new Date().toISOString(),
      metadata: {
        totalStars,
        totalRepositories: repositories.length,
        dateRange: {
          start: earliestDate.toISOString().split("T")[0],
          end: latestDate.toISOString().split("T")[0],
        },
      },
    }
  }
}
