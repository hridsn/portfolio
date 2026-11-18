(function () {
    var CYCLE_DURATION = 3000; // 3s per full heart + favicon cycle
    var startTime = performance.now();

    function initLoader() {
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', initLoader);
            return;
        }

        var loader = document.getElementById('page-loader');
        if (!loader) return;

        function hideLoader() {
            loader.classList.add('loader-hidden');
            loader.addEventListener('transitionend', function () {
                if (loader.parentNode) loader.parentNode.removeChild(loader);
            }, { once: true });
        }

        function triggerCleanHide() {
            var elapsed = performance.now() - startTime;
            // Complete current 3s cycle before hiding so it ends cleanly
            var remainder = CYCLE_DURATION - (elapsed % CYCLE_DURATION);
            
            // If we're right at the cycle boundary (< 80ms left), let it roll to next or fade immediately
            if (remainder < 80) {
                hideLoader();
            } else {
                setTimeout(hideLoader, remainder);
            }
        }

        if (document.readyState === 'complete') {
            triggerCleanHide();
        } else {
            window.addEventListener('load', triggerCleanHide);
            // Safety timeout: never block indefinitely
            setTimeout(hideLoader, 10000);
        }
    }

    initLoader();
})();
