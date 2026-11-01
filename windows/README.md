# Windows 使用与开发说明

面向 Microsoft Store Codex 的 Windows x64 社区正式版。下载与图形化操作见[项目首页](https://github.com/EpgFModM/codex-usage-card-win#readme)，实际验证范围见 [VALIDATION.md](VALIDATION.md)。

## 发布包使用

完整解压后，保存工作并完全退出 Codex，再双击 `Start.cmd`。包内含 Node.js，无需额外安装 Node.js 或 npm。可用 `Install.cmd` 创建开始菜单「Codex + 额度卡片」快捷方式；移动目录后需重新安装快捷方式。

`Status.cmd` 查看运行状态；`Doctor.cmd` 检查安装路径；`Stop.cmd` 停止组件；`Uninstall.cmd` 停止组件并移除本组件记录的快捷方式。卸载后可手动删除解压目录和 `%LOCALAPPDATA%\CodexUsageCard`。

## 命令行

在发布包的 `CodexUsageCard` 目录中运行：

```powershell
.\runtime\node.exe .\windows.cjs start
.\runtime\node.exe .\windows.cjs status
.\runtime\node.exe .\windows.cjs doctor
.\runtime\node.exe .\windows.cjs stop
.\runtime\node.exe .\windows.cjs install
.\runtime\node.exe .\windows.cjs uninstall
```

`attach` 仅连接已经开启本地调试接口的 Codex，不会重启客户端：

```powershell
.\runtime\node.exe .\windows.cjs attach
```

`start` 和 `attach` 支持显式路径：

```powershell
.\runtime\node.exe .\windows.cjs start --app "C:\完整路径\ChatGPT.exe" --codex-bin "C:\完整路径\codex.exe"
```

也可设置 `CODEX_BADGE_APP` 与 `CODEX_BADGE_BIN`。自动识别优先使用当前用户的 Store 注册信息，并参考正在运行的 Store 客户端路径。显式路径选项不代表非 Store 版本已经验证。

## 运行边界

- 通过 CLI app-server 读取额度；不直接读取 `auth.json`，不使用私有额度 HTTP 回退接口。
- 默认每 60 秒刷新额度，约每 5 秒检查显示状态与连接；缺失或失效数据标记为不可用。
- 由账号返回的数据决定单环或双环展示，不推测缺失字段。
- 调试接口为 `127.0.0.1:39222`，不提供身份验证。不要转发端口；停止组件后需完全退出 Codex 才能关闭已开启的接口。
- 不修改客户端安装包或签名，不要求管理员权限，不创建开机自启项，没有自动更新。

完整说明见 [安全与隐私](https://github.com/EpgFModM/codex-usage-card-win/blob/main/SECURITY.md)（发布包内也附带 `SECURITY.md`）。

## 测试与构建

在仓库根目录使用 Node.js 24+ 和 Python 3。自动化测试前先停止组件，避免控制管道冲突：

```powershell
node --test windows/windows.test.cjs
node windows/build.cjs
```

构建从 Node.js 官方站点获取固定版本运行时、验证固定 SHA256，并在 `dist/` 输出 ZIP 和校验文件。源码目录中的 `.cmd` 依赖构建后的 `runtime/node.exe`。

来源、基础提交和许可见 [署名说明](https://github.com/EpgFModM/codex-usage-card-win/blob/main/ATTRIBUTION.md)（发布包内也附带 `ATTRIBUTION.md`）。发布流程见 [Windows 发布流程](https://github.com/EpgFModM/codex-usage-card-win/blob/main/docs/windows-release.md)。
