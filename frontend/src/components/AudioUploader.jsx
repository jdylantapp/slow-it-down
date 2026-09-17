const AudioUploader = ({onFileSelect}) => {

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0]

        if (!selectedFile) {
            return
        }

        if (!selectedFile.type.startsWith('audio/')) {
            alert('Please upload an audio file')
            return
        }

        const extension = selectedFile.name.split('.').pop()?.toLowerCase()

        const supportedExtensions = [
            'mp3',
            'wav',
            'm4a',
            'aac',
        ]

        const hasSupportedExtension = supportedExtensions.includes(extension)

        const hasAudioMimeType = selectedFile.type.startsWith('audio/')

        if (!hasSupportedExtension && !hasAudioMimeType) {
            alert('Please upload an MP3, WAV, M4A, or AAC file.')
            event.target.value = ''
            return
        }

        onFileSelect(selectedFile)
    }

    return (
        <div className="upload-button">

            <label htmlFor="audio-file" className="upload-label">Upload Song</label>
            <input
            id="audio-file"
            type="file"
            accept=".mp3,.wav,.m4a,.aac,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac"
            onChange={handleFileChange}
            />
        </div>
    )

}

export default AudioUploader