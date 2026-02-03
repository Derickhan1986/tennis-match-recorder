/**
 * Insufficient credits modal – reusable popup for credit-related prompts.
 * Call showInsufficientCreditsModal() from anywhere (e.g. app.js, settings).
 */
(function() {
    'use strict';

    function escapeHtml(text) {
        if (text == null) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show the "Insufficient credits" modal. Email and feedback link are configurable via options.
     * @param {object} [options] - Optional overrides: { email, feedbackUrl, feedbackLabel }
     */
    function showInsufficientCreditsModal(options) {
        options = options || {};
        var email = options.email || 'donghan1986@icloud.com';
        var feedbackUrl = options.feedbackUrl || 'https://buymeacoffee.com/tennismatchrecorder';
        var feedbackLabel = options.feedbackLabel != null ? options.feedbackLabel : 'Buy me a coffee';

        var msgBefore = 'You don\'t have enough credits. During the test period, contact ';
        var msgAfter = ' for a free top-up. The creator covers operating costs during the test period; this function uses paid API, so please use sparingly. Your feedback helps improve the app—leave yours at ';

        var overlay = document.createElement('div');
        overlay.className = 'modal';
        overlay.setAttribute('aria-label', 'Credit insufficient');
        var content = document.createElement('div');
        content.className = 'modal-content';
        content.innerHTML =
            '<div class="modal-header">' +
            '<h3>Insufficient credits</h3>' +
            '<button type="button" class="modal-close" aria-label="Close">&times;</button>' +
            '</div>' +
            '<div class="modal-body" style="line-height: 1.6;">' +
            '<p style="margin-bottom: 12px;">' + escapeHtml(msgBefore) + '<strong>' + escapeHtml(email) + '</strong>' + escapeHtml(msgAfter) +
            '<a href="' + escapeHtml(feedbackUrl) + '" target="_blank" rel="noopener noreferrer" style="color: #1a472a; font-weight: 600;">' + escapeHtml(feedbackLabel) + '</a>.</p>' +
            '<div class="form-actions" style="margin-top: 16px;">' +
            '<a href="mailto:' + escapeHtml(email) + '" class="btn-primary" style="text-decoration: none; display: inline-block; text-align: center;">Contact for top-up</a>' +
            '<button type="button" class="btn-secondary modal-close-btn">Close</button>' +
            '</div>' +
            '</div>';
        overlay.appendChild(content);

        function close() {
            overlay.classList.add('hidden');
            setTimeout(function() {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 300);
        }

        var closeBtn = content.querySelector('.modal-close');
        var closeBtnSecondary = content.querySelector('.modal-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', close);
        if (closeBtnSecondary) closeBtnSecondary.addEventListener('click', close);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) close();
        });

        document.body.appendChild(overlay);
    }

    if (typeof window !== 'undefined') {
        window.showInsufficientCreditsModal = showInsufficientCreditsModal;
    }
})();
