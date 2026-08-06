/**
 * Resolves local assets paths correctly with Vite's configured base URL.
 * Automatically maps local static .jpg, .png, .jpeg assets to high-quality .webp.
 */
export function getAssetUrl(path) {
    if (!path) return `${import.meta.env.BASE_URL}placeholder.webp`
    
    const actualPath = Array.isArray(path) ? path[0] : path
    
    if (typeof actualPath !== 'string') {
        return `${import.meta.env.BASE_URL}placeholder.webp`
    }
    
    if (
        actualPath.startsWith('http://') || 
        actualPath.startsWith('https://') || 
        actualPath.startsWith('data:') ||
        actualPath.startsWith('blob:')
    ) {
        return actualPath
    }
    
    let cleanPath = actualPath.startsWith('/') ? actualPath.slice(1) : actualPath

    // Auto-map static local images (.png, .jpg, .jpeg) in assets/ or root placeholder to .webp
    if (cleanPath.startsWith('assets/') || cleanPath === 'placeholder.jpg') {
        cleanPath = cleanPath.replace(/\.(png|jpg|jpeg)$/i, '.webp')
    }

    return `${import.meta.env.BASE_URL}${cleanPath}`
}

/**
 * Checks if a given media URL is a video file (.mp4, .webm, .mov, data:video, etc.)
 */
export function isMediaVideo(url) {
    if (!url) return false
    const actualPath = Array.isArray(url) ? url[0] : url
    if (typeof actualPath !== 'string') return false
    
    const lower = actualPath.toLowerCase()
    return (
        lower.endsWith('.mp4') ||
        lower.endsWith('.webm') ||
        lower.endsWith('.mov') ||
        lower.endsWith('.ogg') ||
        lower.includes('data:video/') ||
        lower.includes('.mp4?') ||
        lower.includes('.webm?')
    )
}

/**
 * Automatically converts any uploaded image file (PNG, JPG, JPEG) to WebP format in the browser
 * before uploading, maintaining crystal-clear quality (90%) while dramatically reducing file size.
 */
export async function convertToWebP(file, quality = 0.90) {
    if (!file || !(file instanceof Blob) || !file.type || !file.type.startsWith('image/')) {
        return file
    }

    // Already webp
    if (file.type === 'image/webp') {
        return file
    }

    return new Promise((resolve) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(url)
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file)
                        return
                    }
                    const origName = file.name || 'image'
                    const cleanName = origName.replace(/\.[^/.]+$/, '') + '.webp'
                    const webpFile = new File([blob], cleanName, {
                        type: 'image/webp',
                        lastModified: Date.now()
                    })
                    resolve(webpFile)
                },
                'image/webp',
                quality
            )
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            resolve(file)
        }

        img.src = url
    })
}
