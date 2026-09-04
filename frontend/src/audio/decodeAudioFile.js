const decodeAudioFile = async (file) => {

    const audioContext = new AudioContext()

    try {
        const arrayBuffer = await file.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        return audioBuffer
    }
    finally {
        await audioContext.close()
    }
}

export default decodeAudioFile