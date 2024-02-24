import { useRef, useEffect } from 'react';



const Canvas = (props) => {
    const { draw, forwardedRef, ...rest } = props
    //const canvasRef = useRef(null);
    
    
    
    useEffect(() => {
        const canvas = forwardedRef.current;
        const context = canvas.getContext('2d');
        draw(context);
    }, [draw]);


    return (
        <canvas ref={forwardedRef} {...rest}></canvas>
    )
}

export default Canvas;