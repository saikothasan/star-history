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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, ExternalLink, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GitHubTokenDialogProps {
  onTokenSave: (token: string) => void
  hasToken: boolean
}

export function GitHubTokenDialog({ onTokenSave, hasToken }: GitHubTokenDialogProps) {
  const [token, setToken] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    if (token.trim()) {
      onTokenSave(token.trim())
      setToken("")
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={hasToken ? "outline" : "default"}
          className={hasToken ? "border-green-500 text-green-700" : ""}
        >
          <Key className="w-4 h-4 mr-2" />
          {hasToken ? "Token Added" : "Add GitHub Token"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2" />
            GitHub Personal Access Token
          </DialogTitle>
          <DialogDescription>
            Add your GitHub token to increase API rate limits and access private repositories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Your token is stored locally and never sent to our servers.</AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="token">Personal Access Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div className="text-sm text-gray-600">
            <p className="mb-2">To create a token:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
              <li>Click "Generate new token (classic)"</li>
              <li>Select "public_repo" scope for public repositories</li>
              <li>Copy and paste the token here</li>
            </ol>
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-2"
            >
              Create token on GitHub
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!token.trim()}>
              Save Token
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
