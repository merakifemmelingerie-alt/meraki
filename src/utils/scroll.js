/**
 * Elegant and slow custom smooth scroll to the top of the page using requestAnimationFrame.
 */
export function smoothScrollToTop(duration = 1200) {
    const start = window.scrollY;
    if (start === 0) return;
    
    const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

    // Cubic-bezier easing-out function for luxury look (very smooth finish)
    const easeOutCubic = (t) => (--t) * t * t + 1;

    function scroll() {
        const now = 'now' in window.performance ? performance.now() : new Date().getTime();
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        
        const easedProgress = easeOutCubic(progress);
        // behavior: 'instant' is required here — otherwise the global CSS
        // scroll-behavior: smooth makes the browser smooth each of these
        // per-frame jumps on top of the easing this function already does,
        // compounding into a much slower, laggier scroll than intended.
        window.scrollTo({ top: Math.ceil((1 - easedProgress) * start), behavior: 'instant' });

        if (window.scrollY > 0 && progress < 1) {
            requestAnimationFrame(scroll);
        }
    }
    
    requestAnimationFrame(scroll);
}
