import createImpulseResponse, {getReverbMixLevels, REVERB_DURATION} from "./createImpulseResponse"

const writeText = (dataView, offset, text) => {
    for (let index = 0; index < text.length; index += 1) {
        dataView.setUint8(offset + index, text.charCodeAt(index))
    }
}

const encodeAudioBufferAsWav = (audioBuffer) => {
    const channelCount = audioBuffer.numberOfChannels
    const bytesPerSample = 2
    const frameCount = audioBuffer.length

    const dataSize = frameCount * channelCount * bytesPerSample

    if (dataSize > 0xffffffff - 36) {
        throw new Error('The processed audio is too large to save as a WAV file.')
    }

    const wavBuffer = new ArrayBuffer(44 + dataSize)
    const dataView = new DataView(wavBuffer)

    writeText(dataView, 0, 'RIFF')
    dataView.setUint32(4, 36 + dataSize, true)
    writeText(dataView, 8, 'WAVE')

    writeText(dataView, 12, 'fmt ')
    dataView.setUint32(16, 16, true)
    dataView.setUint16(20, 1, true)
    dataView.setUint16(22, channelCount, true)
    dataView.setUint32(24, audioBuffer.sampleRate, true)

    dataView.setUint32(28, audioBuffer.sampleRate * channelCount * bytesPerSample, true)

    dataView.setUint16(32, channelCount * bytesPerSample, true)

    dataView.setUint16(34, bytesPerSample * 8, true)


    writeText(dataView, 36, 'data')
    dataView.setUint32(40, dataSize, true)

    const channelData = Array.from(
        { length: channelCount },
        (_, channel) => {
            return audioBuffer.getChannelData(channel)
        }
    )

    let writeOffset = 44

    for (let frame = 0; frame < frameCount; frame += 1) {
        for (let channel = 0; channel < channelCount; channel += 1) {
            const sample = Math.max(-1, Math.min(1, channelData[channel][frame]))
            const pcmSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
            dataView.setInt16(writeOffset, pcmSample, true)
            writeOffset += bytesPerSample
        }
    }

    return new Blob([wavBuffer], { type : 'audio/wav' })
}

const decodeAudioFile = async (audioFile) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext

    if (!AudioContextClass) {
        throw new Error ('This browser does not support audio processing.')
    }

    const decodingContext = new AudioContextClass()

    try {
        const fileData = await audioFile.arrayBuffer()
        return await decodingContext.decodeAudioData(fileData)
    }
    finally {
        if (decodingContext.state !== 'closed') {
            await decodingContext.close()
        }
    }
}

const renderEditedAudio = async ({audioBuffer, speed, reverb}) => {

    const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext

    if (!OfflineAudioContextClass) {
        throw new Error ('This browser does not support offline audio processing.')
    }

    const outputChannelCount = Math.min(audioBuffer.numberOfChannels, 2)

    const slowedDuration = audioBuffer.duration / speed
    const reverbTail = reverb > 0 ? REVERB_DURATION : 0
    const outputDuration = slowedDuration + reverbTail
    const outputFrameCount = Math.ceil(outputDuration * audioBuffer.sampleRate)

    const offlineContext = new OfflineAudioContextClass(outputChannelCount, outputFrameCount, audioBuffer.sampleRate)

    const source = offlineContext.createBufferSource()
    const convolver = offlineContext.createConvolver()
    const dryGain = offlineContext.createGain()
    const wetGain = offlineContext.createGain()

    const { dryLevel, wetLevel } = getReverbMixLevels(reverb)

    source.buffer = audioBuffer
    source.playbackRate.value = speed

    convolver.buffer = createImpulseResponse(offlineContext)

    dryGain.gain.value = dryLevel
    wetGain.gain.value = wetLevel

    source.connect(dryGain)
    dryGain.connect(offlineContext.destination)

    source.connect(convolver)
    convolver.connect(wetGain)

    wetGain.connect(offlineContext.destination)

    source.start(0)

    return offlineContext.startRendering()
}

const downloadBlob = (blob, fileName) => {
    const downloadUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = downloadUrl
    link.download = fileName

    document.body.appendChild(link)

    link.click()
    link.remove()

    window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl)
    }, 1000)
}

const createOutputFileName = (originalName) => {
    const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '')

    return `${nameWithoutExtension || 'audio'}(slowed+reverb).wav`
}

const exportAudioAsWav = async({audioFile, speed, reverb}) => {
    if (!audioFile) {
        throw new Error('Upload an audio file before downloading.')
    }

    const originalBuffer = await decodeAudioFile(audioFile)

    const renderedBuffer = await renderEditedAudio({
        audioBuffer: originalBuffer,
        speed,
        reverb
    })

    const wavBlob = encodeAudioBufferAsWav(renderedBuffer)
    const outputFileName = createOutputFileName(audioFile.name)
    downloadBlob(wavBlob, outputFileName)
}

export default exportAudioAsWav