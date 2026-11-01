# Windows 发布流程

本流程适用于 `EpgFModM/codex-usage-card-win`。上游 macOS 校验脚本及其固定仓库配置不用于 Windows 发布。

## 准备

1. 更新 `windows/build.cjs` 的版本标识和 ZIP 文件名，保持与预期的 `windows/version.json` 一致。
2. 更新 `CHANGELOG.md`、README 示例版本及 `windows/VALIDATION.md`，区分模拟测试与真实客户端验证。
3. 保留根目录 `LICENSE`、`ATTRIBUTION.md` 及运行时许可证，不提交个人日志、凭据或构建缓存。
4. 先停止本机正在运行的组件，避免自动化测试与其控制管道冲突；测试后可重新启动。

## 验证与构建

在 Windows、Node.js 24+ 和 Python 3 环境中执行：

```powershell
node --test windows/windows.test.cjs
node windows/build.cjs
Get-FileHash .\dist\CodexUsageCard-Windows-x64-0.9.4.zip -Algorithm SHA256
```

确认 18 项测试通过、哈希与 `dist/SHA256SUMS.txt` 相符，并检查 ZIP 根目录为 `CodexUsageCard/`，包含操作脚本、组件源码、README、验证说明、项目许可证、来源署名和 `runtime/LICENSE.txt`。后续新增测试时以实际测试总数为准。

在独立解压目录测试启动、安装快捷方式、状态、停止和卸载。记录真实测试环境，未验证平台继续标注为未验证；不得仅凭构建成功声明完整兼容。

## GitHub Release

1. 提交并推送已检查的源代码，确认 Windows Actions 检查通过。
2. 在该提交上创建版本标签，例如 `v0.9.4-windows`。
3. 从仓库 Releases 创建发布，正式版不勾选 **Set as a pre-release**，并设为 Latest；后续预览版本才勾选预发布。
4. 上传同一次构建生成的 ZIP 和 `SHA256SUMS.txt`，说明改动、依赖、启动方式、验证环境和已知限制。
5. 下载已上传的 ZIP，再次比对 SHA256。不要混用不同构建的 ZIP 与校验文件。

Actions 的 artifact 用于保存检查产物，不会自动创建 Release。`dist/` 和 `windows/runtime/` 不纳入 Git 历史。
