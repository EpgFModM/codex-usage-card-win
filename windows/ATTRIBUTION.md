# 来源署名与第三方许可

## 原项目

- 项目：[Lorie7813/codex-usage-card](https://github.com/Lorie7813/codex-usage-card)。
- 本地记录的基础提交：`f1cc9764a2dc7ccc4e459606cd3311da9d111896`。
- 原许可证：MIT。
- 原版权声明：`Copyright (c) 2026 Codex Usage Badge contributors`。

本仓库的 [LICENSE](LICENSE) 和发布包中的 `LICENSE` 保留原版权声明与许可全文。Windows 版本的发布不表示上游作者审核、参与或背书本仓库的全部改动。

## Windows 草稿参考

- 贡献者：SimonTan95。
- 本地记录的草稿提交：`1c5359dc648a99525bb6c169f7149e51d3ce9712`。
- 本地来源记录注明 Windows 渲染与额度格式化参考该草稿，并保留 MIT 许可。
- 当前适配加入 Windows 启动管理、便携打包和连接修复，并移除旧版私有额度接口回退。

提交标识来自本地随附来源记录；本仓库首次导入不包含这些上游提交的完整 Git 历史，也不将其改记为当前维护者原创。

## 当前 Windows 适配维护

- 仓库：[EpgFModM/codex-usage-card-win](https://github.com/EpgFModM/codex-usage-card-win)。
- 维护者：[EpgFModM](https://github.com/EpgFModM)。
- 本仓库在保留上游版权与许可的前提下，以 MIT 许可证分发 Windows 适配改动。

## Node.js 运行时

Windows ZIP 包含 Node.js `24.22.2` 的 Windows x64 运行时，来源为 [Node.js 官方发布站点](https://nodejs.org/dist/v24.22.2/)。构建脚本固定并核验 `node.exe` 的 SHA256：

```text
1c331340fa6cac5e4294725959070a143fa0507195a78ad77eed7943f719aac9
```

构建时下载的 Node.js 许可全文及其中包含的第三方许可放在发布包的 `runtime/LICENSE.txt`。重新分发该运行时须一并保留相应许可文件。

## 名称与关联

Codex 和 OpenAI 名称用于说明兼容对象。本项目是独立社区附加组件，与 OpenAI 无官方关联或背书。
