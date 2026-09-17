const ReverbControl = ({reverb, onReverbChange}) => {
    return (
        <div className="effect-control">
            <div className="effect-label">
                <label htmlFor="reverb">Reverb: </label>
                <span>{Math.round(reverb * 100)}%</span>
            </div>

            <input
            id="reverb"
            className="effect-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={reverb}
            onChange={onReverbChange}
            />

        </div>
    )
}

export default ReverbControl