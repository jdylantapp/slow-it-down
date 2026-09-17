import { useEffect, useMemo, useRef, useState } from 'react'
import ModernAudioPlayer, {useAudioPlayerPlayback} from 'react-modern-audio-player'
import SpeedControl from './SpeedControl'
import ReverbControl from './ReverbControl'
import createImpulseResponse, {getReverbMixLevels} from '../audio/createImpulseResponse'
import exportAudioAsWav from '../audio/exportAudioAsWav'

const stackedPlayerUI = {
    all: false,
    trackTime: true,
    progress: 'waveform',
    playButton: true,
    prevNnext: true,
  
    trackInfo: false,
    artwork: false,
    volume: false,
    volumeSlider: false,
    repeatType: false,
    playList: false,
    playbackRate: false,
}
  
  const stackedPlacement = {
    interface: {
      templateArea: {
        trackTimeCurrent: 'row1-1',
        trackTimeDuration: 'row1-3',
  
        progress: 'row2-2',
  
        playButton: 'row3-2',
      },
    },
}

const PlayerControlsBridge = ({ controlsRef }) => {
    const controls = useAudioPlayerPlayback()
  
    useEffect(() => {
      controlsRef.current = controls
  
      return () => {
        controlsRef.current = null
      }
    }, [controls, controlsRef])
  
    return null
}


const AudioPlayer = ({ audioFile, audioUrl }) => {

    const audioRef = useRef(null)
    const playerControlsRef = useRef(null)

    const audioContextRef = useRef(null)
    const mediaSourceRef = useRef(null)
    const convolverRef = useRef(null)
    const dryGainRef = useRef(null)
    const wetGainRef = useRef(null)

    const reverbAudioElementRef = useRef(null)
    const resumeContextHandlerRef = useRef(null)

    const reverbChangeIdRef = useRef(0)

    const [speed, setSpeed] = useState(1)
    const [reverb, setReverb] = useState(0)

    const [isExporting, setIsExporting] = useState(false)
    const [exportError, setExportError] = useState('')


    const trackId = audioFile.lastModified

    const playList = useMemo(() => [
        {
            id: trackId,
            src: audioUrl,
            name: audioFile.name
        },
    ], [audioFile.name, audioUrl, trackId])


    const initialAudioState = useMemo(() => ({
        curPlayId: trackId,
        playbackRate: 1,
    }), [trackId])


    useEffect(() => {
        
        const audio = audioRef.current

        if (!audio) {
            return
        }

        return () => {
            audio.pause()
        }

    }, [audioUrl])


    useEffect(() => {
        const audio = audioRef.current

        if (!audio) {
            return
        }

        audio.preservesPitch = false
        audio.playbackRate = speed
        audio.defaultPlaybackRate = speed

        if ('webkitPreservesPitch' in audio) {
            audio.webkitPreservesPitch = false
        }

    }, [audioUrl, speed])

    useEffect(() => {
        return () => {
            const audio = reverbAudioElementRef.current
            const resumeHandler = resumeContextHandlerRef.current
            const audioContext = audioContextRef.current

            if (audio && resumeHandler) {
                audio.removeEventListener('play', resumeHandler)
            }

            mediaSourceRef.current?.disconnect()
            convolverRef.current?.disconnect()
            dryGainRef.current?.disconnect()
            wetGainRef.current?.disconnect()

            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close()
            }
        }
    }, [])


    const initializeReverbGraph = async () => {
        const existingContext = audioContextRef.current

        if (existingContext) {
            if (existingContext.state === 'suspended') {
                await existingContext.resume()
            }

            return existingContext
        }

        const audio = audioRef.current

        if (!audio) {
            return null
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext

        const audioContext = new AudioContextClass()

        const mediaSource = audioContext.createMediaElementSource(audio)

        const convolver = audioContext.createConvolver()
        const dryGain = audioContext.createGain()
        const wetGain = audioContext.createGain()

        convolver.buffer = createImpulseResponse(audioContext)

        mediaSource.connect(dryGain)
        dryGain.connect(audioContext.destination)

        mediaSource.connect(convolver)
        convolver.connect(wetGain)
        wetGain.connect(audioContext.destination)

        dryGain.gain.value = 1
        wetGain.gain.value = 0

        audioContextRef.current = audioContext
        mediaSourceRef.current = mediaSource
        convolverRef.current = convolver
        dryGainRef.current = dryGain
        wetGainRef.current = wetGain
        reverbAudioElementRef.current = audio

        const resumeContext = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume()
            }
        }

        resumeContextHandlerRef.current = resumeContext
        audio.addEventListener('play', resumeContext)

        if (audioContext.state === 'suspended') {
            await audioContext.resume()
        }

        return audioContext
    }


    const handleSpeedChange = (event) => {

        const newSpeed = Number(event.target.value)
        const playerControls = playerControlsRef.current
        const audio = audioRef.current

        setSpeed(newSpeed)
        playerControls?.setPlaybackRate(newSpeed)

        if (audio) {
            audio.preservesPitch = false
            audio.playbackRate = newSpeed
            audio.defaultPlaybackRate = newSpeed 
        }
    }


    const handleReverbChange = async (event) => {
        const newReverb = Number(event.target.value)
    
        const changeId = reverbChangeIdRef.current + 1
    
        reverbChangeIdRef.current = changeId
    
        setReverb(newReverb)
    
        try {
            const audioContext = await initializeReverbGraph()
    
            if (changeId !== reverbChangeIdRef.current) {
                return
            }
    
            if (!audioContext || !dryGainRef.current || !wetGainRef.current) {
                return
            }
    
            const { dryLevel, wetLevel } = getReverbMixLevels(newReverb)
    
            const currentTime = audioContext.currentTime
    
            const updateGain = (audioParam, targetValue) => {
                const currentValue = audioParam.value
    
                audioParam.cancelScheduledValues(currentTime)
    
                audioParam.setValueAtTime(currentValue, currentTime)
    
                audioParam.linearRampToValueAtTime(targetValue, currentTime + 0.05)
            }
    
            updateGain(dryGainRef.current.gain, dryLevel)
    
            updateGain(wetGainRef.current.gain, wetLevel)
        }
        
        catch (error) {
            console.error('Unable to update reverb:', error)
        }
    }

    const handleDownload = async () => {
        if (isExporting) {
            return
        }

        setIsExporting(true)
        setExportError('')

        try {
            await exportAudioAsWav({audioFile, speed, reverb})
        }
        catch(error) {
            console.error('Unable to export WAV file: ', error)
            setExportError(error instanceof Error ? error.message : 'Unable to create the WAV file.')
        }
        finally {
            setIsExporting(false)
        }
    }


    if (!audioUrl) {
        return <p>Preparing audio player...</p>
    }


    return (
        <div className='audio-player-container'>

            <ModernAudioPlayer
            audioRef={audioRef}
            playList={playList}
            audioInitialState={initialAudioState}
            activeUI={stackedPlayerUI}
            placement={stackedPlacement}
            rootContainerProps={{
                className: 'slow-audio-player',
            }}
            >
                <PlayerControlsBridge controlsRef={playerControlsRef} />

            </ModernAudioPlayer>

            <SpeedControl speed={speed} onSpeedChange={handleSpeedChange}/>
            <ReverbControl reverb={reverb} onReverbChange={handleReverbChange}/>

            <button
                className='download-button'
                type='button'
                onClick={handleDownload}
                disabled={isExporting}
            >
                {isExporting ? 'Processing WAV...' : 'Download WAV'}
            </button>

            {exportError && (
                <p className='export-error' role='alert'>{exportError}</p>
            )}
            
        </div>
    )
    
}

export default AudioPlayer