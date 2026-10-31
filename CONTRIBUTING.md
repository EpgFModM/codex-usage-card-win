# 贡献指南

欢迎提交 Windows 兼容性反馈、文档改进和修复。参与前请阅读 [README](README.md)、[安全说明](SECURITY.md) 和[验证记录](windows/VALIDATION.md)。

## 报告问题

在 [Issues](https://github.com/EpgFModM/codex-usage-card-win/issues) 中描述 Windows 版本、架构、Codex 安装来源及版本、组件版本、复现步骤、预期行为和实际行为。附诊断结果前，请移除用户名、个人路径、账号信息、聊天内容和凭据。

安全敏感问题按 [SECURITY.md](SECURITY.md) 处理，不公开利用细节。

## 提交改动

1. Fork 仓库并新建分支，保持一次改动围绕一个问题。
2. 在 Windows 上使用 Node.js 24+ 运行 `node --test windows/windows.test.cjs`。测试会使用组件控制管道，请先停止现有组件。
3. 涉及打包时使用 Python 3 和 `node windows/build.cjs` 检查输出。
4. 在 PR 中说明问题、改动后的行为、验证方式及尚未覆盖的环境；涉及界面时可附脱敏截图。
5. 更新对应文档或变更记录，保留上游版权和第三方许可证。提交代码时按本项目 MIT 许可证贡献。

不要提交 `windows/runtime/`、`dist/`、个人配置、日志、账号文件或令牌。请勿通过强制结束用户会话、开放网络调试端口或加入私有认证回退来绕过兼容问题。
