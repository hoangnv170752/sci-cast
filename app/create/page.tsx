"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Mic, Download, ArrowLeft, Sparkles, Volume2, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { savePodcast as savePodcastToLibrary } from "@/lib/podcasts"

interface Voice {
  voice_id: string
  name: string
  category: string
  description: string
  accent?: string
}

export default function CreatePodcastPage() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState("")
  const [generatedScript, setGeneratedScript] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState("21m00Tcm4TlvDq8ikWAM") // Rachel's voice ID
  const [podcastTitle, setPodcastTitle] = useState("")
  const [hostName, setHostName] = useState(user?.user_metadata?.full_name || "")
  const [guestName, setGuestName] = useState("")
  const [category, setCategory] = useState("")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [voices, setVoices] = useState<Voice[]>([])
  const router = useRouter()
  const supabase = createClient()
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isTrimming, setIsTrimming] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Load available voices on component mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const response = await fetch("/api/voices")
        const data = await response.json()
        setVoices(data.voices || [])
      } catch (error) {
        console.error("Failed to load voices:", error)
        // Fallback voices
        setVoices([
          {
            voice_id: "21m00Tcm4TlvDq8ikWAM",
            name: "Rachel",
            category: "premade",
            description: "Professional female voice",
            accent: "American",
          },
          {
            voice_id: "29vD33N1CtxCmqQRPOHJ",
            name: "Drew",
            category: "premade",
            description: "Warm male voice",
            accent: "American",
          },
          {
            voice_id: "2EiwWnXFnvU5JabPnv8n",
            name: "Clyde",
            category: "premade",
            description: "Middle-aged male",
            accent: "American",
          },
          {
            voice_id: "5Q0t7uMcjvnagumLfvZi",
            name: "Paul",
            category: "premade",
            description: "Mature male voice",
            accent: "American",
          },
          {
            voice_id: "AZnzlk1XvdvUeBnXmlld",
            name: "Domi",
            category: "premade",
            description: "Young female voice",
            accent: "American",
          },
          {
            voice_id: "CYw3kZ02Hs0563khs1Fj",
            name: "Dave",
            category: "premade",
            description: "British male voice",
            accent: "British",
          },
        ])
      }
    }
    loadVoices()
  }, [])

  // Add this useEffect after the voices loading effect
  useEffect(() => {
    // Cleanup audio URL when component unmounts
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    processFile(file)
  }

  const processFile = async (file: File) => {
    setUploadedFile(file)
    setIsExtracting(true)
    setError("")
    setProgress(25)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract text")
      }

      setExtractedText(data.text)
      setUploadedFilePath(data.filePath)
      setCurrentStep(2)
      setProgress(50)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to extract text from file")
    } finally {
      setIsExtracting(false)
    }
  }

  const trimScript = async () => {
    if (generatedScript.length <= 5000 || isTrimming) return;
    
    setIsTrimming(true);
    setError("");
    
    try {
      const response = await fetch("/api/trim-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script: generatedScript,
          targetLength: 4500,
          podcastTitle,
          hostName,
          guestName,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to trim script");
      }
      
      const data = await response.json();
      setGeneratedScript(data.trimmedScript);
    } catch (error) {
      console.error("Error trimming script:", error);
      setError(error instanceof Error ? error.message : "Failed to trim script");
    } finally {
      setIsTrimming(false);
    }
  };

  const generateScript = async () => {
    setIsGenerating(true)
    setError("")
    setProgress(75)

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extractedText,
          podcastTitle,
          hostName,
          guestName,
          category,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate script")
      }

      setGeneratedScript(data.script)
      setCurrentStep(3)
      setProgress(100)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to generate script")
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAudio = async () => {
    if (!generatedScript.trim()) {
      setError("Please generate a script first")
      return
    }

    if (generatedScript.length > 10000) {
      setError("Script is too long. Please shorten it to under 10,000 characters.")
      return
    }

    setIsGeneratingAudio(true)
    setError("")

    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script: generatedScript,
          voiceId: selectedVoice,
          title: podcastTitle || 'podcast'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate audio")
      }

      // Get the audio URL from the response
      const data = await response.json()
      
      if (!data.success || !data.audioUrl) {
        throw new Error("Failed to generate audio: No audio URL returned")
      }
      
      // Set the public URL to the audio file
      setAudioUrl(data.audioUrl)
      setCurrentStep(4)
    } catch (error) {
      console.error("Audio generation error:", error)
      setError(error instanceof Error ? error.message : "Failed to generate audio")
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const downloadAudio = () => {
    if (audioUrl) {
      // For files stored in the public directory, we can just create a link
      // with the public URL and click it to download
      const link = document.createElement("a")
      link.href = audioUrl
      link.download = `${podcastTitle || "podcast"}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const savePodcast = async () => {
    if (!user) {
      alert("Please log in to save podcasts")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      // Create the podcast data object
      const podcastData = {
        title: podcastTitle || "Generated Podcast",
        host: hostName || user.user_metadata?.full_name || "AI Generated",
        guest: guestName || "",
        category: category || "Technology",
        script: generatedScript,
        voice_id: selectedVoice,
        voice_name: voices.find((v) => v.voice_id === selectedVoice)?.name || "Selected Voice",
        user_id: user.id,
        created_at: new Date().toISOString(),
        audioUrl: audioUrl || "", // URL to the generated audio file
        duration: "2:30", // For demo purposes
        description: generatedScript.substring(0, 150) + "...", // Use the first part of the script as description
        listens: "0",
        featured: false,
      }

      // Save to our podcast library (localStorage)
      const savedPodcast = savePodcastToLibrary(podcastData)
      console.log("Podcast saved successfully:", savedPodcast)

      alert("Podcast saved successfully! Your podcast will now appear on the homepage.")
      router.push("/")
    } catch (error) {
      console.error("Save error:", error)
      setError("Failed to save podcast. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold">AI Podcast Generator</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Powered by Cerebras Gwen 3 & ElevenLabs</Badge>
              {user && (
                <div className="text-sm text-muted-foreground">
                  Welcome, {user.user_metadata?.full_name || user.email}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="container mx-auto px-6 py-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Indicators */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { step: 1, label: "Upload", icon: Upload },
              { step: 2, label: "Extract", icon: FileText },
              { step: 3, label: "Generate", icon: Sparkles },
              { step: 4, label: "Voice", icon: Mic },
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="ml-2 text-sm font-medium">{label}</span>
                {step < 4 && <div className="w-8 h-px bg-border ml-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-8">
        <Tabs value={`step-${currentStep}`} className="w-full">
          {/* Step 1: Upload Document */}
          <TabsContent value="step-1" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Research Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    ref={dropZoneRef}
                    className={`border-2 border-dashed ${isDragging ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-border'} rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition-colors`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDragging(true)
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDragging(true)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDragging(false)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDragging(false)
                      
                      const files = e.dataTransfer.files
                      if (files.length > 0) {
                        const file = files[0]
                        const allowedTypes = ['.pdf', '.docx', '.txt']
                        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
                        
                        if (allowedTypes.includes(fileExtension)) {
                          processFile(file)
                        } else {
                          setError(`Unsupported file type. Please upload PDF, DOCX, or TXT files.`)
                        }
                      }
                    }}
                  >
                    <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-orange-500' : 'text-muted-foreground'}`} />
                    <h3 className="text-lg font-medium mb-2">{isDragging ? 'Drop your file here!' : 'Drop your research paper here'}</h3>
                    <p className="text-muted-foreground mb-4">Supports PDF files (processed with Qwen 3 AI), DOCX, and TXT up to 10MB</p>
                    <Button disabled={isExtracting}>
                      {isExtracting ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full mr-2" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isExtracting}
                  />
                  {uploadedFile && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <FileText className="w-5 h-5 text-orange-500" />
                      <span className="font-medium">{uploadedFile.name}</span>
                      <Badge variant="secondary">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 2: Review Extracted Text */}
          <TabsContent value="step-2" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Extracted Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="extract-host">Host Name</Label>
                      <Input
                        id="extract-host"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                        placeholder="Enter host name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="extract-guest">Guest Name</Label>
                      <Input
                        id="extract-guest"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Enter guest name (optional)"
                      />
                    </div>
                  </div>
                  <Textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="min-h-[400px]"
                    placeholder="Extracted text will appear here..."
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{extractedText.length} characters</span>
                    <Button onClick={generateScript} disabled={!extractedText || isGenerating}>
                      {isGenerating ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Podcast Script
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 3: Review Generated Script */}
          <TabsContent value="step-3" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Generated Podcast Script
                      {isGenerating && (
                        <div className="animate-spin w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        value={generatedScript}
                        onChange={(e) => setGeneratedScript(e.target.value)}
                        className="min-h-[400px]"
                        placeholder="AI-generated script will appear here..."
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{generatedScript.length} characters</span>
                          <Badge variant={generatedScript.length > 5000 ? "destructive" : "secondary"}>
                            {generatedScript.length > 5000 ? "Very long" : "Good length"}
                          </Badge>
                          {generatedScript.length > 5000 && (
                            <Button 
                              onClick={trimScript} 
                              variant="secondary" 
                              size="sm" 
                              disabled={isTrimming || generatedScript.length < 5000}
                              className="ml-2"
                            >
                              {isTrimming ? (
                                <>
                                  <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                                  Trimming...
                                </>
                              ) : (
                                <>
                                  <span className="mr-1">✂️</span>
                                  Trim Content
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={generateScript} variant="outline" size="sm" disabled={isGenerating}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Podcast Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Episode Title</Label>
                      <Input
                        id="title"
                        value={podcastTitle}
                        onChange={(e) => setPodcastTitle(e.target.value)}
                        placeholder="Enter episode title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="host">Host Name</Label>
                      <Input
                        id="host"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                        placeholder="Enter host name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest">Guest Name</Label>
                      <Input
                        id="guest"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Enter guest name (optional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ai-ml">AI & Machine Learning</SelectItem>
                          <SelectItem value="quantum">Quantum Technology</SelectItem>
                          <SelectItem value="blockchain">Blockchain & Web3</SelectItem>
                          <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                          <SelectItem value="biotech">Biotechnology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Voice Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {voices.map((voice) => (
                        <div
                          key={voice.voice_id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedVoice === voice.voice_id
                              ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
                              : "border-border hover:border-orange-300"
                          }`}
                          onClick={() => setSelectedVoice(voice.voice_id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{voice.name}</h4>
                              <p className="text-sm text-muted-foreground">{voice.description}</p>
                              {voice.accent && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {voice.accent}
                                </Badge>
                              )}
                            </div>
                            <Button variant="ghost" size="sm">
                              <Volume2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={generateAudio}
                      disabled={!generatedScript || isGeneratingAudio}
                    >
                      {isGeneratingAudio ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Generating Audio...
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Generate Audio
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Step 4: Final Review & Save */}
          <TabsContent value="step-4" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Podcast Generated Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {audioUrl && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-medium mb-3">Preview Your Podcast</h3>
                      <audio controls className="w-full">
                        <source src={audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <p className="text-sm">{podcastTitle || "Generated Podcast"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Host</Label>
                      <p className="text-sm">{hostName || "AI Generated"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <p className="text-sm">{category || "Technology"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Voice</Label>
                      <p className="text-sm">
                        {voices.find((v) => v.voice_id === selectedVoice)?.name || "Selected Voice"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={savePodcast} className="flex-1" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Save Podcast
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={downloadAudio} disabled={!audioUrl}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Audio
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
