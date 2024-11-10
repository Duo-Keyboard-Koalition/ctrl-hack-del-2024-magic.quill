'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, CameraOff, Mic, MicOff, Pause, Play, StopCircle, ChevronUp, ChevronDown, Volume2, VolumeX, Volume } from "lucide-react"
import SpeechToText from 'speech-to-text'

export default function VideoNoteApp() {
  const videoRef = useRef(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isNoteTaking, setIsNoteTaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isAudioOn, setIsAudioOn] = useState(false)
  const [audioStream, setAudioStream] = useState(null)
  const [note, setNote] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [isNotesExpanded, setIsNotesExpanded] = useState(false)
  const [listener, setListener] = useState(null)
  const [error, setError] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    initializeSpeechToText()
    return () => {
      if (listener) {
        listener.stopListening()
      }
    }
  }, [])

  const initializeSpeechToText = () => {
    try {
      const onAnythingSaid = (text) => {
        setInterimTranscript(text)
      }

      const onEndEvent = () => {
        if (isNoteTaking && !isPaused) {
          startListening()
        }
      }

      const onFinalised = (text) => {
        setNote(prevNote => prevNote + text + " ")
        setInterimTranscript("")
      }

      const newListener = new SpeechToText(
        onFinalised,
        onEndEvent,
        onAnythingSaid
      )
      setListener(newListener)
    } catch (error) {
      console.error("Speech to text initialization error:", error)
      setError(error.message)
    }
  }

  const startListening = () => {
    if (listener) {
      try {
        listener.startListening()
      } catch (error) {
        console.error("Error starting speech recognition:", error)
        setError(error.message)
      }
    }
  }

  const stopListening = () => {
    if (listener) {
      listener.stopListening()
    }
  }

  const toggleCamera = async () => {
    if (!isCameraOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        })

        if (videoRef.current) {
          if (audioStream) {
            const tracks = [...stream.getTracks(), ...audioStream.getTracks()]
            const combinedStream = new MediaStream(tracks)
            videoRef.current.srcObject = combinedStream
          } else {
            videoRef.current.srcObject = stream
          }
        }
        setIsCameraOn(true)
      } catch (err) {
        console.error("Error accessing the camera:", err)
        setError(err.message)
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getVideoTracks().forEach(track => track.stop())
        if (audioStream) {
          videoRef.current.srcObject = audioStream
        } else {
          videoRef.current.srcObject = null
        }
      }
      setIsCameraOn(false)
    }
  }

  const toggleAudio = async () => {
    if (!isAudioOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        })

        if (videoRef.current) {
          if (isCameraOn && videoRef.current.srcObject) {
            const videoTracks = videoRef.current.srcObject.getVideoTracks()
            const combinedStream = new MediaStream([...videoTracks, ...stream.getTracks()])
            videoRef.current.srcObject = combinedStream
          } else {
            videoRef.current.srcObject = stream
          }
        }
        setAudioStream(stream)
        setIsAudioOn(true)
      } catch (err) {
        console.error("Error accessing the microphone:", err)
        setError(err.message)
      }
    } else {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop())
        if (isCameraOn && videoRef.current && videoRef.current.srcObject) {
          const videoTracks = videoRef.current.srcObject.getVideoTracks()
          if (videoTracks.length > 0) {
            const videoOnlyStream = new MediaStream(videoTracks)
            videoRef.current.srcObject = videoOnlyStream
          } else {
            videoRef.current.srcObject = null
          }
        } else {
          if (videoRef.current) {
            videoRef.current.srcObject = null
          }
        }
        setAudioStream(null)
      }
      setIsAudioOn(false)
    }
  }

  const toggleNoteTaking = () => {
    if (!isNoteTaking) {
      startListening()
    } else {
      stopListening()
      setIsPaused(false)
    }
    setIsNoteTaking(!isNoteTaking)
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
    if (isPaused) {
      startListening()
    } else {
      stopListening()
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  const toggleNotesExpansion = () => {
    setIsNotesExpanded(!isNotesExpanded)
  }

  const speakNote = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(note)
        utterance.onend = () => {
          setIsSpeaking(false)
        }
        window.speechSynthesis.speak(utterance)
        setIsSpeaking(true)
      } else {
        console.error("SpeechSynthesis API is not supported in this browser.")
        setError("SpeechSynthesis API is not supported in this browser.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <main className="flex-grow flex flex-col">
        <div className="relative flex-grow">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
            <button
              onClick={toggleCamera}
              className="p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full transition-colors"
              aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {isCameraOn ?
                <Camera className="h-6 w-6 text-white" /> :
                <CameraOff className="h-6 w-6 text-white" />
              }
            </button>
            <button
              onClick={toggleAudio}
              className="p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full transition-colors"
              aria-label={isAudioOn ? "Turn off audio" : "Turn on audio"}
            >
              {isAudioOn ?
                <Volume2 className="h-6 w-6 text-white" /> :
                <VolumeX className="h-6 w-6 text-white" />
              }
            </button>
            <button
              onClick={toggleNoteTaking}
              className="p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full transition-colors"
              aria-label={isNoteTaking ? "Stop taking notes" : "Start taking notes"}
            >
              <StopCircle className={`h-6 w-6 ${isNoteTaking ? 'text-red-500' : 'text-white'}`} />
            </button>
            {isNoteTaking && (
              <button
                onClick={togglePause}
                className="p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full transition-colors"
                aria-label={isPaused ? "Resume recording" : "Pause recording"}
              >
                {isPaused ?
                  <Play className="h-6 w-6 text-white" /> :
                  <Pause className="h-6 w-6 text-white" />
                }
              </button>
            )}
            <button
              onClick={toggleMute}
              className="p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full transition-colors"
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ?
                <MicOff className="h-6 w-6 text-white" /> :
                <Mic className="h-6 w-6 text-white" />
              }
            </button>
            <button
              onClick={speakNote}
              className={`p-2 rounded-full transition-colors ${isSpeaking ? 'bg-green-600' : 'bg-gray-800/80 hover:bg-gray-700/80'}`}
              aria-label={isSpeaking ? "Stop speaking note" : "Play note as sound"}
            >
              {isSpeaking ?
                <Volume className="h-6 w-6 text-yellow-500" /> :
                <Volume className="h-6 w-6 text-white" />
              }
            </button>
          </div>
        </div>
        <div
          className={`bg-gray-800 transition-all duration-300 ease-in-out ${isNotesExpanded ? 'h-1/2' : 'h-20'}`}
        >
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={toggleNotesExpansion}
          >
            <h2 className="text-lg font-semibold">Generated Notes</h2>
            {error && <p className="text-red-500 text-sm">Error: {error}</p>}
            {isNotesExpanded ?
              <ChevronDown className="h-6 w-6" /> :
              <ChevronUp className="h-6 w-6" />
            }
          </div>
          <div className={`px-4 pb-4 ${isNotesExpanded ? 'h-[calc(100%-4rem)] overflow-y-auto' : 'h-0 overflow-hidden'}`}>
            <p className="text-sm text-gray-300">
              {note}
              {interimTranscript && <span className="text-gray-500"> ({interimTranscript})</span>}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}