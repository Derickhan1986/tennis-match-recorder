/**
 * Performance Recap modal – read-only replay of performance tracking shots.
 * Exposes window.showPerformanceRecapModal(matchId).
 */
(function () {
    'use strict';

    const VB_WIDTH = 270;
    const VB_HEIGHT = 470;

    function symbolToChar(symbol) {
        if (!symbol) return '';
        if (String(symbol).indexOf('square') !== -1) return '■';
        if (String(symbol).indexOf('circle') !== -1) return '●';
        if (String(symbol).indexOf('triangle') !== -1) return '▲';
        return '×';
    }

    function createMarkerEl(shot, dimmed) {
        const leftPct = (shot.x / VB_WIDTH) * 100;
        const topPct = (shot.y / VB_HEIGHT) * 100;
        const el = document.createElement('div');
        el.className = 'performance-court-marker';
        el.style.left = leftPct + '%';
        el.style.top = topPct + '%';
        if (dimmed) el.style.opacity = '0.3';
        const numEl = document.createElement('span');
        numEl.className = 'performance-court-marker-num';
        numEl.textContent = String(shot.index);
        el.appendChild(numEl);
        if (shot.symbol) {
            const symEl = document.createElement('span');
            symEl.className = 'performance-court-marker-symbol ' + shot.symbol;
            symEl.textContent = symbolToChar(shot.symbol);
            el.appendChild(symEl);
        }
        return el;
    }

    function showPerformanceRecapModal(matchId) {
        if (typeof storage === 'undefined' || !storage.getMatch) return;
        storage.getMatch(matchId).then(function (match) {
            if (!match || !match.log) return;
            const entries = match.log.filter(function (e) {
                return e.performanceShots && e.performanceShots.length > 0;
            });
            if (entries.length === 0) return;

            const player1Id = match.player1Id;
            const player2Id = match.player2Id;
            let player1Name = 'Player 1';
            let player2Name = 'Player 2';
            if (typeof storage !== 'undefined' && storage.getPlayer) {
                Promise.all([
                    storage.getPlayer(player1Id),
                    storage.getPlayer(player2Id)
                ]).then(function (players) {
                    if (players[0]) player1Name = players[0].name;
                    if (players[1]) player2Name = players[1].name;
                    renderModal();
                }).catch(function () { renderModal(); });
            } else {
                renderModal();
            }

            function renderModal() {
                let currentIndex = 0;
                let displayMode = 1;

                const overlay = document.createElement('div');
                overlay.className = 'modal performance-recap-modal';
                overlay.setAttribute('aria-label', 'Performance recap');

                const topRegion = document.createElement('div');
                topRegion.className = 'performance-recap-top';

                const midRegion = document.createElement('div');
                midRegion.className = 'performance-recap-middle';
                midRegion.innerHTML =
                    '<div class="performance-recap-court-wrap">' +
                    '<svg class="performance-full-court-svg" viewBox="0 0 270 470" aria-label="Full tennis court" xmlns="http://www.w3.org/2000/svg">' +
                    '<rect x="0" y="0" width="270" height="470" fill="#1a237e"/>' +
                    '<rect x="25" y="25" width="220" height="420" fill="#4a90e2" stroke="#fff" stroke-width="2"/>' +
                    '<line x1="50" y1="25" x2="50" y2="445" stroke="#fff" stroke-width="2"/>' +
                    '<line x1="220" y1="25" x2="220" y2="445" stroke="#fff" stroke-width="2"/>' +
                    '<line x1="50" y1="130" x2="220" y2="130" stroke="#fff" stroke-width="2"/>' +
                    '<line x1="50" y1="340" x2="220" y2="340" stroke="#fff" stroke-width="2"/>' +
                    '<line x1="135" y1="130" x2="135" y2="235" stroke="#fff" stroke-width="2"/>' +
                    '<line x1="135" y1="235" x2="135" y2="340" stroke="#fff" stroke-width="2"/>' +
                    '<line x1="12.5" y1="235" x2="257.5" y2="235" stroke="#fff" stroke-width="2"/>' +
                    '<circle cx="12.5" cy="235" r="3" fill="none" stroke="#fff" stroke-width="2"/>' +
                    '<circle cx="257.5" cy="235" r="3" fill="none" stroke="#fff" stroke-width="2"/>' +
                    '</svg>' +
                    '<div class="performance-court-markers performance-recap-markers" aria-hidden="true"></div>' +
                    '</div>';

                const botRegion = document.createElement('div');
                botRegion.className = 'performance-recap-bottom';
                const progressWrap = document.createElement('div');
                progressWrap.className = 'performance-recap-progress-wrap';
                const progressInput = document.createElement('input');
                progressInput.type = 'range';
                progressInput.min = 0;
                progressInput.max = Math.max(0, entries.length - 1);
                progressInput.value = 0;
                progressInput.className = 'performance-recap-progress';
                progressWrap.appendChild(progressInput);
                const btnWrap = document.createElement('div');
                btnWrap.className = 'performance-recap-buttons';
                const btnLeft = document.createElement('button');
                btnLeft.className = 'btn-secondary';
                btnLeft.textContent = '←';
                btnLeft.setAttribute('aria-label', 'Previous');
                const btnDisplay = document.createElement('button');
                btnDisplay.className = 'btn-secondary';
                btnDisplay.textContent = 'Display 1';
                const btnRight = document.createElement('button');
                btnRight.className = 'btn-secondary';
                btnRight.textContent = '→';
                btnRight.setAttribute('aria-label', 'Next');
                const btnClose = document.createElement('button');
                btnClose.className = 'btn-secondary';
                btnClose.textContent = 'Close';
                btnWrap.appendChild(btnLeft);
                btnWrap.appendChild(btnDisplay);
                btnWrap.appendChild(btnRight);
                btnWrap.appendChild(btnClose);
                botRegion.appendChild(progressWrap);
                botRegion.appendChild(btnWrap);

                overlay.appendChild(topRegion);
                overlay.appendChild(midRegion);
                overlay.appendChild(botRegion);
                document.body.appendChild(overlay);
                overlay.classList.remove('hidden');

                try {
                    if (typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.lock === 'function') {
                        screen.orientation.lock('portrait').catch(function () {});
                    }
                } catch (e) {}

                const markersEl = overlay.querySelector('.performance-recap-markers');
                const courtWrap = overlay.querySelector('.performance-recap-court-wrap');

                function formatEntryLine1(entry) {
                    const pName = entry.player === 'player1' ? player1Name : player2Name;
                    const action = entry.action || '';
                    const shotType = entry.shotType ? ' (' + entry.shotType + ')' : '';
                    return pName + ' ' + action + shotType;
                }

                function updateTopRegion() {
                    const entry = entries[currentIndex];
                    topRegion.innerHTML =
                        '<div class="performance-recap-line1">' + formatEntryLine1(entry) + '</div>' +
                        '<div class="performance-recap-line2">' + player1Name + ' vs ' + player2Name + '</div>' +
                        '<div class="performance-recap-line3">Score: ' + (entry.gameScore || '-') + ', Game: ' + (entry.gamesScore || '-') + ', Set: ' + (entry.setsScore || '-') + '</div>';
                }

                function getShotsToRender() {
                    if (displayMode === 1) {
                        return entries[currentIndex].performanceShots.map(function (s) {
                            return { shot: s, dimmed: false };
                        });
                    }
                    if (displayMode === 2) {
                        const out = [];
                        if (currentIndex > 0) {
                            entries[currentIndex - 1].performanceShots.forEach(function (s) {
                                out.push({ shot: s, dimmed: true });
                            });
                        }
                        entries[currentIndex].performanceShots.forEach(function (s) {
                            out.push({ shot: s, dimmed: false });
                        });
                        if (currentIndex < entries.length - 1) {
                            entries[currentIndex + 1].performanceShots.forEach(function (s) {
                                out.push({ shot: s, dimmed: true });
                            });
                        }
                        return out;
                    }
                    if (displayMode === 3) {
                        const out = [];
                        entries.forEach(function (e, i) {
                            const dimmed = i !== currentIndex;
                            (e.performanceShots || []).forEach(function (s) {
                                out.push({ shot: s, dimmed: dimmed });
                            });
                        });
                        return out;
                    }
                    return [];
                }

                function renderMarkers() {
                    if (!markersEl) return;
                    markersEl.textContent = '';
                    const items = getShotsToRender();
                    items.forEach(function (item) {
                        markersEl.appendChild(createMarkerEl(item.shot, item.dimmed));
                    });
                }

                function updateAll() {
                    updateTopRegion();
                    renderMarkers();
                    progressInput.value = currentIndex;
                    btnLeft.disabled = currentIndex === 0;
                    btnRight.disabled = currentIndex === entries.length - 1;
                    btnDisplay.textContent = 'Display ' + displayMode;
                }

                progressInput.addEventListener('input', function () {
                    currentIndex = parseInt(progressInput.value, 10) || 0;
                    currentIndex = Math.max(0, Math.min(entries.length - 1, currentIndex));
                    updateAll();
                });

                btnLeft.addEventListener('click', function () {
                    if (currentIndex > 0) {
                        currentIndex--;
                        updateAll();
                    }
                });

                btnRight.addEventListener('click', function () {
                    if (currentIndex < entries.length - 1) {
                        currentIndex++;
                        updateAll();
                    }
                });

                btnDisplay.addEventListener('click', function () {
                    displayMode = (displayMode % 3) + 1;
                    updateAll();
                });

                function closeModal() {
                    overlay.classList.add('hidden');
                    setTimeout(function () {
                        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    }, 300);
                    try {
                        if (typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.unlock === 'function') {
                            screen.orientation.unlock();
                        }
                    } catch (e) {}
                }

                btnClose.addEventListener('click', closeModal);

                overlay.addEventListener('click', function (ev) {
                    if (ev.target === overlay) closeModal();
                });

                updateAll();
            }
        }).catch(function () {});
    }

    window.showPerformanceRecapModal = showPerformanceRecapModal;
})();
