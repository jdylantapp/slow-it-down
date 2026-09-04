import { useEffect, useMemo, useRef, useState } from 'react'
import ModernAudioPlayer, {useAudioPlayerPlayback} from 'react-modern-audio-player'

const playerUI = {
    all: false,
    playList: false,
    repeatType: false,
    artwork: false,
    playbackRate: false,
    volumeSlider: false,
    trackInfo: false,
    playButton: true,
    trackTime: true,
    prevNnext: true,
    progress: 'bar'
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

const SpeedControl = ({speed, onSpeedChange}) => {
    return (
        <div className='effect-control'>
                <div className='effect-label'>
                    <label htmlFor='speed'>Speed: </label>
                    <span>{speed.toFixed(2)}x</span>
                </div>
                <input
                    id='speed'
                    type='range'
                    min="0.5"
                    max="1.5"
                    step="0.01"
                    value={speed}
                    onChange={onSpeedChange}
                />
        </div>
    )
}


const AudioPlayer = ({ audioFile, audioUrl }) => {

    const audioRef = useRef(null)
    const playerControlsRef = useRef(null)

    const [speed, setSpeed] = useState(1)


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


    if (!audioUrl) {
        return <p>Preparing audio player...</p>
    }


    return (
        <div className='audio-player-container'>

            <ModernAudioPlayer
            audioRef={audioRef}
            playList={playList}
            audioInitialState={initialAudioState}
            activeUI={playerUI}
            >
                <PlayerControlsBridge controlsRef={playerControlsRef} />

            </ModernAudioPlayer>

            <SpeedControl speed={speed} onSpeedChange={handleSpeedChange}/> 
            
        </div>
    )
    
}

export default AudioPlayer