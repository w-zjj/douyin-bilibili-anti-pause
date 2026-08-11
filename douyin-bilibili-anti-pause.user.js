// ==UserScript==
// @name         抖音/B站网页版防暂停
// @namespace    https://github.com/w-zjj/douyin-bilibili-anti-pause
// @version      1.3.0
// @description  防止抖音、哔哩哔哩网页版因长时间无操作自动暂停视频，使用 Web Worker 抵抗后台标签页节流，后台也能稳定恢复播放。
// @author       w-zjj
// @match        https://www.douyin.com/*
// @match        https://www.bilibili.com/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/w-zjj/douyin-bilibili-anti-pause/main/douyin-bilibili-anti-pause.user.js
// @downloadURL  https://raw.githubusercontent.com/w-zjj/douyin-bilibili-anti-pause/main/douyin-bilibili-anti-pause.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 通过 Web Worker 实现：后台标签页不被节流，保持精确 10 秒检测
    const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
            if (e.data === 'start' && !timer) {
                timer = setInterval(() => {
                    self.postMessage('tick');
                }, 10000);
            }
            if (e.data === 'stop' && timer) {
                clearInterval(timer);
                timer = null;
            }
        };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = function() {
        // 检测并恢复暂停视频
        document.querySelectorAll('video').forEach(v => {
            if (v.paused && !v.ended) v.play().catch(() => {});
        });
    };

    worker.postMessage('start');

    // 主线程负责模拟交互（5 分钟一次），防止网站判定为无操作
    setInterval(() => {
        document.dispatchEvent(new MouseEvent('mousemove', {
            bubbles: true,
            clientX: Math.random() * innerWidth,
            clientY: Math.random() * innerHeight
        }));
    }, 300000);

    // 页面卸载时清理 Worker
    window.addEventListener('beforeunload', () => {
        worker.postMessage('stop');
        worker.terminate();
    });
})();
