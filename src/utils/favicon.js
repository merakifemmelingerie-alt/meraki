export function applyTransparentButterflyFavicon() {
    if (typeof window === 'undefined') return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/assets/borboleta-v2.webp'

    img.onload = () => {
        try {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            ctx.drawImage(img, 0, 0)
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imgData.data

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i]
                const g = data[i + 1]
                const b = data[i + 2]
                // Make white and near-white pixels completely transparent
                if (r > 185 && g > 185 && b > 185) {
                    data[i + 3] = 0
                }
            }

            ctx.putImageData(imgData, 0, 0)
            const transparentDataUrl = canvas.toDataURL('image/png')

            // Update all favicon links in head
            const iconLinks = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']")
            iconLinks.forEach(link => {
                link.href = transparentDataUrl
            })

            // If no icon link exists, create one
            if (iconLinks.length === 0) {
                const link = document.createElement('link')
                link.rel = 'icon'
                link.type = 'image/png'
                link.href = transparentDataUrl
                document.head.appendChild(link)
            }
        } catch (e) {
            console.error('Error applying transparent butterfly favicon:', e)
        }
    }
}
