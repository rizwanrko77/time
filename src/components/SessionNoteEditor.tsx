'use client'

import { useState, useEffect, useRef } from 'react'

type Props = {
  isOpen: boolean
  entryId: string | null
  onClose: () => void
  initialNotes: string | null
  onSave: (notes: string) => Promise<void>
}

// Add TypeScript definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function SessionNoteEditor({ isOpen, entryId, onClose, initialNotes, onSave }: Props) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [interimNote, setInterimNote] = useState('')
  const interimNoteRef = useRef('')
  const [isRecording, setIsRecording] = useState(false)
  const isRecordingRef = useRef(false)
  const [isSaving, setIsSaving] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [language, setLanguage] = useState('en-IN')
  const [isPlayingTTS, setIsPlayingTTS] = useState(false)

  const recognitionRef = useRef<any>(null)

  // Real-time audio visualization refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number>(null)
  const barsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('dictation-lang')
      if (savedLang) {
        setLanguage(savedLang)
      }
    }
  }, [])

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dictation-lang', newLang)
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (entryId) {
        // Try to load from auto-save draft first
        const draftKey = `draft-note-${entryId}`
        const savedDraft = localStorage.getItem(draftKey)
        
        if (savedDraft !== null && savedDraft !== initialNotes) {
          setNotes(savedDraft)
        } else {
          setNotes(initialNotes || '')
        }
      } else {
        setNotes(initialNotes || '')
      }
    }
  }, [isOpen, initialNotes, entryId])

  // Prevent accidental refresh if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If we have an entryId and the current notes differ from the database notes (initialNotes)
      if (entryId && notes !== (initialNotes || '')) {
        e.preventDefault()
        e.returnValue = '' // Required for Chrome to show the warning
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [notes, initialNotes, entryId])

  // Handle manual closing of the modal (X button or backdrop click)
  const handleClose = () => {
    if (entryId && notes !== (initialNotes || '')) {
      const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to close without saving?")
      if (!confirmClose) return
    }
    
    window.speechSynthesis?.cancel()
    setIsPlayingTTS(false)
    onClose()
  }

  // Handle manual typing + auto-save
  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes)
    if (entryId) {
      localStorage.setItem(`draft-note-${entryId}`, newNotes)
    }
  }

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true // Changed back to true to prevent beeping
        recognition.interimResults = true
        recognition.lang = language

        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          let currentInterim = ''

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            } else {
              currentInterim += event.results[i][0].transcript
            }
          }
          
          setInterimNote(currentInterim)
          interimNoteRef.current = currentInterim

          if (finalTranscript) {
            setNotes(prev => {
              const separator = prev.trim() ? '\n\n' : ''
              const newNotes = prev + separator + finalTranscript
              
              // Auto-save the dictated text
              if (entryId) {
                localStorage.setItem(`draft-note-${entryId}`, newNotes)
              }
              
              return newNotes
            })
          }
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error)
          setIsRecording(false)
          cleanupAudio()
        }

        recognition.onend = () => {
          // If Android cuts off and leaves text stuck in interim, forcefully save it!
          if (interimNoteRef.current.trim()) {
            const stuckText = interimNoteRef.current
            setNotes(prev => {
              const separator = prev.trim() ? '\n\n' : ''
              const newNotes = prev + separator + stuckText
              if (entryId) {
                localStorage.setItem(`draft-note-${entryId}`, newNotes)
              }
              return newNotes
            })
            setInterimNote('')
            interimNoteRef.current = ''
          }
          
          isRecordingRef.current = false
          setIsRecording(false)
          cleanupAudio()
        }

        recognitionRef.current = recognition
      } else {
        setSpeechSupported(false)
      }
    }
  }, [language]) // Re-initialize if language changes
  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
  }

  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioCtx

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128 // Gives 64 frequency bins, enough for 40 bars
      analyserRef.current = analyser

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateWaveform = () => {
        if (!analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)

        for (let i = 0; i < 40; i++) {
          const bar = barsRef.current[i]
          if (bar) {
            // Mirror the frequencies from the center (index 20) for a beautiful symmetric string
            // Human voice is mostly in the lower bins, so we map distance-from-center to bins 0-20
            const centerDistance = Math.abs(20 - i)
            const value = dataArray[centerDistance] || 0

            // Base height 2px, max height 16px to feel like a subtle string
            const height = 2 + (value / 255) * 14
            bar.style.height = `${height}px`
          }
        }

        animationFrameRef.current = requestAnimationFrame(updateWaveform)
      }

      updateWaveform()
    } catch (err) {
      console.error('Error accessing microphone for visualizer:', err)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      isRecordingRef.current = false
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsRecording(false)
      cleanupAudio()
    } else {
      try {
        isRecordingRef.current = true
        recognitionRef.current?.start()
        setIsRecording(true)
        startAudioVisualizer()
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleSave = async () => {
    if (isRecording) {
      isRecordingRef.current = false
      recognitionRef.current?.stop()
      setIsRecording(false)
      cleanupAudio()
    }
    window.speechSynthesis?.cancel()

    setIsSaving(true)
    await onSave(notes)
    
    // Clear the auto-save draft upon successful save
    if (entryId) {
      localStorage.removeItem(`draft-note-${entryId}`)
    }
    
    setIsSaving(false)
    onClose()
  }

  const handlePlayTTS = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (isPlayingTTS) {
        window.speechSynthesis.cancel()
        setIsPlayingTTS(false)
        return
      }

      if (!notes.trim()) return

      const utterance = new SpeechSynthesisUtterance(notes)
      utterance.lang = language

      utterance.onend = () => setIsPlayingTTS(false)
      utterance.onerror = () => setIsPlayingTTS(false)

      setIsPlayingTTS(true)
      window.speechSynthesis.speak(utterance)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 transition-opacity backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 h-[80vh] sm:h-auto sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[500px] bg-white dark:bg-zinc-900 z-50 rounded-t-3xl sm:rounded-none sm:rounded-l-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-zinc-800 gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">Session Notes</h2>
          <div className="flex items-center gap-1.5 sm:gap-3">
            {speechSupported && (
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isRecording}
                className="text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 rounded-full py-1.5 px-3 outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer w-24 sm:w-28 truncate font-medium hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <optgroup label="English">
                  <option value="en-AU">English (Australia)</option>
                  <option value="en-CA">English (Canada)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="en-NZ">English (New Zealand)</option>
                  <option value="en-ZA">English (South Africa)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="en-US">English (US)</option>
                </optgroup>
                <optgroup label="Indian Languages">
                  <option value="bn-IN">Bengali</option>
                  <option value="gu-IN">Gujarati</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="kn-IN">Kannada</option>
                  <option value="ml-IN">Malayalam</option>
                  <option value="mr-IN">Marathi</option>
                  <option value="pa-IN">Punjabi</option>
                  <option value="ta-IN">Tamil</option>
                  <option value="te-IN">Telugu</option>
                  <option value="ur-IN">Urdu (India)</option>
                </optgroup>
                <optgroup label="Global Languages">
                  <option value="af-ZA">Afrikaans</option>
                  <option value="am-ET">Amharic</option>
                  <option value="ar-SA">Arabic</option>
                  <option value="az-AZ">Azerbaijani</option>
                  <option value="bg-BG">Bulgarian</option>
                  <option value="ca-ES">Catalan</option>
                  <option value="zh-CN">Chinese (Simplified)</option>
                  <option value="zh-TW">Chinese (Traditional)</option>
                  <option value="hr-HR">Croatian</option>
                  <option value="cs-CZ">Czech</option>
                  <option value="da-DK">Danish</option>
                  <option value="nl-NL">Dutch</option>
                  <option value="fi-FI">Finnish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="el-GR">Greek</option>
                  <option value="he-IL">Hebrew</option>
                  <option value="hu-HU">Hungarian</option>
                  <option value="id-ID">Indonesian</option>
                  <option value="it-IT">Italian</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="jv-ID">Javanese</option>
                  <option value="ko-KR">Korean</option>
                  <option value="ms-MY">Malay</option>
                  <option value="no-NO">Norwegian</option>
                  <option value="fa-IR">Persian</option>
                  <option value="pl-PL">Polish</option>
                  <option value="pt-BR">Portuguese (Brazil)</option>
                  <option value="pt-PT">Portuguese (Portugal)</option>
                  <option value="ro-RO">Romanian</option>
                  <option value="ru-RU">Russian</option>
                  <option value="sr-RS">Serbian</option>
                  <option value="sk-SK">Slovak</option>
                  <option value="sl-SI">Slovenian</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="es-MX">Spanish (Mexico)</option>
                  <option value="sw-KE">Swahili</option>
                  <option value="sv-SE">Swedish</option>
                  <option value="th-TH">Thai</option>
                  <option value="tr-TR">Turkish</option>
                  <option value="uk-UA">Ukrainian</option>
                  <option value="ur-PK">Urdu</option>
                  <option value="vi-VN">Vietnamese</option>
                  <option value="zu-ZA">Zulu</option>
                </optgroup>
              </select>
            )}
            {notes.trim() && (
              <button
                onClick={handlePlayTTS}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                {isPlayingTTS ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    <span className="hidden sm:inline">Stop</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Read</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col relative overflow-hidden">
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-48 sm:h-64 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none custom-scrollbar"
              placeholder={isRecording ? "Listening... (Pause to stop)" : "Type or speak your notes here..."}
              disabled={isSaving}
            />
            {interimNote && (
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-blue-50/90 dark:bg-blue-900/80 text-blue-800 dark:text-blue-100 rounded-lg backdrop-blur-sm pointer-events-none text-sm animate-in fade-in zoom-in-95 duration-200 shadow border border-blue-200/50 dark:border-blue-700/50 z-10">
                <span className="italic flex items-start gap-2.5">
                  <span className="relative flex h-2 w-2 shrink-0 mt-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span className="leading-relaxed">{interimNote}</span>
                </span>
              </div>
            )}
          </div>

          {/* Controls - Fixed to bottom of panel */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pt-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
            {speechSupported ? (
              <div className="flex items-center gap-4 w-full">
                <button
                  onClick={toggleRecording}
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all duration-300 shadow-sm shrink-0 ${isRecording
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700'
                    }`}
                >
                  {isRecording ? (
                    <>
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
                        <path d="M19 10v2a7 7 0 01-14 0v-2h2v2a5 5 0 0010 0v-2h2z" />
                      </svg>
                      Listening...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Dictate
                    </>
                  )}
                </button>

                {/* Audio Wave Animation */}
                {isRecording && (
                  <div className="flex-1 flex items-center justify-center gap-[2px] h-6 overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => {
                      // Hide the outer 10 bars on each side for mobile so it fits nicely
                      const isEdge = i < 10 || i >= 30;
                      return (
                        <div
                          key={i}
                          ref={(el) => { barsRef.current[i] = el }}
                          className={`w-[2px] bg-red-400 dark:bg-red-500 rounded-full transition-all duration-75 ease-out ${isEdge ? 'hidden sm:block' : ''}`}
                          style={{ height: '2px' }}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-400">Dictation unavailable</span>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
