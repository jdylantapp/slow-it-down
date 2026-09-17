const createImpulseResponse = (
    audioContext,
    duration = 3,
    decay = 2.5
) => {
    const sampleRate = audioContext.sampleRate
    const length = Math.floor(sampleRate * duration)

    const impulseResponse = audioContext.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < impulseResponse.numberOfChannels; channel += 1) {
        const channelData = impulseResponse.getChannelData(channel)

        for (let sample = 0; sample < length; sample += 1) {
            const noise = Math.random() * 2 - 1
            const remaining = 1 - sample/length
            const envelope = Math.pow(remaining, decay)

            channelData[sample] = noise * envelope
        }
    }

    return impulseResponse

}

export default createImpulseResponse