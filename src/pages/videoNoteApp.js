'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, CameraOff, Mic, MicOff, Pause, Play, StopCircle, ChevronUp, ChevronDown, Image, RefreshCcw, Volume } from "lucide-react"
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import TextWithLatex from './components/TextWithLatex'
import MermaidChart from './components/MermaidChart'

import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export default function VideoNoteApp() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isNoteTaking, setIsNoteTaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [note, setNote] = useState("")
  const [isNotesExpanded, setIsNotesExpanded] = useState(false)
  const [error, setError] = useState(null)
  const [file, setFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null) // New state for image preview
  const [response, setResponse] = useState([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [videoStream, setVideoStream] = useState(null)
  const [currentDeviceId, setCurrentDeviceId] = useState(null)
  const [isFlashing, setIsFlashing] = useState(false)
  const [isTranscriptSpeaking, setIsTranscriptSpeaking] = useState(false)
  const [isSummarySpeaking, setIsSummarySpeaking] = useState(false)

  const {
    transcript,
    interimTranscript,
    finalTranscript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true
  })

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setError("Browser doesn't support speech recognition.")
    }
    toggleCamera()
  }, [])

  // Update note when final transcript is available
  useEffect(() => {
    if (finalTranscript !== '') {
      setNote(prev => prev + '\n' + finalTranscript)
      resetTranscript()
    }
  }, [finalTranscript])

  const startListening = () => {
    resetTranscript()
    SpeechRecognition.startListening({
      continuous: true,
      interimResults: true
    })
  }

  const stopListening = () => {
    SpeechRecognition.stopListening()
  }

  const toggleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      setVideoStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCurrentDeviceId('environment')
    } catch (err) {
      console.error("Error accessing the camera:", err)
      setError(err.message)
    }
  }

  const flipCamera = async () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop())
    }
    const newFacingMode = currentDeviceId === 'environment' ? 'user' : 'environment'
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newFacingMode }, audio: false })
      setVideoStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCurrentDeviceId(newFacingMode)
    } catch (err) {
      console.error("Error flipping camera:", err)
      setError(err.message)
    }
  }


  // Modify speak functions
  const speakTranscript = () => {
    if (isTranscriptSpeaking) {
      window.speechSynthesis.cancel()
      setIsTranscriptSpeaking(false)
    } else {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(note)
        utterance.onend = () => setIsTranscriptSpeaking(false)
        window.speechSynthesis.speak(utterance)
        setIsTranscriptSpeaking(true)
      }
    }
  }

  const speakSummary = () => {
    if (isSummarySpeaking) {
      window.speechSynthesis.cancel()
      setIsSummarySpeaking(false)
    } else {
      if ('speechSynthesis' in window) {
        // Extract text from response objects and join them
        const textToSpeak = response
          .map(item => typeof item === 'string' ? item : item.message || '')
          .filter(Boolean)
          .join('. ');

        const utterance = new SpeechSynthesisUtterance(textToSpeak)
        utterance.onend = () => setIsSummarySpeaking(false)
        window.speechSynthesis.speak(utterance)
        setIsSummarySpeaking(true)
      }
    }
  }


  const takeSnapshot = () => {
    // Trigger flash animation
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 150) // Reset flash after animation

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Create image preview URL
      const imageUrl = canvas.toDataURL('image/jpeg')
      setImagePreview(imageUrl)

      canvas.toBlob((blob) => {
        const file = new File([blob], "snapshot.jpg", { type: "image/jpeg" })
        setFile(file)
      }, "image/jpeg")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('submit')
    // if (!file) return
    const formData = new FormData()
    formData.append("file", file ? file : '')
    formData.append("note", note)
    console.log(file);
    console.log(note)

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()

      // Add the current image preview to the response data
      setResponse(prev => [...prev, {
        ...data,
        imageUrl: imagePreview // Store the image URL with the response
      }])

      setNote('')
      // Reset the file as well
      setFile(null)
      setImagePreview(null) // Clear the preview after submission

    } catch (error) {
      console.error("Error:", error.message)
      setResponse(prev => [...prev, { message: "Error processing request", error: error.message }])
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
    if (isPaused) {
      startListening()
    } else {
      stopListening()
    }
    setIsPaused(!isPaused)
  }

  const toggleMute = () => {
    if (isMuted) {
      startListening()
    } else {
      stopListening()
    }
    setIsMuted(!isMuted)
  }

  const toggleNotesExpansion = () => {
    setIsNotesExpanded(!isNotesExpanded)
  }

  const generatePDF = () => {
    const input = document.getElementById('summary-section'); // ID of the container holding your summaries

    html2canvas(input, { backgroundColor: 'black' }).then((canvas) => {
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 10, 180, 280); // Customize size and position if needed
      pdf.save('summary.pdf');
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Video Section */}
      <div className="relative w-full aspect-video bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover"
        />
  
        {/* Flash Effect */}
        <div
          className={`absolute inset-0 bg-white transition-opacity duration-150 pointer-events-none
            ${isFlashing ? 'opacity-50' : 'opacity-0'}`}
        />
  
        {/* Camera Controls - Made more compact */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-900/80 border border-gray-800 rounded-full px-2 py-2">
            <div className="flex items-center space-x-1">
              <button
                onClick={flipCamera}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <RefreshCcw className="h-5 w-5" />
              </button>
  
              <button
                onClick={takeSnapshot}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors transform active:scale-95"
              >
                <Image className="h-5 w-5" />
              </button>
  
              <button
                onClick={toggleNoteTaking}
                className={`p-2 rounded-full hover:bg-gray-800 transition-colors
                  ${isNoteTaking ? 'bg-red-500/20' : ''}`}
              >
                <StopCircle className={`h-5 w-5 ${isNoteTaking ? 'text-red-500' : ''}`} />
              </button>
  
              {isNoteTaking && (
                <button
                  onClick={togglePause}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  {isPaused ?
                    <Play className="h-5 w-5" /> :
                    <Pause className="h-5 w-5" />
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
  
      {/* Rest of the components remain the same */}
  
      {/* Preview Section - Add this new section */}
      {imagePreview && (
        <div className="mx-4 mt-4 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-100 mb-2">Current Snapshot</h2>
          <img
            src={imagePreview}
            alt="Current snapshot"
            className="w-full rounded-lg object-cover"
          />
        </div>
      )}
  
      {/* Transcript Section */}
      <div className="m-4 bg-gray-800 border border-gray-700 rounded-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">Live Transcript</h2>
            <button
              onClick={speakTranscript}
              className={`p-2 rounded-full hover:bg-gray-700 transition-colors
                ${isTranscriptSpeaking ? 'bg-green-500/20' : ''}`}
            >
              <Volume className={`h-5 w-5 ${isTranscriptSpeaking ? 'text-green-500' : ''}`} />
            </button>
          </div>
  
          <div className="h-48 overflow-y-auto">
            <div className="space-y-2">
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {note}
                {interimTranscript && (
                  <span className="text-gray-500">{'\n' + interimTranscript}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
  
      {/* Actions & Summary Section */}
      <div className="m-4 mt-0 bg-gray-800 border border-gray-700 rounded-lg">
        <div className="p-4 space-y-4">
          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Generate Note
            </button>
          </form>
          <button
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg
                      disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={generatePDF}
          >
            Generate PDF
          </button>

  
          {/* Modify the Summaries section to include images */}
          {response.length > 0 && (
            <div className="m-4 mt-0 bg-gray-800 border border-gray-700 rounded-lg">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-100">Summaries</h2>
                  <button
                    onClick={speakSummary}
                    className={`p-2 rounded-full hover:bg-gray-700 transition-colors
                      ${isSummarySpeaking ? 'bg-green-500/20' : ''}`}
                  >
                    <Volume className={`h-5 w-5 ${isSummarySpeaking ? 'text-green-500' : ''}`} />
                  </button>
                </div>
  
                <div className="space-y-4" id="summary-section">
                  {response.map((message, index) => (
                    <div key={index} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                       {/* Display the image if it exists */}
                       {message.imageUrl && (
                        <div className="mb-4">
                          <img
                            src={message.imageUrl}
                            alt={`Snapshot ${index + 1}`}
                            className="w-full rounded-lg object-cover"
                          />
                        </div>
                      )}
                      <TextWithLatex text={message.message} />
                      {message.flowchart && <MermaidChart chart={message.flowchart} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
  
          {/* Canvas (hidden for drawing purposes) */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );  
}