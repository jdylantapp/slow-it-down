const SpeedControl = ({speed, onSpeedChange}) => {
    return (
        <div className='effect-control'>
                <div className='effect-label'>
                    <label htmlFor='speed'>Speed: </label>
                    <span>{speed.toFixed(2)}x</span>
                </div>
                <input
                    id='speed'
                    className='effect-slider'
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

export default SpeedControl