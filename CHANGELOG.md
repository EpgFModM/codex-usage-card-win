# 更新记录

本文件记录 Windows 社区适配版。版本标识来自 `windows/version.json`；日期表示变更记录日期，不表示已发布 GitHub Release。

## 0.9.4-windows-preview.2 · 2026-10-31

- 修复 app-server 初始化期间收到 `account/updated` 后连接被中断、额度持续不可用的问题。
- 账号变化时立即清空旧额度并重新读取，丢弃账号切换期间返回的旧响应。
- 增加初始化账号通知和账号切换期间响应失效的回归测试；测试总数为 15。
- 既有验证记录显示 Windows 11 / Microsoft Store Codex 下可通过 `attach` 恢复连接，双环有效，状态为 `stale=false`、`badgeCount=1`。
- 整理本仓库 Windows 首页、来源署名、安全说明、验证边界及贡献与发布文档。

## 0.9.4-windows-preview.1

- 初始 Windows 便携式预览实现，面向 Windows 10 22H2 / Windows 11 x64 的 Microsoft Store Codex。
- 提供启动、诊断、状态、停止、快捷方式安装和卸载命令。
- 通过 CLI app-server 读取额度，默认每 60 秒刷新，支持通知更新与断线恢复。
- 固定并校验内置 Node.js 运行时，构建 ZIP 与 SHA256 校验文件。
- 移除旧版私有额度 HTTP 接口回退。

## 上游基础

- macOS 上游：`Lorie7813/codex-usage-card`，基础提交 `f1cc9764a2dc7ccc4e459606cd3311da9d111896`。
- Windows 草稿参考：SimonTan95，提交 `1c5359dc648a99525bb6c169f7149e51d3ce9712`。
- 上游 v0.9.4 Beta 的 macOS 安装验证不代表本 Windows 版的验证结果。

详见 [ATTRIBUTION.md](ATTRIBUTION.md) 和 [windows/VALIDATION.md](windows/VALIDATION.md)。
