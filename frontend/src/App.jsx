import { useEffect, useState } from 'react'
import AudioUploader from './components/AudioUploader'
import AudioPlayer from './components/AudioPlayer'
import './App.css'

function App() {
  
  const [audioFile, setAudioFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)

  const handleFileSelect = async (selectedFile) => {

    const objectUrl = URL.createObjectURL(selectedFile)

    setAudioFile(selectedFile)
    setAudioUrl(objectUrl)
  }

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  return (
    <div>

      <div className='navbar'>
        <h1>Slow-It-Down</h1>
      </div>
      

      <div class="upload-container">

        <AudioUploader onFileSelect={handleFileSelect}></AudioUploader>

        {audioFile && (
          <div>
            <p>Selected Song: {audioFile.name}</p>
            <p>
              Size: {(audioFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        {audioFile && audioUrl && (
          <>
            <AudioPlayer
              key={`${audioFile.name}-${audioFile.lastModified}`}
              audioFile={audioFile}
              audioUrl={audioUrl}
            />
          </>
        )}

      </div>
      
    </div>
     
  )
}

export default App
