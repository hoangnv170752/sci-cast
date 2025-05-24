"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Search,
  Home,
  Library,
  Heart,
  MoreHorizontal,
  Mic,
  Headphones,
  TrendingUp,
  Users,
  BookOpen,
  Zap,
  Sparkles,
  LogOut,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/hooks/use-auth"

export default function SciCastApp() {
  const { user, loading, signOut } = useAuth()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(85)
  const [duration, setDuration] = useState(152)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const availableAudioFiles = [
    {
      id: 1,
      title: "TDSM: Triplet Diffusion for Skeleton-Text Matching in Zero-Shot Action Recognition",
      host: "Dr. Alex Chen",
      listens: "3,247,891",
      duration: "Loading...",
      category: "AI & Machine Learning",
      audioUrl: "/audio/tdsm-podcast.mp3",
      description:
        "Deep dive into cutting-edge research on skeleton-based action recognition using triplet diffusion models.",
      featured: true,
    },
  ]

  const upcomingPodcasts = [
    {
      id: 2,
      title: "The Future of AI in Healthcare",
      host: "Dr. Sarah Chen",
      listens: "2,847,392",
      duration: "28:45",
      category: "AI & Machine Learning",
      audioUrl: null,
      description: "Exploring how artificial intelligence is revolutionizing medical diagnosis and treatment.",
      featured: false,
    },
    {
      id: 3,
      title: "Quantum Computing Breakthrough",
      host: "Prof. Michael Torres",
      listens: "1,923,847",
      duration: "35:12",
      category: "Quantum Technology",
      audioUrl: null,
      description: "Latest developments in quantum computing and their practical applications.",
      featured: false,
    },
    {
      id: 4,
      title: "Web3 and the Metaverse Revolution",
      host: "Alex Kim",
      listens: "1,654,293",
      duration: "42:18",
      category: "Blockchain & Web3",
      audioUrl: null,
      description: "Understanding the intersection of blockchain technology and virtual worlds.",
      featured: false,
    },
    {
      id: 5,
      title: "Cybersecurity in 2024",
      host: "James Wilson",
      listens: "1,156,834",
      duration: "26:33",
      category: "Cybersecurity",
      audioUrl: null,
      description: "Current threats and defense strategies in the evolving cybersecurity landscape.",
      featured: false,
    },
  ]

  // Combine available audio files first, then upcoming podcasts
  const allPodcasts = [...availableAudioFiles, ...upcomingPodcasts]

  const [currentPodcast, setCurrentPodcast] = useState(availableAudioFiles[0])
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && currentPodcast.audioUrl) {
      const audioElement = new Audio()

      // Add error handling
      audioElement.addEventListener("error", (e) => {
        console.warn("Audio loading failed:", e)
        setIsPlaying(false)
      })

      audioElement.addEventListener("loadedmetadata", () => {
        const actualDuration = Math.floor(audioElement.duration)
        setDuration(actualDuration)

        // Update the podcast duration in the availableAudioFiles array
        const updatedPodcast = {
          ...currentPodcast,
          duration: formatTime(actualDuration),
        }
        setCurrentPodcast(updatedPodcast)
      })

      audioElement.addEventListener("timeupdate", () => {
        setCurrentTime(Math.floor(audioElement.currentTime))
      })

      audioElement.addEventListener("ended", () => {
        setIsPlaying(false)
      })

      // Set the source after adding event listeners
      audioElement.src = currentPodcast.audioUrl
      audioElement.load()

      setAudio(audioElement)

      return () => {
        audioElement.pause()
        audioElement.removeEventListener("error", () => {})
        audioElement.removeEventListener("loadedmetadata", () => {})
        audioElement.removeEventListener("timeupdate", () => {})
        audioElement.removeEventListener("ended", () => {})
      }
    }
  }, [currentPodcast])

  // Add this useEffect after the voices loading effect
  useEffect(() => {
    // Cleanup audio URL when component unmounts
    return () => {
      if (audio) {
        audio.pause()
      }
    }
  }, [audio])

  const togglePlayPause = async () => {
    if (audio && currentPodcast.audioUrl) {
      try {
        if (isPlaying) {
          audio.pause()
          setIsPlaying(false)
        } else {
          await audio.play()
          setIsPlaying(true)
        }
      } catch (error) {
        console.warn("Audio playback failed:", error)
        setIsPlaying(false)
      }
    }
  }

  const handlePodcastClick = (podcast: (typeof allPodcasts)[0]) => {
    if (podcast.audioUrl) {
      setCurrentPodcast(podcast)
      setIsPlaying(false)
    }
  }

  const categories = [
    { name: "AI & ML", icon: Zap, count: 234 },
    { name: "Web Development", icon: BookOpen, count: 189 },
    { name: "Data Science", icon: TrendingUp, count: 156 },
    { name: "Cybersecurity", icon: Users, count: 98 },
  ]

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">Sci-Cast</span>
        </div>

        <nav className="space-y-4 mb-8">
          <Button variant="ghost" className="w-full justify-start gap-3 text-orange-500">
            <Home className="w-5 h-5" />
            Home
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Search className="w-5 h-5" />
            Search
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Library className="w-5 h-5" />
            Your Library
          </Button>
        </nav>

        <div className="space-y-4 mb-8">
          <Link href="/create">
            <Button className="w-full justify-start gap-3 bg-orange-500 hover:bg-orange-600 text-white">
              <Sparkles className="w-5 h-5" />
              Create Podcast
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Heart className="w-5 h-5" />
            Liked Episodes
          </Button>
        </div>

        <div className="space-y-2 flex-1">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Categories</h3>
          {categories.map((category) => (
            <Button key={category.name} variant="ghost" className="w-full justify-start gap-3 text-sm">
              <category.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{category.name}</span>
              <span className="text-xs text-muted-foreground">{category.count}</span>
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          <ThemeToggle />
          {user ? (
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-orange-500 text-white">
                    {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </div>
          ) : (
            <div className="border-t border-border pt-4 space-y-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="What do you want to learn about?" className="pl-10 bg-muted/50" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <Avatar>
                <AvatarFallback className="bg-orange-500 text-white">
                  {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Welcome Message */}
            {user && (
              <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                <h2 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                  Welcome back, {user.user_metadata?.full_name || "User"}! 👋
                </h2>
                <p className="text-orange-700 dark:text-orange-300">
                  Ready to create some amazing podcasts from your research?
                </p>
              </div>
            )}

            {/* Hero Section */}
            <div className="relative h-80 rounded-lg overflow-hidden mb-8 bg-gradient-to-r from-orange-600 to-orange-400">
              <Image src="/images/hero-podcast.png" alt="Featured Podcast" fill className="object-cover opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <Badge className="mb-2 bg-orange-500">
                  <Headphones className="w-3 h-3 mr-1" />
                  Featured Research Podcast
                </Badge>
                <h1 className="text-4xl font-bold mb-2">TDSM: Triplet Diffusion</h1>
                <p className="text-lg opacity-90 mb-4">Skeleton-Text Matching in Zero-Shot Action Recognition</p>
                <div className="flex items-center gap-4">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={togglePlayPause}>
                    {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-black"
                  >
                    Follow
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Popular Episodes */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Episodes</h2>
                  <Badge variant="secondary" className="text-xs">
                    {availableAudioFiles.length} Available • {upcomingPodcasts.length} Coming Soon
                  </Badge>
                </div>

                {/* Available Episodes */}
                {availableAudioFiles.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-orange-500">🎧 Available Now</h3>
                    <div className="space-y-4">
                      {availableAudioFiles.map((podcast, index) => (
                        <Card
                          key={podcast.id}
                          className="hover:bg-muted/50 transition-colors cursor-pointer border-orange-200 dark:border-orange-800"
                          onClick={() => handlePodcastClick(podcast)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <span className="text-orange-500 font-bold w-6">{index + 1}</span>
                              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                <Mic className="w-6 h-6 text-orange-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium mb-1">{podcast.title}</h3>
                                <p className="text-sm text-muted-foreground">{podcast.host}</p>
                                <p className="text-xs text-muted-foreground mt-1">{podcast.description}</p>
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  {podcast.category}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">{podcast.listens} listens</p>
                                <p className="text-sm font-medium">{podcast.duration}</p>
                                <Badge className="mt-1 bg-orange-500 text-white text-xs">
                                  <Play className="w-3 h-3 mr-1" />
                                  Play Now
                                </Badge>
                              </div>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Episodes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-muted-foreground">📅 Coming Soon</h3>
                  <div className="space-y-4">
                    {upcomingPodcasts.map((podcast, index) => (
                      <Card key={podcast.id} className="opacity-75 cursor-not-allowed">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground font-medium w-6">
                              {availableAudioFiles.length + index + 1}
                            </span>
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <Mic className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium mb-1 text-muted-foreground">{podcast.title}</h3>
                              <p className="text-sm text-muted-foreground">{podcast.host}</p>
                              <p className="text-xs text-muted-foreground mt-1">{podcast.description}</p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {podcast.category}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{podcast.listens} listens</p>
                              <p className="text-sm text-muted-foreground">{podcast.duration}</p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                Coming Soon
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" disabled>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">🚀 Create Your Own Podcast</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Transform your research papers into engaging podcasts using AI-powered script generation and voice
                      synthesis.
                    </p>
                    <Link href="/create">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Try AI Generator
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Host Spotlight</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src="/placeholder.svg?height=48&width=48" />
                        <AvatarFallback>SC</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">Dr. Sarah Chen</h4>
                        <p className="text-sm text-muted-foreground">AI Researcher</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Leading expert in machine learning and healthcare AI applications.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Follow Host
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Trending Topics</h3>
                    <div className="space-y-3">
                      {["Artificial Intelligence", "Quantum Computing", "Blockchain", "IoT", "Cybersecurity"].map(
                        (topic) => (
                          <div key={topic} className="flex items-center justify-between">
                            <span className="text-sm">{topic}</span>
                            <TrendingUp className="w-4 h-4 text-orange-500" />
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {/* Player Bar */}
        <div className="border-t border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Mic className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium">{currentPodcast.title}</h4>
                <p className="text-sm text-muted-foreground">{currentPodcast.host}</p>
              </div>
              <Button variant="ghost" size="sm">
                <Heart className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-8 h-8 p-0"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm">
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 w-full max-w-md">
                <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
                <div className="flex-1 h-1 bg-muted rounded-full">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end">
              <Button variant="ghost" size="sm">
                <Volume2 className="w-4 h-4" />
              </Button>
              <div className="w-20 h-1 bg-muted rounded-full">
                <div className="w-3/4 h-full bg-orange-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
