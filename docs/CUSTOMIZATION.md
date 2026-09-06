# 替换形象与二改指南

糯叽由 **Ripple × GPT** 共同制作，**GPT 主刀实现，Fable5.1 参与讨论**。项目采用 [MIT 许可证](../LICENSE)，允许替换宠物形象、修改代码、增加功能，以及分发修改版。

这份指南对应 **0.19.1**。它说明当前代码的实际结构；目前没有一键上传皮肤功能，也没有可直接套用任意形象的通用骨骼配置。

## 从哪里开始

先 Fork 仓库，并保留一份能正常工作的原版。只改说话方式时，优先使用扩展设置里的通用／专属台词编辑器，不需要修改代码。

| 想改什么 | 主要入口 |
| --- | --- |
| 默认台词、变量、专属台词继承 | `companion.js` 中的 `SCENES`、`renderLine()`、`Companion.say()` |
| 新的聊天互动、触摸手势 | `index.js` 中的事件绑定和状态衔接 |
| 气泡、设置面板外观 | `style.css`、`settings.html` |
| 图片、姿态、动画 | `pet-renderer.js`、`assets/` |
| 显示名称与版本 | `manifest.json`；同时检查设置文案与 README |

## 换形象：不能只换一张主图

坐姿、趴姿、团子和行走各有素材。仅替换 `nuoji-base-v1.png` 不会替换所有动作：分层绘制时仍会加载身体、耳朵和尾巴等图层。

若沿用原版比例和姿态，最容易从同尺寸、同位置的图层替换开始。身体轮廓、眼睛位置或四肢比例变化明显时，需要同步调整绘制坐标、旋转中心、闭眼遮罩和步态。

下面列出 `pet-renderer.js` 当前直接引用的图片。尺寸来自仓库实际文件，不要把图层裁剪到可见内容的边界后再直接替换。

| 素材（均在 `assets/`） | 尺寸（宽 × 高） | 用途 |
| --- | --- | --- |
| `nuoji-base-v1.png` | 1185 × 1327 | 整体主图／降级素材 |
| `nuoji-body-v3.png` | 1185 × 1327 | 坐姿身体 |
| `nuoji-tail-v1.png` | 1185 × 1327 | 坐姿尾巴 |
| `nuoji-underpaint-v1.png` | 1185 × 1327 | 遮挡后方的补画图层 |
| `nuoji-ear-left-v2.png`、`nuoji-ear-right-v2.png` | 各 1185 × 1327 | 左右耳朵 |
| `nuoji-closed-eyes-v2.png` | 305 × 190 | 坐姿闭眼贴片 |
| `nuoji-lying-v2.png`、`nuoji-lying-closed-eyes-v2.png` | 各 1402 × 1122 | 趴姿与趴姿闭眼层 |
| `nuoji-ball-green-v1.png` | 1254 × 1254 | 团子母图，RGB 绿底 |
| `nuoji-walk-green-v1.png` | 1402 × 1122 | 行走降级母图，RGB 绿底 |
| `nuoji-walk-body-v3.png`、`nuoji-walk-tail-v1.png` | 各 1402 × 1122 | 行走身体与尾巴 |
| `nuoji-walk-leg-front-near-v5.png`、`nuoji-walk-leg-hind-near-v5.png` | 各 1402 × 1122 | 行走近侧前后腿 |
| `nuoji-walk-leg-front-far-v3.png`、`nuoji-walk-leg-hind-far-v3.png` | 各 1402 × 1122 | 行走远侧前后腿 |
| `nuoji-walk-paw-front-near-v1.png` | 1402 × 1122 | 近侧前爪 |

除表中标注的两张 RGB 绿底母图，其余这些素材是 RGBA PNG。透明区域也参与图层对齐；请保留正确的透明通道。

### 建议的替换顺序

1. 先完成坐姿整图、身体、补画、耳朵、尾巴和闭眼贴片，保持各层使用统一画布与对齐位置。
2. 在 `pet-renderer.js` 顶部确认图片 URL；修改图片内容后可更新文件名或版本参数，避免浏览器继续读取旧缓存。
3. 核对坐姿的眼睛、耳根、尾根位置。代码使用 **500 × 500 的设计坐标系**，部分图层处理又直接使用原始图片坐标；二者不能混用。耳朵绘制中还有针对原图 `1185 × 1327` 的切片坐标。
4. 再处理趴姿、团子、行走。行走相关参数集中在 `WALK_LEGS` 等定义里，包括腿根、脚掌、接地点和摆动参数；换了身体比例就需要重新校准。
5. 检查所有动作后再发布。只完成一部分形态时，先在你的衍生版里明确关闭或替换未完成的形态，避免动作切换时出现原版图层。

团子与行走绿底母图经过现有去绿逻辑处理。若想改为透明素材，先检查加载和去绿代码，再调整对应加载路径；不要只把透明图片改成同名文件就假定整个流程适配。

图片入口、耳朵切片、眼睛遮罩和动作坐标都能在 `pet-renderer.js` 中找到。`tools/` 的素材处理脚本包含针对糯叽原画的裁切和像素参数，它们是实现参考，不是适配任意宠物的一键生成器。

## 增加功能与联动

不修改渲染器也可以接入新事件。页面内已有接口：

```js
window.NuojiPet?.react('happy', '找到啦！', 1800);
window.NuojiPet?.nuzzle();
window.NuojiPet?.report();
```

也可发送事件：

```js
window.dispatchEvent(new CustomEvent('nuoji:react', {
    detail: { state: 'happy', message: '找到啦！', duration: 1800 },
}));
```

可用状态：`idle`、`listening`、`thinking`、`happy`、`confused`、`petting`、`nuzzling`、`sleeping`、`wave`。外部 `react` 的文字仍受安静模式、气泡总开关和主动气泡间隔限制；动画与文字并不是必须同时出现。

新增状态时，需要同步维护状态定义、渲染分支、标签和需要的预览按钮。请沿用现有的监听与定时器清理方式，保证停用、切换聊天和拖动中断后不会遗留行为。

## 验证你的修改

在仓库目录执行：

```bash
node --check index.js
node --check companion.js
node --check pet-renderer.js
node tools/test-companion.mjs
node tools/test-companion-controller.mjs
```

动作修改还可参考 `tools/test-gestures.mjs`、`tools/test-nuzzle.mjs`、`tools/test-walk.mjs` 和 `tools/test-layer-assets.mjs`。先阅读对应脚本，确认所需环境；部分检查和素材处理需要额外的 Canvas 或图片处理依赖。

`preview.html` 可通过本地 HTTP 服务打开，用于检查动作。仍需到真实酒馆里检查打字、等待回信、切换聊天、拖动、长按以及不同尺寸；预览页不等于完整酒馆联动验收。

对于更换形象的版本，重点看透明处能否点穿、40% 小尺寸是否可操作、耳尾转动是否露底、闭眼是否对齐、脚掌是否接地，以及气泡在屏幕四角是否清楚。

## 发布衍生版本

保留 [LICENSE](../LICENSE) 要求的版权声明与许可文本。建议在自己的主页注明基于本项目、原版参与者及你新增或修改的内容，让使用者分清原版与衍生版；这项建议不增加 MIT 的许可条件。

你新增的素材应有相应的使用和分发授权；如果它们使用其他许可证，请单独说明其范围。欢迎给自己的宠物取名字、写自己的台词，也欢迎把改进通过 Pull Request 分享回来。
