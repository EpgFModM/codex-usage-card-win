# Codex Usage Card · Windows

在 Codex 桌面应用侧栏显示剩余额度的 Windows 社区适配版。

**当前版本：`0.9.4-windows-preview.2`（预览版）。** 目标平台为 Windows 10 22H2 / Windows 11 x64 的 Microsoft Store Codex。已有 Windows 11 环境下的验证记录；Windows 10、ARM64、非 Store 安装及长期运行情况尚未完成验证。详见[验证记录](windows/VALIDATION.md)。

本项目由 [EpgFModM](https://github.com/EpgFModM) 维护，基于 [Lorie7813/codex-usage-card](https://github.com/Lorie7813/codex-usage-card)，并参考 SimonTan95 的 Windows 草稿。完整来源见[署名与第三方许可](ATTRIBUTION.md)。这是非官方社区项目，与 OpenAI 无官方关联或背书。

## 功能

- 在侧栏显示剩余额度圆环；当账号及服务端数据支持时，分别显示 5 小时和每周额度。
- 悬停查看额度窗口、重置时间及可用的重置卡信息；缺失数据标记为不可用。
- 支持深浅色界面；默认每 60 秒刷新额度，连接中断后尝试恢复。
- 便携式目录，发布包内置 Node.js，无需另装 Node.js 或 npm。
- 可创建开始菜单专用快捷方式，也可直接通过 `Start.cmd` 启动。

## 下载与启动

1. 在本仓库 [Releases](https://github.com/EpgFModM/codex-usage-card-win/releases) 下载 Windows x64 ZIP 和同一版本的 `SHA256SUMS.txt`。如果还没有 Release，可按下方步骤从源码构建。
2. 在 PowerShell 中核对 ZIP 的 SHA256，并与校验文件对应条目比较：

   ```powershell
   Get-FileHash .\CodexUsageCard-Windows-x64-0.9.4-preview.2.zip -Algorithm SHA256
   ```

3. 完整解压到固定目录。保存工作并完全退出 Codex，然后双击解压目录中的 **`Start.cmd`**；首次启动最多等待约 60 秒。
4. 如需日常使用，双击 **`Install.cmd`**，创建开始菜单中的「Codex + 额度卡片」快捷方式，以后从这个入口启动。

原 Codex 图标不会自动加载卡片。移动解压目录后，请重新运行 `Install.cmd`。当前版本没有自动更新功能，更新时先停止旧版，再解压新版并重新创建快捷方式。

> 卡片通过本机调试端口 `127.0.0.1:39222` 加载。该接口权限较高且不提供身份验证，请勿转发或向网络开放。运行前请阅读[安全与隐私说明](SECURITY.md)。

## 管理与卸载

| 文件 | 用途 |
| --- | --- |
| `Start.cmd` | 启动 Codex 与额度卡片；已有普通 Codex 会话时会提示先退出 |
| `Install.cmd` | 创建开始菜单专用快捷方式，不创建开机自启项 |
| `Status.cmd` | 查看状态；正常显示时应有 `placed=true`、`badgeCount=1` |
| `Doctor.cmd` | 检查 Codex、CLI、Node.js 路径与平台信息 |
| `Stop.cmd` | 停止组件并移除圆环，保留 Codex 窗口 |
| `Uninstall.cmd` | 停止组件并移除本组件记录的快捷方式 |

卸载后可删除解压目录和 `%LOCALAPPDATA%\CodexUsageCard` 中的日志。`Stop.cmd` 不会关闭客户端的调试端口；如需关闭，请完全退出 Codex，再从原 Codex 图标启动。

日志和错误信息位于 `%LOCALAPPDATA%\CodexUsageCard`。提交 Issue 前请删除账号信息、个人路径和其他隐私内容。

## 常见问题

**启动提示 Codex 已运行？** 保存工作并完全退出客户端，再使用 `Start.cmd` 或专用快捷方式启动。组件不会强制结束现有会话。

**未出现卡片或显示不可用？** 先运行 `Status.cmd` 和 `Doctor.cmd`。确认安装的是 Microsoft Store Codex，已登录，且当前客户端接口和侧栏结构兼容。额度字段缺失、登录失效或客户端升级都可能导致不可用。

**提示 39222 端口被占用？** 检查占用程序并自行处理后重试。组件不会自动终止端口占用者。

**能显示 token 消耗或 API 余额吗？** 本项目显示 Codex 账号返回的额度窗口剩余百分比，不是聊天上下文 token 数或 API 账单余额。

## 从源码测试与构建

需要 Windows、Node.js 24+、Python 3，以及可访问 Node.js 官方下载站点的网络。测试和构建使用 PATH 中的 `node` 与 `python`。自动化测试会临时使用组件的控制管道，请先停止正在运行的组件，测试后再重新启动。

```powershell
git clone https://github.com/EpgFModM/codex-usage-card-win.git
cd codex-usage-card-win
node --test windows/windows.test.cjs
node windows/build.cjs
```

构建脚本下载固定的 Node.js `24.22.2` Windows x64 运行时并核验固定 SHA256，同时附带 Node.js 许可证。输出：

```text
dist/
  CodexUsageCard-Windows-x64-0.9.4-preview.2.zip
  SHA256SUMS.txt
```

源码仓库不包含内置运行时或 ZIP；必须先构建才能使用源码目录中的 `.cmd`。GitHub Actions 会执行测试、构建并保存构建产物；Actions 产物不等于正式 Release。

更多信息：[Windows 命令行说明](windows/README.md) · [更新记录](CHANGELOG.md) · [贡献指南](CONTRIBUTING.md) · [发布流程](docs/windows-release.md)。`docs/macos.md`、`docs/verify-release.md`、`docs/releases/macos-0.9.4.json`、`docs/releases/macos-SHA256SUMS.txt` 及 `scripts/verify_release.py` 为保留的上游 macOS 资料，不适用于本 Windows 包。

## 来源与许可

原项目采用 [MIT 许可证](LICENSE)，本仓库保留其版权声明与许可全文。Windows 适配、维护与本仓库发布由 EpgFModM 负责，不代表上游作者审核或背书。发布包同时保留项目许可证与 Node.js 第三方许可，详见 [ATTRIBUTION.md](ATTRIBUTION.md)。

## English

Unofficial Windows community adaptation of Codex Usage Card. Displays remaining Codex allowance in the desktop sidebar using the local CLI app-server and a loopback debugging connection. Targets Microsoft Store Codex on Windows x64; Windows 11 has limited validation, while Windows 10 remains untested. This project is not affiliated with OpenAI.

Download a Windows ZIP from [Releases](https://github.com/EpgFModM/codex-usage-card-win/releases), verify its SHA256, extract it fully, save your work and quit Codex, then run `Start.cmd`. Optionally run `Install.cmd` to create a Start menu shortcut. Use `Stop.cmd` to stop the add-on and `Uninstall.cmd` to remove its shortcut. Do not expose port `39222`. See [Security](SECURITY.md), [Validation](windows/VALIDATION.md), and [Attribution](ATTRIBUTION.md) before distributing or installing.
