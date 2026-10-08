# 分享 / 发布功能最佳实践（真机血泪验证版）

> 适用：小工具内「一键发布笔记（postNote）」、分享按钮、分享图生成等所有需要调 `miniTool.postNote` 的功能。
> 本文件结论全部来自 float 反应力小工具 9+ 轮真机回归（2026-09~10），每条都是「用户真机验证过」或「真机证伪后排除」的结论，**不要重新踩坑**。

## 铁律一：分享/发布按钮必须用 pointerdown 触发，click 只作兜底

**真机现象**：冷启动进入小工具后，首次点击分享按钮「闪一下（CSS :active 生效）但无任何反应」，第 2 次点击才成功。历版所有代码链路修复（writeTempFile / dataURL / tags / payload / 延迟）都无法解决，因为**问题根本不在 postNote 调用，而在事件派发层**。

**根因**：小红书容器会**抑制首次触摸合成的 click 事件**（冷启动/首次触摸特殊处理）。触摸确实到达页面（CSS :active 会闪），但 click 事件不派发到 JS handler——于是首次点击对 JS 完全无感知。

**解法**（已验证：连续 2 次 1 键成功）：

```js
function bindShareButton(btn, getSnapshot) {
    let lastShareAt = 0;
    btn.addEventListener('pointerdown', () => {   // 触摸按下瞬间原生派发，绕开 click 合成抑制
        lastShareAt = Date.now();
        handleShare(btn, getSnapshot());
    });
    btn.addEventListener('click', () => {          // 兜底（PC/其他环境）
        if (Date.now() - lastShareAt < 800) return; // 800ms 时间窗：同一触摸的 click 跳过，防双弹发布页
        handleShare(btn, getSnapshot());
    });
}
```

- `pointerdown`（或 `touchstart`）在触摸按下瞬间派发，不受 click 合成抑制影响——`:active` 能闪说明触摸已到页面，pointerdown 同样会到。
- **必须加时间窗去重**：一次物理触摸会先 pointerdown 后 click，若都触发 handleShare 会双弹发布页。
- synonym-cards 1 键成功的原因同此（其页面交互多，首次触摸早已发生），并非其分享实现特殊。

## 铁律二：postNote 分享路径 = dataURL 直传 + tags 字段 + 零 writeTempFile

**真机验证过的稳定 payload**（synonym-cards 同款，1 键成功）：

```js
// 分享图：Canvas 导出 PNG dataURL（不要用 JPEG，真机被吞）
const uri = canvas.toDataURL('image/png');
const postData = {
    title: '你的标题'.slice(0, 20),
    content: '正文…' + '\n' + noteTags.map(t => '#' + t + '[话题]#').join(' '),
    pageType: 'photo_publish',
    mediaInfo: { image_resources: [{ url: uri }] },  // dataURL 直传
};
const tagStr = noteTags.join(' ');   // 不带 # 的话题名，空格分隔
if (tagStr) postData.tags = tagStr;  // 必须带 tags 字段（话题才能显示为蓝字）
window.xhs.miniTool.postNote(postData);  // fire-and-forget 或 await 均可（容器接受异步调用）
```

要点：
- **dataURL 直传 postNote 是稳定路径**；`writeTempFile → filePath → postNote` 在分享场景是被证伪的死路（见铁律三）。
- **必须带 `tags` 字段**（不带 # 的话题名空格分隔）。曾有版本去掉 tags 导致回归——容器对 tags 的校验没有那么严格，去掉反而丢蓝字话题。
- `content` 里的 `#名称[话题]#` 序列化用于正文显示蓝字话题，与 `tags` 字段双写，两者都要。
- 图片用 PNG（约 200-500KB 均可），JPEG dataURL 真机不稳。

## 铁律三：writeTempFile 只用于「存相册」，绝不与 postNote 同链路

- 分享路径任何时刻**不要调用 writeTempFile**（含"点击前后台预热"）：真机里 writeTempFile 可能静默挂起（Promise 不 resolve 不 reject），挂起的调用会占住容器桥，饿死同链路的 postNote——表现为「首次成功、之后都要点 2 次」。
- 「先落盘拿 filePath 再 postNote」=「点击后强制 writeTempFile + 等待落盘（曾试 3s/5s 上限）」，历版真机全部失败，勿重走。
- writeTempFile 唯一合法用途：**保存图片到相册**（`writeTempFile → saveImageToPhotosAlbum`），与分享完全分开。

## 已被真机证伪、勿再尝试的方案

| 方案 | 结果 | 教训 |
| --- | --- | --- |
| 点击后确保 filePath 再 postNote（v8-v10，等待 3s→5s） | 仍要 2 次 | writeTempFile 与 postNote 同链路必占桥饿死 |
| 报告页渲染时后台预热 writeTempFile | 首次成功、之后失败 | 挂起的预热占桥，污染后续点击 |
| payload 去掉 tags 字段（v7） | 退化 | tags 校验没有想象严格，去掉反而丢蓝字 |
| postNote 前延迟 500ms 等「初始化窗口」（v12） | 无效 | 首次被吞在事件派发层，不在桥调用层 |
| 移除按钮动画/CSS 特效（怀疑特效影响事件） | 无关 | 按钮仅有 :active translateY，不影响事件分发 |

## 排查路径速查（遇到「首次点击无反应 / 要点 2 次」）

1. **先查事件派发**：按钮是否 click 绑定？改 pointerdown 再测（80% 概率是此问题）。
2. **再查分享链路**：分享路径是否碰了 writeTempFile？改为 dataURL 直传 + tags。
3. **最后查 payload**：title ≤20 字、content 别太长、tags 空格分隔不带 #、图片 PNG dataURL。
4. 都不是 → 检查是否在「发布预览」容器测试（正式版容器行为可能不同），换正式版环境 A/B。

## 历史排查档案

完整排查史（v2~v13 每版结论）见 [optimization-experience.md](optimization-experience.md) §7.1。
