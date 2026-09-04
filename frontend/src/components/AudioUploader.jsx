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

        onFileSelect(selectedFile)
    }

    return (
        <div className="upload-button">

            <label htmlFor="audio-file" className="upload-label">Upload Song</label>
            <input
            id="audio-file"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            />
        </div>
    )

}

export default AudioUploader