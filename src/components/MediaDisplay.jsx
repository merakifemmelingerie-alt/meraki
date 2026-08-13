import React, { useEffect, useRef, useState } from 'react'
import { getAssetUrl, isMediaVideo } from '../utils/assets.js'

// Fades the <img> in once its bytes actually finish downloading, instead of
// the browser popping the fully-decoded image in abruptly the moment the
// network request completes. Checks `.complete` on mount/src-change so an
// already-cached image (whose 'load' event may fire before React attaches
// the listener) doesn't get stuck invisible.
function useImageLoaded(src) {
    const ref = useRef(null)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        setLoaded(ref.current?.complete || false)
    }, [src])

    return { ref, loaded, onLoad: () => setLoaded(true) }
}

export default function MediaDisplay({ src, alt = '', className = '', style = {}, loading = "lazy", decoding = "async", ...props }) {
    const resolvedSrc = (!src || typeof src !== 'string' || !src.trim()) ? getAssetUrl('/placeholder.jpg') : getAssetUrl(src)
    const { ref, loaded, onLoad } = useImageLoaded(resolvedSrc)

    if (src && typeof src === 'string' && isMediaVideo(src)) {
        return (
            <video
                src={getAssetUrl(src)}
                autoPlay
                loop
                muted
                playsInline
                className={className}
                style={style}
                {...props}
            />
        )
    }

    return (
        <img
            ref={ref}
            src={resolvedSrc}
            alt={alt}
            className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            style={style}
            loading={loading}
            decoding={decoding}
            onLoad={onLoad}
            onError={(e) => {
                e.target.onerror = null
                e.target.src = getAssetUrl('/placeholder.jpg')
                onLoad()
            }}
            {...props}
        />
    )
}
