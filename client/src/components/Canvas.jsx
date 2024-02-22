import { useRef, useEffect } from 'react';



const Canvas = (props) => {
    const canvasRef = useRef(null);
    
    return (
        <canvas ref={canvasRef} width={props.width} height={props.height}></canvas>
    )
}

export default Canvas;