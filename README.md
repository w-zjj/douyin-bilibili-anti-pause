# 抖音/B站网页版防暂停

防止抖音、哔哩哔哩网页版因长时间无操作自动暂停视频，**使用 Web Worker 抵抗后台标签页节流，后台也能稳定恢复播放**。

## 功能

- 自动检测视频暂停并恢复播放
- Web Worker 驱动定时器，后台标签页不被浏览器节流
- 周期模拟鼠标移动，避免网站判定"无操作"
- 仅作用于抖音与 B 站，不影响其他网站
- 零依赖、不修改浏览器设置、不收集任何数据

## 安装

### 方式一：通过 GitHub Raw 安装（推荐）

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击下方链接，Tampermonkey 会自动弹出安装确认：
   - [安装脚本](https://raw.githubusercontent.com/w-zjj/douyin-bilibili-anti-pause/main/douyin-bilibili-anti-pause.user.js)
3. 确认安装后，刷新抖音 / B 站页面即可生效

> 若 `raw.githubusercontent.com` 无法访问，可使用 jsDelivr 镜像：
> `https://cdn.jsdelivr.net/gh/w-zjj/douyin-bilibili-anti-pause@main/douyin-bilibili-anti-pause.user.js`

### 方式二：手动新建

1. 安装 Tampermonkey
2. 点击扩展图标 → **添加新脚本**
3. 复制 [`douyin-bilibili-anti-pause.user.js`](./douyin-bilibili-anti-pause.user.js) 全部内容粘贴
4. `Ctrl+S` 保存

## 使用

无需任何操作，打开抖音或 B 站网页后脚本自动运行。
记得打开篡改后扩展设置允许用户使用脚本
<img width="525" height="540" alt="image" src="https://github.com/user-attachments/assets/abcc487c-bfe2-4486-aeaf-6b6e5168b576" />


## 工作原理

| 机制 | 作用 |
|------|------|
| Web Worker 驱动 10 秒定时检测 `video.paused` | 后台标签页不被浏览器节流，保持精确 10 秒检测，视频暂停时自动 `.play()` 恢复 |
| 主线程 5 分钟定时派发 `mousemove` 事件 | 让网站前端认为用户仍在操作，不触发主动暂停逻辑 |
| `@match` 白名单注入 | 仅在抖音/B站加载，其他网站零影响 |

### 为何使用 Web Worker

Chrome、Edge 等浏览器会对后台标签页的 `setInterval` 强制降频至约每分钟 1 次。Web Worker 中的定时器不受标签页可见性影响，能保持精确频率，确保后台暂停后 10 秒内恢复。

| 标签页状态 | 原版检测间隔 | Worker 版检测间隔 |
|-----------|------------|------------------|
| 前台活跃 | 10 秒 | 10 秒 |
| 后台普通 | 约 60 秒（被节流） | 10 秒（不受影响） |
| 暂停后恢复延迟 | ≤60 秒 | ≤10 秒 |

## 可调参数

编辑脚本中 Worker 内的检测间隔常量即可：

```javascript
timer = setInterval(() => {
    self.postMessage('tick');
}, 10000);   // 检测间隔（毫秒），默认 10 秒
```

| 场景 | 建议检测间隔 |
|------|-------------|
| 默认 | 10000 (10秒) |
| 后台仍偶发暂停 | 5000 (5秒) |

## 兼容性

- **浏览器**：Chrome / Edge / Firefox / Safari（需对应 Tampermonkey 版本，且支持 Web Worker）
- **站点**：抖音 `www.douyin.com`、哔哩哔哩 `www.bilibili.com`
- **扩展站点**：在脚本 `@match` 区域追加规则即可，例如 `// @match  https://www.youtube.com/*`

## 版本历史

| 版本 | 说明 |
|------|------|
| 1.3.3 | 修复用户手动暂停被误恢复问题：通过 document.hidden 区分用户主动暂停与系统自动暂停 |
| 1.3.2 | 修复后台标签页功能失效问题：改用 currentTime 判断活跃视频，不依赖布局计算 |
| 1.3.1 | 修复误触发抖音上下切换问题：仅处理当前可见视频，跳过预加载隐藏视频 |
| 1.3.0 | 引入 Web Worker，后台标签页定时器不被节流，保持精确 10 秒检测 |
| 1.2.0 | 基础定时检测 + 模拟交互 |

## 许可证

[MIT License](./LICENSE)
