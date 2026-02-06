/**
 * Court zone picker – popup with tennis half-court; brown and green zones are clickable.
 * Usage: showCourtZonePicker({ onZoneClick: function(zoneId) { ... }, title: 'Pick zone' });
 */
(function() {
    'use strict';

    // Court logical size; canvas has margin SIDELINE_W on all sides.
    var COURT_W = 220;
    var COURT_H = 210;
    var SIDELINE_W = 25;
    // Canvas size and court origin (court 0,0 in canvas coordinates)
    var CANVAS_W = COURT_W + 2 * SIDELINE_W;
    var CANVAS_H = COURT_H + 2 * SIDELINE_W;
    var ORIGIN_X = SIDELINE_W;
    var ORIGIN_Y = SIDELINE_W;
    // Zone block: inset and rounded corners
    var ZONE_INSET = 1;
    var ZONE_RX = 3;

    // Inset polygon: move each edge inward by inset, then intersect to get new vertices (CCW points).
    function polygonInset(points, inset) {
        var n = points.length;
        if (n < 3) return points;
        var normals = [];
        for (var i = 0; i < n; i++) {
            var a = points[i];
            var b = points[(i + 1) % n];
            var dx = b[0] - a[0];
            var dy = b[1] - a[1];
            var len = Math.sqrt(dx * dx + dy * dy) || 1;
            normals.push([-dy / len * inset, dx / len * inset]);
        }
        var out = [];
        for (var j = 0; j < n; j++) {
            var prev = points[(j - 1 + n) % n];
            var curr = points[j];
            var next = points[(j + 1) % n];
            var nPrev = normals[(j - 1 + n) % n];
            var nCurr = normals[j];
            var p1 = [prev[0] + nPrev[0], prev[1] + nPrev[1]];
            var p2 = [curr[0] + nPrev[0], curr[1] + nPrev[1]];
            var p3 = [curr[0] + nCurr[0], curr[1] + nCurr[1]];
            var p4 = [next[0] + nCurr[0], next[1] + nCurr[1]];
            var d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
            if (Math.abs(d) < 1e-10) { out.push([curr[0] + nCurr[0], curr[1] + nCurr[1]]); continue; }
            var t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
            out.push([p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])]);
        }
        return out;
    }

    // Build SVG path for polygon with rounded corners (arc at each vertex).
    function roundedPolygonPath(points, radius) {
        var n = points.length;
        if (n < 2) return '';
        var r = Math.max(0, radius);
        var path = [];
        for (var i = 0; i < n; i++) {
            var prev = points[(i - 1 + n) % n];
            var curr = points[i];
            var next = points[(i + 1) % n];
            var dx1 = curr[0] - prev[0];
            var dy1 = curr[1] - prev[1];
            var len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
            var dx2 = next[0] - curr[0];
            var dy2 = next[1] - curr[1];
            var len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
            var trim = Math.min(r, len1 / 2, len2 / 2);
            var before = [curr[0] - (dx1 / len1) * trim, curr[1] - (dy1 / len1) * trim];
            var after = [curr[0] + (dx2 / len2) * trim, curr[1] + (dy2 / len2) * trim];
            if (i === 0) path.push('M ' + before[0] + ' ' + before[1]);
            else path.push('L ' + before[0] + ' ' + before[1]);
            if (trim > 0.01) path.push('Q ' + curr[0] + ' ' + curr[1] + ' ' + after[0] + ' ' + after[1]);
        }
        path.push('Z');
        return path.join(' ');
    }

    function mirrorRectX(z) {
        return { id: z.id, x: COURT_W - z.x - z.w, y: z.y, w: z.w, h: z.h };
    }
    function mirrorPointX(p) {
        return [COURT_W - p[0], p[1]];
    }

    function buildCourtSvg(mirrorZones, mode) {
        mode = mode || 'serve';
        var isReturn = mode === 'return';
        var isRally = mode === 'rally';
        var ns = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 ' + CANVAS_W + ' ' + CANVAS_H);
        svg.setAttribute('class', 'court-zone-svg');
        svg.setAttribute('aria-label', 'Tennis half court – click a zone');

        var ox = ORIGIN_X;
        var oy = ORIGIN_Y;

        // Canvas background (margin area)
        var bg = document.createElementNS(ns, 'rect');
        bg.setAttribute('x', 0);
        bg.setAttribute('y', 0);
        bg.setAttribute('width', CANVAS_W);
        bg.setAttribute('height', CANVAS_H);
        bg.setAttribute('fill', '#1a237e');
        svg.appendChild(bg);
        // Court area (blue), origin at (ox, oy), white boundary
        var courtBg = document.createElementNS(ns, 'rect');
        courtBg.setAttribute('x', ox);
        courtBg.setAttribute('y', oy);
        courtBg.setAttribute('width', COURT_W);
        courtBg.setAttribute('height', COURT_H);
        courtBg.setAttribute('fill', '#4a90e2');
        courtBg.setAttribute('stroke', '#fff');
        courtBg.setAttribute('stroke-width', 2);
        svg.appendChild(courtBg);

        // White lines (court coords + origin offset)
        var lineStyle = 'stroke:#fff; stroke-width:2; fill:none';
        var serviceLineY = COURT_H / 2;
        var centerX = COURT_W / 2;
        var boxThirdW = (COURT_W / 2 - SIDELINE_W) / 3;
        var boxUnitH = COURT_H / 8;
        // Net line (bottom), with circles at both ends
        var netLineX1 = ox - SIDELINE_W / 2;
        var netLineX2 = ox + COURT_W + SIDELINE_W / 2;
        var netLineY = oy + COURT_H;
        var netLine = document.createElementNS(ns, 'line');
        netLine.setAttribute('x1', netLineX1);
        netLine.setAttribute('y1', netLineY);
        netLine.setAttribute('x2', netLineX2);
        netLine.setAttribute('y2', netLineY);
        netLine.setAttribute('style', lineStyle);
        svg.appendChild(netLine);
        var netLineR = 3;
        var netLineEnd1 = document.createElementNS(ns, 'circle');
        netLineEnd1.setAttribute('cx', netLineX1);
        netLineEnd1.setAttribute('cy', netLineY);
        netLineEnd1.setAttribute('r', netLineR);
        netLineEnd1.setAttribute('fill', 'none');
        netLineEnd1.setAttribute('stroke', '#fff');
        netLineEnd1.setAttribute('stroke-width', 2);
        svg.appendChild(netLineEnd1);
        var netLineEnd2 = document.createElementNS(ns, 'circle');
        netLineEnd2.setAttribute('cx', netLineX2);
        netLineEnd2.setAttribute('cy', netLineY);
        netLineEnd2.setAttribute('r', netLineR);
        netLineEnd2.setAttribute('fill', 'none');
        netLineEnd2.setAttribute('stroke', '#fff');
        netLineEnd2.setAttribute('stroke-width', 2);
        svg.appendChild(netLineEnd2);
        // Left sideline
        var leftLine = document.createElementNS(ns, 'line');
        leftLine.setAttribute('x1', ox + SIDELINE_W);
        leftLine.setAttribute('y1', oy);
        leftLine.setAttribute('x2', ox + SIDELINE_W);
        leftLine.setAttribute('y2', oy + COURT_H);
        leftLine.setAttribute('style', lineStyle);
        svg.appendChild(leftLine);
        // Right sideline
        var rightLine = document.createElementNS(ns, 'line');
        rightLine.setAttribute('x1', ox + COURT_W - SIDELINE_W);
        rightLine.setAttribute('y1', oy);
        rightLine.setAttribute('x2', ox + COURT_W - SIDELINE_W);
        rightLine.setAttribute('y2', oy + COURT_H);
        rightLine.setAttribute('style', lineStyle);
        svg.appendChild(rightLine);
        // Service line
        var serviceLine = document.createElementNS(ns, 'line');
        serviceLine.setAttribute('x1', ox + SIDELINE_W);
        serviceLine.setAttribute('y1', oy + serviceLineY);
        serviceLine.setAttribute('x2', ox + COURT_W - SIDELINE_W);
        serviceLine.setAttribute('y2', oy + serviceLineY);
        serviceLine.setAttribute('style', lineStyle);
        svg.appendChild(serviceLine);
        // Center line
        var centerLine = document.createElementNS(ns, 'line');
        centerLine.setAttribute('x1', ox + centerX);
        centerLine.setAttribute('y1', oy + serviceLineY);
        centerLine.setAttribute('x2', ox + centerX);
        centerLine.setAttribute('y2', oy + COURT_H);
        centerLine.setAttribute('style', lineStyle);
        svg.appendChild(centerLine);

        // Brown/orange zones (court coords; mirror if Ad side for serve only)
        var brownZones;
        if (isRally) {
            // Rally: 10 brown – edit x,y,w,h. Three behind baseline; three along each doubles line; one net_down
            brownZones = [
                { id: 'long_deuce', x: 0, y: -SIDELINE_W, w: COURT_W/3, h: SIDELINE_W },
                { id: 'long_center', x: COURT_W/3, y: -SIDELINE_W, w: COURT_W/3, h: SIDELINE_W },
                { id: 'long_ad', x: COURT_W/3*2, y: -SIDELINE_W, w: COURT_W/3, h: SIDELINE_W },
                { id: 'deuce_deep_wide', x: 0, y: 0, w: SIDELINE_W, h: 3*boxUnitH },
                { id: 'deuce_short_wide', x: 0, y: 3*boxUnitH, w: SIDELINE_W, h: 2*boxUnitH },
                { id: 'deuce_close_net_wide', x: 0, y: 5*boxUnitH, w: SIDELINE_W, h: 3*boxUnitH },
                { id: 'ad_deep_wide', x: COURT_W - SIDELINE_W, y: 0, w: SIDELINE_W, h: 3*boxUnitH },
                { id: 'ad_short_wide', x: COURT_W - SIDELINE_W, y: 3*boxUnitH, w: SIDELINE_W, h: 2*boxUnitH },
                { id: 'ad_close_net_wide', x: COURT_W - SIDELINE_W, y: 5*boxUnitH, w: SIDELINE_W, h: 3*boxUnitH },
                { id: 'net_down', x: SIDELINE_W, y: COURT_H, w: COURT_W - 2 * SIDELINE_W, h: SIDELINE_W }
            ];
        } else if (isReturn) {
            // Return: 5 brown – edit x,y,w,h to match your layout
            brownZones = [
                { id: 'long_deuce', x: 0, y: -SIDELINE_W, w: COURT_W/2, h: SIDELINE_W },
                { id: 'long_ad', x: COURT_W/2, y: -SIDELINE_W, w: COURT_W/2, h: SIDELINE_W },
                { id: 'wide_deuce', x: 0, y: 0, w: SIDELINE_W, h: COURT_H},
                { id: 'wide_ad', x: COURT_W-SIDELINE_W, y: 0, w: SIDELINE_W, h: COURT_H},
                { id: 'net_down', x: SIDELINE_W, y: COURT_H, w: COURT_W - 2 * SIDELINE_W, h: SIDELINE_W }
            ];
        } else {
            brownZones = [
                { id: 'serve_long', x: 0, y: COURT_H / 2 - SIDELINE_W, w: COURT_W / 2 + SIDELINE_W, h: SIDELINE_W },
                { id: 'alley_wide', x: 0, y: COURT_H / 2, w: SIDELINE_W, h: COURT_H / 2 },
                { id: 'T_wide', x: COURT_W/2, y: COURT_H / 2, w: SIDELINE_W, h: COURT_H / 2 },
                { id: 'net_down', x: SIDELINE_W, y: COURT_H, w: COURT_W - 2 * SIDELINE_W, h: SIDELINE_W }
            ];
            if (mirrorZones) brownZones = brownZones.map(mirrorRectX);
        }
        var brownFill = '#c47532';
        brownZones.forEach(function(z) {
            var r = document.createElementNS(ns, 'rect');
            var dx = ox + z.x + ZONE_INSET;
            var dy = oy + z.y + ZONE_INSET;
            var dw = Math.max(0, z.w - 2 * ZONE_INSET);
            var dh = Math.max(0, z.h - 2 * ZONE_INSET);
            var rx = Math.min(ZONE_RX, dw / 2, dh / 2);
            r.setAttribute('x', dx);
            r.setAttribute('y', dy);
            r.setAttribute('width', dw);
            r.setAttribute('height', dh);
            r.setAttribute('rx', rx);
            r.setAttribute('ry', rx);
            r.setAttribute('fill', brownFill);
            r.setAttribute('data-zone-id', z.id);
            r.setAttribute('class', 'court-zone court-zone-brown');
            r.setAttribute('role', 'button');
            r.setAttribute('tabindex', '0');
            svg.appendChild(r);
        });

        // "NET" label in net_down (court: SIDELINE_W, COURT_H, w: COURT_W-2*SIDELINE_W, h: SIDELINE_W)
        var netStripCenterX = ox + SIDELINE_W + (COURT_W - 2 * SIDELINE_W) / 2;
        var netStripCenterY = oy + COURT_H + SIDELINE_W / 2;
        var netLabel = document.createElementNS(ns, 'text');
        netLabel.setAttribute('x', netStripCenterX);
        netLabel.setAttribute('y', netStripCenterY);
        netLabel.setAttribute('text-anchor', 'middle');
        netLabel.setAttribute('dominant-baseline', 'middle');
        netLabel.setAttribute('fill', '#fff');
        netLabel.setAttribute('font-size', 12);
        netLabel.setAttribute('font-weight', 'bold');
        netLabel.setAttribute('font-family', 'sans-serif');
        netLabel.setAttribute('pointer-events', 'none');
        netLabel.textContent = 'NET';
        svg.appendChild(netLabel);

        // Green zones – rally: 11 rects; return: 7 rects; serve: 3 rects + box_rest polygon
        var greenZones;
        if (isRally) {
            // Rally: 11 green – edit x,y,w,h. Three deep; three deuce side; three ad side; net_drop; neutral
            greenZones = [
                { id: 'deuce_deep', x: SIDELINE_W, y: 0, w: COURT_W/3-SIDELINE_W, h: boxUnitH },
                { id: 'center_deep', x: COURT_W/3, y: 0, w: COURT_W/3, h: boxUnitH },
                { id: 'ad_deep', x: COURT_W/3*2, y: 0, w: COURT_W/3-SIDELINE_W, h: boxUnitH },
                { id: 'deuce_neutral', x: SIDELINE_W, y: boxUnitH, w: (COURT_W/3-SIDELINE_W)*0.8, h: 2*boxUnitH },
                { id: 'deuce_short', x: SIDELINE_W, y: 3*boxUnitH, w: (COURT_W/3-SIDELINE_W)*0.8, h: 2*boxUnitH },
                { id: 'deuce_drop', x: SIDELINE_W, y: 5*boxUnitH, w: (COURT_W/3-SIDELINE_W)*0.8, h: 3*boxUnitH },
                { id: 'ad_neutral', x: COURT_W-SIDELINE_W-(COURT_W/3-SIDELINE_W)*0.8, y: boxUnitH, w: (COURT_W/3-SIDELINE_W)*0.8, h: 2*boxUnitH },
                { id: 'ad_short', x: COURT_W-SIDELINE_W-(COURT_W/3-SIDELINE_W)*0.8, y: 3*boxUnitH, w: (COURT_W/3-SIDELINE_W)*0.8, h: 2*boxUnitH },
                { id: 'ad_drop', x: COURT_W-SIDELINE_W-(COURT_W/3-SIDELINE_W)*0.8, y: 5*boxUnitH, w: (COURT_W/3-SIDELINE_W)*0.8, h: 3*boxUnitH },
                { id: 'center_drop', x: SIDELINE_W + (COURT_W/3-SIDELINE_W)*0.8, y: 6*boxUnitH, w: COURT_W-2*SIDELINE_W-(COURT_W/3-SIDELINE_W)*1.6, h: 2*boxUnitH },
                { id: 'center_neutral', x: SIDELINE_W + (COURT_W/3-SIDELINE_W)*0.8, y: boxUnitH, w: COURT_W-2*SIDELINE_W-(COURT_W/3-SIDELINE_W)*1.6, h: 5*boxUnitH }
            ];
        } else if (isReturn) {
            // Return: 7 green – edit x,y,w,h to match your layout
            greenZones = [
                { id: 'deep_deuce', x: SIDELINE_W, y: 0, w: COURT_W / 2 - SIDELINE_W, h: 1.5*boxUnitH },
                { id: 'deep_ad', x: COURT_W/2, y: 0, w: COURT_W / 2 - SIDELINE_W, h: 1.5*boxUnitH },
                { id: 'short_deuce', x: SIDELINE_W, y: 1.5*boxUnitH, w: boxThirdW*2, h: 5*boxUnitH },
                { id: 'short_center', x: centerX - boxThirdW, y: 1.5*boxUnitH, w: boxThirdW*2, h: 5*boxUnitH },
                { id: 'short_ad', x: centerX + boxThirdW, y: 1.5*boxUnitH, w: boxThirdW*2, h: 5*boxUnitH },
                { id: 'drop_deuce', x: SIDELINE_W, y: 1.5*boxUnitH + 5*boxUnitH, w: boxThirdW*3, h: 1.5*boxUnitH },
                { id: 'drop_ad', x: COURT_W / 2, y: 1.5*boxUnitH + 5*boxUnitH, w: boxThirdW*3, h: 1.5*boxUnitH }
            ];
        } else {
            greenZones = [
                { id: 'box_center', x: SIDELINE_W + boxThirdW, y: serviceLineY, w: boxThirdW, h: boxUnitH },
                { id: 'box_corner', x: SIDELINE_W, y: serviceLineY, w: boxThirdW, h: boxUnitH * 3 },
                { id: 'box_T', x: centerX - boxThirdW, y: serviceLineY, w: boxThirdW, h: boxUnitH * 2 }
            ];
            if (mirrorZones) greenZones = greenZones.map(mirrorRectX);
        }
        var greenFill = '#2d5a3d';
        greenZones.forEach(function(z) {
            var r = document.createElementNS(ns, 'rect');
            var dx = ox + z.x + ZONE_INSET;
            var dy = oy + z.y + ZONE_INSET;
            var dw = Math.max(0, z.w - 2 * ZONE_INSET);
            var dh = Math.max(0, z.h - 2 * ZONE_INSET);
            var rx = Math.min(ZONE_RX, dw / 2, dh / 2);
            r.setAttribute('x', dx);
            r.setAttribute('y', dy);
            r.setAttribute('width', dw);
            r.setAttribute('height', dh);
            r.setAttribute('rx', rx);
            r.setAttribute('ry', rx);
            r.setAttribute('fill', greenFill);
            r.setAttribute('data-zone-id', z.id);
            r.setAttribute('class', 'court-zone court-zone-green');
            r.setAttribute('role', 'button');
            r.setAttribute('tabindex', '0');
            svg.appendChild(r);
        });

        if (isReturn || isRally) {
            return svg;
        }

        // box_rest: convex 8-point polygon (serve only), mirror if Ad side, then inset and rounded
        var boxRestPoints = [
            [SIDELINE_W, COURT_H],
            [SIDELINE_W, COURT_H - boxUnitH],
            [SIDELINE_W + boxThirdW, COURT_H - boxUnitH],
            [SIDELINE_W + boxThirdW, serviceLineY + boxUnitH],
            [COURT_W / 2 - boxThirdW, COURT_H / 2 + boxUnitH],
            [COURT_W / 2 - boxThirdW, COURT_H / 2 + 2 * boxUnitH],
            [COURT_W / 2, COURT_H / 2 + 2 * boxUnitH],
            [COURT_W / 2, COURT_H]
        ];
        if (mirrorZones) {
            boxRestPoints = boxRestPoints.map(mirrorPointX).reverse();
        }
        var boxRestInset = polygonInset(boxRestPoints, ZONE_INSET);
        var boxRestInsetCanvas = boxRestInset.map(function(p) { return [p[0] + ox, p[1] + oy]; });
        var boxRestPath = roundedPolygonPath(boxRestInsetCanvas, ZONE_RX);
        var boxRestPathEl = document.createElementNS(ns, 'path');
        boxRestPathEl.setAttribute('d', boxRestPath);
        boxRestPathEl.setAttribute('fill', greenFill);
        boxRestPathEl.setAttribute('data-zone-id', 'box_rest');
        boxRestPathEl.setAttribute('class', 'court-zone court-zone-green');
        boxRestPathEl.setAttribute('role', 'button');
        boxRestPathEl.setAttribute('tabindex', '0');
        svg.appendChild(boxRestPathEl);

        return svg;
    }

    /**
     * Get canvas coordinates (x, y) of the center of each serve zone for stats overlay.
     * @param {boolean} mirrorZones - Same as buildCourtSvg (false = Deuce, true = Ad).
     * @returns {Object.<string, [number, number]>} zoneId -> [canvasX, canvasY]
     */
    function getServeZoneCenters(mirrorZones) {
        var serviceLineY = COURT_H / 2;
        var centerX = COURT_W / 2;
        var boxThirdW = (COURT_W / 2 - SIDELINE_W) / 3;
        var boxUnitH = COURT_H / 8;
        var ox = ORIGIN_X;
        var oy = ORIGIN_Y;

        var brownZones = [
            { id: 'serve_long', x: 0, y: COURT_H / 2 - SIDELINE_W, w: COURT_W / 2 + SIDELINE_W, h: SIDELINE_W },
            { id: 'alley_wide', x: 0, y: COURT_H / 2, w: SIDELINE_W, h: COURT_H / 2 },
            { id: 'T_wide', x: COURT_W / 2, y: COURT_H / 2, w: SIDELINE_W, h: COURT_H / 2 },
            { id: 'net_down', x: SIDELINE_W, y: COURT_H, w: COURT_W - 2 * SIDELINE_W, h: SIDELINE_W }
        ];
        if (mirrorZones) brownZones = brownZones.map(mirrorRectX);

        var greenZones = [
            { id: 'box_center', x: SIDELINE_W + boxThirdW, y: serviceLineY, w: boxThirdW, h: boxUnitH },
            { id: 'box_corner', x: SIDELINE_W, y: serviceLineY, w: boxThirdW, h: boxUnitH * 3 },
            { id: 'box_T', x: centerX - boxThirdW, y: serviceLineY, w: boxThirdW, h: boxUnitH * 2 }
        ];
        if (mirrorZones) greenZones = greenZones.map(mirrorRectX);

        var boxRestPoints = [
            [SIDELINE_W, COURT_H],
            [SIDELINE_W, COURT_H - boxUnitH],
            [SIDELINE_W + boxThirdW, COURT_H - boxUnitH],
            [SIDELINE_W + boxThirdW, serviceLineY + boxUnitH],
            [COURT_W / 2 - boxThirdW, COURT_H / 2 + boxUnitH],
            [COURT_W / 2 - boxThirdW, COURT_H / 2 + 2 * boxUnitH],
            [COURT_W / 2, COURT_H / 2 + 2 * boxUnitH],
            [COURT_W / 2, COURT_H]
        ];
        if (mirrorZones) {
            boxRestPoints = boxRestPoints.map(mirrorPointX).reverse();
        }

        var centers = {};
        brownZones.forEach(function(z) {
            centers[z.id] = [ox + z.x + z.w / 2, oy + z.y + z.h / 2];
        });
        greenZones.forEach(function(z) {
            centers[z.id] = [ox + z.x + z.w / 2, oy + z.y + z.h / 2];
        });
        var n = boxRestPoints.length;
        var cx = 0;
        var cy = 0;
        for (var i = 0; i < n; i++) {
            cx += boxRestPoints[i][0];
            cy += boxRestPoints[i][1];
        }
        centers.box_rest = [ox + cx / n, oy + cy / n];

        return centers;
    }

    /**
     * Build serve court SVG for statistics display: same layout as picker, with optional percentage text in each zone.
     * @param {boolean} mirrorZones - false = Deuce side, true = Ad side.
     * @param {Object.<string, string>} zonePercentMap - zoneId -> percentage string (e.g. "12.5%"). Only zones with an entry get a label.
     * @returns {SVGSVGElement}
     */
    function buildServeCourtSvgForStats(mirrorZones, zonePercentMap) {
        var svg = buildCourtSvg(mirrorZones, 'serve');
        svg.setAttribute('aria-label', 'Serve zone statistics court');
        // Remove the standalone "NET" label; net_down will show "NET x%" when it has data
        var texts = svg.querySelectorAll('text');
        for (var i = 0; i < texts.length; i++) {
            if (texts[i].textContent === 'NET') {
                svg.removeChild(texts[i]);
                break;
            }
        }
        zonePercentMap = zonePercentMap || {};
        var centers = getServeZoneCenters(mirrorZones);
        var ns = 'http://www.w3.org/2000/svg';

        Object.keys(centers).forEach(function(zoneId) {
            var label = zonePercentMap[zoneId];
            if (label == null || label === '') return;
            var displayText = zoneId === 'net_down' ? 'NET ' + label : label;
            var xy = centers[zoneId];
            var text = document.createElementNS(ns, 'text');
            text.setAttribute('x', xy[0]);
            text.setAttribute('y', xy[1]);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', '#fff');
            text.setAttribute('font-size', 8);
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('font-family', 'sans-serif');
            text.setAttribute('pointer-events', 'none');
            text.textContent = displayText;
            svg.appendChild(text);
        });

        return svg;
    }

    /**
     * Show the court zone picker modal.
     * @param {object} [options]
     * @param {function(string)} [options.onZoneClick] - Called with zoneId when a zone is clicked.
     * @param {string} [options.title] - Modal title (default: 'Court zone').
     * @param {boolean} [options.closeOnClick] - If true, close modal when a zone is clicked (default: true).
     * @param {boolean} [options.mirrorZones] - If true, mirror brown/green zones horizontally (for Ad side serve).
     * @returns {Promise<string|null>} Resolves with the clicked zoneId when user clicks a zone, or null when closed without selecting.
     */
    function showCourtZonePicker(options) {
        options = options || {};
        var onZoneClick = options.onZoneClick || function() {};
        var title = options.title != null ? options.title : 'Court zone';
        var closeOnClick = options.closeOnClick !== false;
        var requireZoneSelection = options.requireZoneSelection === true;

        var resolvePromise;
        var promise = new Promise(function(resolve) { resolvePromise = resolve; });
        var settled = false;
        function settle(zoneId) {
            if (settled) return;
            settled = true;
            resolvePromise(zoneId);
        }

        // Remove any existing picker modal so only one is visible (avoids second serve picker not closing)
        var existing = document.querySelectorAll('.modal.court-zone-picker-modal');
        for (var i = 0; i < existing.length; i++) {
            if (existing[i].parentNode) existing[i].parentNode.removeChild(existing[i]);
        }

        var overlay = document.createElement('div');
        overlay.className = 'modal court-zone-picker-modal';
        overlay.setAttribute('aria-label', title);

        var content = document.createElement('div');
        content.className = 'modal-content court-zone-picker-content';

        content.innerHTML =
            '<div class="modal-header">' +
            '<h3>' + title.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</h3>' +
            (requireZoneSelection ? '' : '<button type="button" class="modal-close" aria-label="Close">&times;</button>') +
            '</div>' +
            '<div class="modal-body court-zone-picker-body"></div>';

        var body = content.querySelector('.court-zone-picker-body');
        var mirrorZones = options.mirrorZones === true;
        var mode = options.mode === 'return' ? 'return' : options.mode === 'rally' ? 'rally' : 'serve';
        var svg = buildCourtSvg(mirrorZones, mode);
        body.appendChild(svg);

        function close(zoneId) {
            overlay.classList.add('hidden');
            setTimeout(function() {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 300);
            if (zoneId === undefined) settle(null);
        }

        function handleZoneClick(zoneId) {
            close(zoneId);
            onZoneClick(zoneId);
            settle(zoneId);
        }

        function askSelectZone() {
            if (typeof window.app !== 'undefined' && window.app.showToast) {
                window.app.showToast('Please select a zone (brown or green)', 'info');
            }
        }

        svg.addEventListener('click', function(e) {
            var target = e.target;
            if (target.getAttribute && target.getAttribute('data-zone-id')) {
                handleZoneClick(target.getAttribute('data-zone-id'));
            }
        });

        svg.addEventListener('keydown', function(e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var target = e.target;
            if (target.getAttribute && target.getAttribute('data-zone-id')) {
                e.preventDefault();
                handleZoneClick(target.getAttribute('data-zone-id'));
            }
        });

        var closeBtn = content.querySelector('.modal-close');
        if (closeBtn) closeBtn.addEventListener('click', function() { requireZoneSelection ? askSelectZone() : close(); });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                if (requireZoneSelection) askSelectZone(); else close();
            }
        });

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        return promise;
    }

    /**
     * Serve tracking (deuce side serve): open court zone picker for selecting serve landing zone.
     * @param {function(string)} [onZoneClick] - Called with zoneId when a zone is clicked.
     * @param {object} [options] - Optional overrides: { title, closeOnClick, serveNumber }. serveNumber: 1 = First Serve, 2 = Second Serve.
     * @returns {Promise<string|null>} Resolves with the clicked zoneId, or null when closed without selecting.
     */
    function showServeTrackingPicker(onZoneClick, options) {
        options = options || {};
        if (typeof onZoneClick === 'function') options.onZoneClick = onZoneClick;
        if (options.title == null) {
            var serveLabel = (options.serveNumber === 2) ? 'Second Serve' : 'First Serve';
            options.title = 'Deuce side – ' + serveLabel;
        }
        return showCourtZonePicker(options);
    }

    /**
     * Ad side serve: same as Deuce side but with mirrored brown/green zones.
     * @param {function(string)} [onZoneClick] - Called with zoneId when a zone is clicked.
     * @param {object} [options] - Optional overrides: { title, closeOnClick, serveNumber }.
     * @returns {Promise<string|null>} Resolves with the clicked zoneId, or null when closed without selecting.
     */
    function showAdSideServePicker(onZoneClick, options) {
        options = options || {};
        if (typeof onZoneClick === 'function') options.onZoneClick = onZoneClick;
        if (options.title == null) {
            var serveLabel = (options.serveNumber === 2) ? 'Second Serve' : 'First Serve';
            options.title = 'Ad side – ' + serveLabel;
        }
        options.mirrorZones = true;
        return showCourtZonePicker(options);
    }

    /**
     * Return zone picker: same court, 5 brown (long_deuce, long_ad, wide_deuce, wide_ad, net_down) + 7 green (deep_deuce, deep_ad, short_deuce, short_center, short_ad, drop_deuce, drop_ad). Edit coords in buildCourtSvg return branch.
     * @param {function(string)} [onZoneClick] - Called with zoneId when a zone is clicked.
     * @param {object} [options] - Optional overrides: { title, closeOnClick }.
     * @returns {Promise<string|null>} Resolves with the clicked zoneId, or null when closed without selecting.
     */
    function showReturnZonePicker(onZoneClick, options) {
        options = options || {};
        if (typeof onZoneClick === 'function') options.onZoneClick = onZoneClick;
        if (options.title == null) options.title = 'Return';
        options.mode = 'return';
        return showCourtZonePicker(options);
    }

    /**
     * Rally zone picker: same court, 10 brown (long_deuce, long_center, long_ad, deuce_deep_wide, deuce_short_wide, deuce_close_net_wide, ad_deep_wide, ad_short_wide, ad_close_net_wide, net_down) + 11 green (deuce_deep, deuce_center, deuce_ad, deuce_neutral, deuce_short, deuce_drop, ad_neutral, ad_short, ad_drop, net_drop, neutral). Edit coords in buildCourtSvg rally branch.
     * @param {function(string)} [onZoneClick] - Called with zoneId when a zone is clicked.
     * @param {object} [options] - Optional overrides: { title, closeOnClick }.
     * @returns {Promise<string|null>} Resolves with the clicked zoneId, or null when closed without selecting.
     */
    function showRallyZonePicker(onZoneClick, options) {
        options = options || {};
        if (typeof onZoneClick === 'function') options.onZoneClick = onZoneClick;
        if (options.title == null) options.title = 'Rally';
        options.mode = 'rally';
        return showCourtZonePicker(options);
    }

    /**
     * Open serve zone picker by serve side (deuce or ad). Use this when you have a variable for the current serve.
     * @param {string} serveSide - 'deuce' or 'ad' (case-insensitive).
     * @param {function(string)} [onZoneClick] - Called with zoneId when a zone is clicked.
     * @param {object} [options] - Optional overrides: { title, closeOnClick, requireZoneSelection, serveNumber }.
     *   serveNumber: 1 = First Serve, 2 = Second Serve (used for title when title not provided).
     * @returns {Promise<string|null>} Resolves with the clicked zoneId, or null when closed without selecting.
     */
    function showServeZonePickerBySide(serveSide, onZoneClick, options) {
        var side = (serveSide || '').toLowerCase();
        options = options || {};
        if (side === 'ad') {
            return showAdSideServePicker(onZoneClick, options);
        }
        return showServeTrackingPicker(onZoneClick, options);
    }

    if (typeof window !== 'undefined') {
        window.showCourtZonePicker = showCourtZonePicker;
        window.showServeTrackingPicker = showServeTrackingPicker;
        window.showAdSideServePicker = showAdSideServePicker;
        window.showReturnZonePicker = showReturnZonePicker;
        window.showRallyZonePicker = showRallyZonePicker;
        window.showServeZonePickerBySide = showServeZonePickerBySide;
        window.buildServeCourtSvgForStats = buildServeCourtSvgForStats;
    }
})();
