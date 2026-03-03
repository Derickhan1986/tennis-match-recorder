/**
 * Performance orientation lock tip modal.
 * Shown before starting a performance match or opening Recap Performance.
 * Exposes window.showPerformanceOrientationTipModal().
 */
(function () {
    'use strict';

    async function showPerformanceOrientationTipModal() {
        return new Promise(function (resolve) {
            const modal = document.getElementById('performance-orientation-modal');
            if (!modal) {
                resolve();
                return;
            }
            const okBtn = document.getElementById('performance-orientation-ok');
            const closeBtn = document.getElementById('performance-orientation-close');
            function finish() {
                modal.classList.add('hidden');
                resolve();
            }
            // Add fresh listeners each time (use { once: true }) so the current promise resolves.
            // Previous handlers resolved a different promise; without this, Recap flow would hang.
            if (okBtn) okBtn.addEventListener('click', finish, { once: true });
            if (closeBtn) closeBtn.addEventListener('click', finish, { once: true });
            modal.classList.remove('hidden');
        });
    }

    window.showPerformanceOrientationTipModal = showPerformanceOrientationTipModal;
})();
