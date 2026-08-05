import { useEffect } from 'react'

/**
 * Helper to dispatch Meta Pixel events safely
 */
export function trackMetaEvent(eventName, data = {}) {
    if (typeof window !== 'undefined' && window.fbq) {
        try {
            window.fbq('track', eventName, data)
        } catch (e) {
            console.warn('[MetaPixel Error]', e)
        }
    }
}

/**
 * Helper to dispatch Google Analytics events safely
 */
export function trackGAEvent(eventName, data = {}) {
    if (typeof window !== 'undefined' && window.gtag) {
        try {
            window.gtag('event', eventName, data)
        } catch (e) {
            console.warn('[GA4 Error]', e)
        }
    }
}

export function trackAddToCart(item) {
    trackMetaEvent('AddToCart', {
        content_name: item.title || item.name,
        content_ids: [item.id],
        content_type: 'product',
        value: item.price,
        currency: 'BRL'
    })
    trackGAEvent('add_to_cart', {
        currency: 'BRL',
        value: item.price,
        items: [{ item_id: item.id, item_name: item.title || item.name, price: item.price }]
    })
}

export function trackInitiateCheckout(cart, total) {
    trackMetaEvent('InitiateCheckout', {
        num_items: cart.length,
        value: total,
        currency: 'BRL'
    })
    trackGAEvent('begin_checkout', {
        currency: 'BRL',
        value: total,
        items: cart.map(i => ({ item_id: i.id, item_name: i.title || i.name, price: i.price, quantity: i.quantity }))
    })
}

export function trackPurchase(order) {
    trackMetaEvent('Purchase', {
        value: order.total,
        currency: 'BRL',
        content_type: 'product',
        content_ids: order.items?.map(i => i.id) || []
    })
    trackGAEvent('purchase', {
        transaction_id: order.id,
        value: order.total,
        currency: 'BRL',
        items: order.items?.map(i => ({ item_id: i.id, item_name: i.title || i.name, price: i.price, quantity: i.quantity })) || []
    })
}

export default function TrackingManager() {
    useEffect(() => {
        try {
            if (!sessionStorage.getItem('meraki_visited_session')) {
                sessionStorage.setItem('meraki_visited_session', 'true')
                const visits = parseInt(localStorage.getItem('meraki_store_visits') || '0') + 1
                localStorage.setItem('meraki_store_visits', String(visits))
            }

            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            const pixelId = config.meta_pixel_id
            const gaId = config.ga_tracking_id

            // Inject Meta Pixel if configured and not already loaded
            if (pixelId && !window._fbq_loaded) {
                window._fbq_loaded = true
                /* eslint-disable */
                !(function(f,b,e,v,n,t,s) {
                    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)
                })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
                window.fbq('init', pixelId);
                window.fbq('track', 'PageView');
            }

            // Inject GA4 if configured and not already loaded
            if (gaId && !window._ga_loaded) {
                window._ga_loaded = true
                const script = document.createElement('script')
                script.async = true
                script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
                document.head.appendChild(script)

                window.dataLayer = window.dataLayer || []
                function gtag(){ window.dataLayer.push(arguments) }
                window.gtag = gtag
                gtag('js', new Date())
                gtag('config', gaId)
            }
        } catch (e) {
            console.warn('[TrackingManager Error]', e)
        }
    }, [])

    return null
}
