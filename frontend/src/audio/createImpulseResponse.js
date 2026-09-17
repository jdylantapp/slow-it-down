export const REVERB_DURATION = 3
export const REVERB_DECAY = 2.5

export const getReverbMixLevels = (reverb) => {
    const wetAmount = Math.min(1, Math.max(0, reverb))

    return {
        dryLevel: Math.cos(wetAmount * Math.PI * 0.5),
        wetLevel: Math.sin(wetAmount * Math.PI * 0.5)
    }
}

const createImpulseResponse = (
    audioContext,
    duration = REVERB_DURATION,
    decay = REVERB_DECAY,
    seed = 123456789
) => {
    const sampleRate = audioContext.sampleRate
    const length = Math.floor(sampleRate * duration)

    let randomState = seed >>> 0

    const getRandomValue = () => {
        randomState = (1664525 * randomState + 1013904223) >>> 0
        return randomState / 4294967296
    }

    const impulseResponse = audioContext.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < impulseResponse.numberOfChannels; channel += 1) {
        const channelData = impulseResponse.getChannelData(channel)

        for (let sample = 0; sample < length; sample += 1) {
            const noise = getRandomValue() * 2 - 1
            const remaining = 1 - sample/length
            const envelope = Math.pow(remaining, decay)

            channelData[sample] = noise * envelope
        }
    }

    return impulseResponse

}

export default createImpulseResponse