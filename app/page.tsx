"use client"

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
  Moon,
  Sun,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "next-themes"
import { useToast } from "@/components/toast-provider"
import { getAllPodcasts, Podcast } from "@/lib/podcasts"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function SciCastApp() {
  const { user, loading, signOut } = useAuth()
  const { toast } = useToast()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [availableAudioFiles, setAvailableAudioFiles] = useState<Podcast[]>([])
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null)

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Load podcasts on mount
  useEffect(() => {
    // Get all podcasts from the library
    const podcasts = getAllPodcasts()
    setAvailableAudioFiles(podcasts)
    
    // If we haven't set a current podcast yet, set it to the first one
    if (podcasts.length > 0 && !currentPodcast) {
      setCurrentPodcast(podcasts[0])
    }
  }, [])

  // Handle audio element setup and events
  useEffect(() => {
    if (audioRef.current) {
      // Set up the audio source when currentPodcast changes
      if (currentPodcast?.audioUrl) {
        // Stop playback first to avoid race conditions
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        
        // Make sure we're using the full URL path
        const audioUrl = currentPodcast.audioUrl.startsWith('/') 
          ? currentPodcast.audioUrl 
          : `/${currentPodcast.audioUrl}`
          
        console.log('Loading audio from URL:', audioUrl)
        audioRef.current.src = audioUrl
        audioRef.current.load()
        
        // Log any errors that occur when loading
        audioRef.current.onerror = (e) => {
          console.error('Audio error:', e)
        }
      }

      // Set up audio event listeners
      const audio = audioRef.current
      
      const handleTimeUpdate = () => {
        setCurrentTime(Math.floor(audio.currentTime))
      }
      
      const handleDurationChange = () => {
        setDuration(Math.floor(audio.duration))
      }
      
      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
      }

      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('durationchange', handleDurationChange)
      audio.addEventListener('ended', handleEnded)
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('durationchange', handleDurationChange)
        audio.removeEventListener('ended', handleEnded)
      }
    }
  }, [currentPodcast])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

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

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        // Pause the audio
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // First make sure the audio is loaded
        if (audioRef.current.readyState < 2) { // HAVE_CURRENT_DATA (2) or higher is needed
          await new Promise((resolve) => {
            const handleCanPlay = () => {
              audioRef.current?.removeEventListener('canplay', handleCanPlay);
              resolve(true);
            };
            audioRef.current.addEventListener('canplay', handleCanPlay);
            // Also set a timeout to avoid getting stuck
            setTimeout(resolve, 3000);
          });
        }
        
        // Now play the audio
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              console.log('Audio playback started successfully');
            })
            .catch(error => {
              console.error('Playback error:', error.message);
              setIsPlaying(false);
            });
        }
      }
    } catch (error) {
      console.error('Audio control error:', error);
      setIsPlaying(false);
    }
  }

  const handlePodcastClick = (podcast: (typeof availableAudioFiles)[0]) => {
    if (podcast.audioUrl) {
      // If currently playing, pause first
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
      }
      
      // Then update the podcast
      setCurrentPodcast(podcast);
      setIsPlaying(false);
      
      // Reset time when changing podcasts
      setCurrentTime(0);
      // Audio will be loaded by the effect when currentPodcast changes
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
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-orange-500"
            onClick={() => toast({
              title: "In development process...",
              description: "This feature will be available soon."
            })}
          >
            <Home className="w-5 h-5" />
            Home
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3"
            onClick={() => toast({
              title: "In development process...",
              description: "This feature will be available soon."
            })}
          >
            <Search className="w-5 h-5" />
            Search
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3"
            onClick={() => toast({
              title: "In development process...",
              description: "This feature will be available soon."
            })}
          >
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
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3"
            onClick={() => toast({
              title: "In development process...",
              description: "This feature will be available soon."
            })}
          >
            <Heart className="w-5 h-5" />
            Liked Episodes
          </Button>
        </div>

        <div className="space-y-2 flex-1">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Categories</h3>
          {categories.map((category) => (
            <Button 
              key={category.name} 
              variant="ghost" 
              className="w-full justify-start gap-3 text-sm"
              onClick={() => toast({
                title: "In development process...",
                description: "This feature will be available soon."
              })}
            >
              <category.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{category.name}</span>
              {/* <span className="text-xs text-muted-foreground">{category.count}</span> */}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
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
      {currentPodcast ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="What do you want to learn about?" className="pl-10 bg-muted/50" />
              </div>
            </div>

          <div className="flex items-center gap-4">
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 p-0"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
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
                                {/* <p className="text-sm text-muted-foreground">{podcast.listens} listens</p> */}
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
                              {/* <p className="text-sm text-muted-foreground">{podcast.listens} listens</p> */}
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
        {/* Audio element with better debugging */}
        <audio 
          ref={audioRef} 
          preload="auto" 
          controls={false}
          onError={(e) => console.error('Audio element error:', e)}
          onCanPlay={() => console.log('Audio can play now')}
          onLoadedMetadata={() => console.log('Audio metadata loaded successfully')} 
          onAbort={() => console.log('Audio loading aborted')}
          onStalled={() => console.log('Audio download stalled')}
          onSuspend={() => console.log('Audio loading suspended')}
          onWaiting={() => console.log('Audio waiting for data')}
        />
      </div>
    ) : (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading podcasts...</p>
        </div>
      </div>
    )}
    </div>
  )
}
