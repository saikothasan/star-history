"use client"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Code, Copy, Share, ExternalLink, Settings, Palette, Layout, CheckCircle, Globe } from "lucide-react"
import type { GitHubRepo, StarHistoryData } from "@/lib/github-api"

interface EmbedDialogProps {
  repositories: Array<GitHubRepo & { color: string; starHistory?: StarHistoryData[] }>
  starHistoryData: Record<string, StarHistoryData[]>
  chartData: any[]
}

export function EmbedDialog({ repositories = [], starHistoryData = {}, chartData = [] }: EmbedDialogProps) {
  const [embedConfig, setEmbedConfig] = useState({
    width: 800,
    height: 400,
    theme: "light",
    showLegend: true,
    showGrid: true,
    timeRange: "all",
    animated: true,
  })
  const [copied, setCopied] = useState<string>("")

  // Generate embed URL with error handling
  const generateEmbedUrl = () => {
    try {
      if (!repositories || repositories.length === 0) return ""

      const params = new URLSearchParams({
        repos: repositories.map((r) => r.full_name).join(","),
        width: embedConfig.width.toString(),
        height: embedConfig.height.toString(),
        theme: embedConfig.theme,
        legend: embedConfig.showLegend.toString(),
        grid: embedConfig.showGrid.toString(),
        range: embedConfig.timeRange,
        animated: embedConfig.animated.toString(),
      })

      return `${typeof window !== "undefined" ? window.location.origin : ""}/embed?${params.toString()}`
    } catch (error) {
      console.error("Error generating embed URL:", error)
      return ""
    }
  }

  // Generate iframe code with error handling
  const generateIframeCode = () => {
    try {
      const url = generateEmbedUrl()
      if (!url) return ""

      return `<iframe 
  src="${url}"
  width="${embedConfig.width}" 
  height="${embedConfig.height}"
  frameBorder="0"
  loading="lazy"
  title="Star History Chart">
</iframe>`
    } catch (error) {
      console.error("Error generating iframe code:", error)
      return ""
    }
  }

  // Generate API endpoint with error handling
  const generateApiUrl = () => {
    try {
      if (!repositories || repositories.length === 0) return ""

      const repos = repositories.map((r) => r.full_name).join(",")
      return `${typeof window !== "undefined" ? window.location.origin : ""}/api/star-history?repos=${encodeURIComponent(repos)}&format=json`
    } catch (error) {
      console.error("Error generating API URL:", error)
      return ""
    }
  }

  // Generate shareable link with error handling
  const generateShareUrl = () => {
    try {
      if (!repositories || repositories.length === 0) return ""

      const params = new URLSearchParams({
        repos: repositories.map((r) => r.full_name).join(","),
      })
      return `${typeof window !== "undefined" ? window.location.origin : ""}?${params.toString()}`
    } catch (error) {
      console.error("Error generating share URL:", error)
      return ""
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(""), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const previewUrl = repositories.length > 0 ? generateEmbedUrl() : ""

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={repositories.length === 0}>
          <Code className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Embed & Share</span>
          <span className="sm:hidden">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share className="w-5 h-5 mr-2" />
            Embed & Share Charts
          </DialogTitle>
          <DialogDescription>
            Embed your star history charts on websites, blogs, or share with others.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="embed" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="embed" className="flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>Embed</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>API</span>
            </TabsTrigger>
            <TabsTrigger value="share" className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <span>Share</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="embed" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Embed Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="iframe-code">HTML iframe</Label>
                  <div className="relative mt-2">
                    <Textarea
                      id="iframe-code"
                      value={generateIframeCode()}
                      readOnly
                      className="font-mono text-sm min-h-[120px] pr-12"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateIframeCode(), "iframe")}
                    >
                      {copied === "iframe" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="embed-url">Direct URL</Label>
                  <div className="relative mt-2">
                    <Input id="embed-url" value={previewUrl} readOnly className="font-mono text-sm pr-12" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-1/2 right-2 transform -translate-y-1/2"
                      onClick={() => copyToClipboard(previewUrl, "url")}
                    >
                      {copied === "url" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div>
                    <Label>Live Preview</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <iframe
                        src={previewUrl}
                        width={Math.min(embedConfig.width, 600)}
                        height={Math.min(embedConfig.height, 300)}
                        className="border-0"
                        title="Chart Preview"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  API Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="api-url">JSON Data Endpoint</Label>
                  <div className="relative mt-2">
                    <Input id="api-url" value={generateApiUrl()} readOnly className="font-mono text-sm pr-12" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-1/2 right-2 transform -translate-y-1/2"
                      onClick={() => copyToClipboard(generateApiUrl(), "api")}
                    >
                      {copied === "api" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-800 mb-3">Response Format</h4>
                  <pre className="text-sm text-slate-600 overflow-x-auto">
                    {`{
  "repositories": [
    {
      "name": "facebook/react",
      "stars": 185000,
      "history": [
        {
          "date": "2023-01-01",
          "stars": 180000
        }
      ]
    }
  ],
  "metadata": {
    "generated_at": "2024-01-15T10:00:00Z",
    "total_repositories": 1
  }
}`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-slate-800">Available Formats</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">JSON</Badge>
                    <Badge variant="secondary">CSV</Badge>
                    <Badge variant="secondary">XML</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-slate-800">Parameters</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>
                      <code className="bg-slate-100 px-1 rounded">repos</code> - Comma-separated repository names
                    </li>
                    <li>
                      <code className="bg-slate-100 px-1 rounded">format</code> - Response format (json, csv, xml)
                    </li>
                    <li>
                      <code className="bg-slate-100 px-1 rounded">period</code> - Time range (1m, 3m, 6m, 1y, all)
                    </li>
                    <li>
                      <code className="bg-slate-100 px-1 rounded">interval</code> - Data interval (daily, weekly,
                      monthly)
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Chart</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="share-url">Shareable Link</Label>
                  <div className="relative mt-2">
                    <Input id="share-url" value={generateShareUrl()} readOnly className="font-mono text-sm pr-12" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-1/2 right-2 transform -translate-y-1/2"
                      onClick={() => copyToClipboard(generateShareUrl(), "share")}
                    >
                      {copied === "share" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2"
                    onClick={() => {
                      const url = generateShareUrl()
                      const text = `Check out this star history chart: ${repositories.map((r) => r.full_name).join(", ")}`
                      window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                        "_blank",
                      )
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>Share on X</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2"
                    onClick={() => {
                      const url = generateShareUrl()
                      const title = `Star History: ${repositories.map((r) => r.full_name).join(", ")}`
                      window.open(
                        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                        "_blank",
                      )
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    <span>LinkedIn</span>
                  </Button>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Pro Tip</h4>
                  <p className="text-sm text-blue-700">
                    The shared link will automatically load the same repositories and maintain the current view
                    settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dimensions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-800 flex items-center">
                    <Layout className="w-4 h-4 mr-2" />
                    Dimensions
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="width">Width (px)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={embedConfig.width}
                        onChange={(e) =>
                          setEmbedConfig((prev) => ({ ...prev, width: Number.parseInt(e.target.value) || 800 }))
                        }
                        min="400"
                        max="1200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (px)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={embedConfig.height}
                        onChange={(e) =>
                          setEmbedConfig((prev) => ({ ...prev, height: Number.parseInt(e.target.value) || 400 }))
                        }
                        min="200"
                        max="800"
                      />
                    </div>
                  </div>
                </div>

                {/* Appearance */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-800 flex items-center">
                    <Palette className="w-4 h-4 mr-2" />
                    Appearance
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Theme</Label>
                      <div className="flex space-x-2 mt-2">
                        <Button
                          variant={embedConfig.theme === "light" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEmbedConfig((prev) => ({ ...prev, theme: "light" }))}
                        >
                          Light
                        </Button>
                        <Button
                          variant={embedConfig.theme === "dark" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEmbedConfig((prev) => ({ ...prev, theme: "dark" }))}
                        >
                          Dark
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Time Range</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {["all", "1y", "6m", "3m", "1m"].map((range) => (
                          <Button
                            key={range}
                            variant={embedConfig.timeRange === range ? "default" : "outline"}
                            size="sm"
                            onClick={() => setEmbedConfig((prev) => ({ ...prev, timeRange: range }))}
                          >
                            {range === "all" ? "All" : range}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-800">Features</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={embedConfig.showLegend}
                        onChange={(e) => setEmbedConfig((prev) => ({ ...prev, showLegend: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Show legend</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={embedConfig.showGrid}
                        onChange={(e) => setEmbedConfig((prev) => ({ ...prev, showGrid: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Show grid lines</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={embedConfig.animated}
                        onChange={(e) => setEmbedConfig((prev) => ({ ...prev, animated: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Enable animations</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
