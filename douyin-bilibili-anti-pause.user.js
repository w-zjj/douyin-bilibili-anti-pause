// ==UserScript==
// @name         抖音/B站网页版防暂停
// @namespace    https://github.com/w-zjj/douyin-bilibili-anti-pause
// @version      1.3.3
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

    // 用户主动暂停标记：记录用户在前台主动暂停的视频，避免脚本误恢复
    // - pause 事件触发时若页面可见（document.hidden === false），视为用户主动暂停
    // - play 事件触发时清除标记，恢复正常防暂停逻辑
    // - 抖音/B站动态切换 video 元素，WeakSet 自动随元素回收清理，无内存泄漏
    const userPaused = new WeakSet();
    const attached = new WeakSet();

    function attachListeners(v) {
        if (attached.has(v)) return;
        attached.add(v);
        v.addEventListener('pause', () => {
            if (!document.hidden) userPaused.add(v);
        });
        v.addEventListener('play', () => {
            userPaused.delete(v);
        });
    }

    worker.onmessage = function() {
        // 通过 currentTime 区分活跃视频与预加载视频：
        // - 预加载视频 currentTime 为 0，跳过，避免误触发抖音上下切换
        // - 活跃视频 currentTime > 0，被暂停则恢复
        // - userPaused 标记的视频（用户前台主动暂停）跳过，尊重用户意图
        document.querySelectorAll('video').forEach(v => {
            attachListeners(v);
            if (v.paused && !v.ended && v.currentTime > 0 && !userPaused.has(v)) {
                v.play().catch(() => {});
            }
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
