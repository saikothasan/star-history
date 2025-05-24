"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Download, FileText, ImageIcon, Database, Loader2 } from "lucide-react"
import type { GitHubRepo, StarHistoryData } from "@/lib/github-api"
import { ExportUtils } from "@/lib/export-utils"

interface ExportDialogProps {
  repositories: GitHubRepo[]
  starHistoryData: Record<string, StarHistoryData[]>
  chartRef: React.RefObject<HTMLDivElement>
}

export function ExportDialog({ repositories, starHistoryData, chartRef }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<string>("")

  const handleExport = async (type: "csv" | "json" | "png") => {
    if (repositories.length === 0) return

    setIsExporting(true)
    setExportType(type)

    try {
      const timestamp = new Date().toISOString().split("T")[0]

      switch (type) {
        case "csv":
          const csvContent = ExportUtils.exportToCSV(repositories, starHistoryData)
          ExportUtils.downloadFile(csvContent, `star-history-${timestamp}.csv`, "text/csv")
          break

        case "json":
          const reportData = ExportUtils.generateReportData(repositories, starHistoryData)
          const jsonContent = ExportUtils.exportToJSON(reportData)
          ExportUtils.downloadFile(jsonContent, `star-history-report-${timestamp}.json`, "application/json")
          break

        case "png":
          if (chartRef.current) {
            await ExportUtils.exportChartAsImage(chartRef.current, `star-history-chart-${timestamp}.png`)
          }
          break
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
      setExportType("")
    }
  }

  const exportOptions = [
    {
      type: "csv" as const,
      title: "CSV Data",
      description: "Export star history data as CSV for spreadsheet analysis",
      icon: Database,
      disabled: repositories.length === 0,
    },
    {
      type: "json" as const,
      title: "JSON Report",
      description: "Export complete report with metadata and repository information",
      icon: FileText,
      disabled: repositories.length === 0,
    },
    {
      type: "png" as const,
      title: "Chart Image",
      description: "Export the current chart as a high-resolution PNG image",
      icon: ImageIcon,
      disabled: repositories.length === 0,
    },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="hidden sm:flex">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export Star History
          </DialogTitle>
          <DialogDescription>Choose the format to export your star history data and charts.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {exportOptions.map((option) => {
            const ImageIconComponent = option.icon
            const isCurrentlyExporting = isExporting && exportType === option.type

            return (
              <Card
                key={option.type}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  option.disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <CardContent className="p-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-0"
                    onClick={() => handleExport(option.type)}
                    disabled={option.disabled || isExporting}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {isCurrentlyExporting ? (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                          <ImageIconComponent className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-slate-900">{option.title}</div>
                        <div className="text-sm text-slate-600 mt-1">{option.description}</div>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {repositories.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">Add repositories to enable export options</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
