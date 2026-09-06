# 0.14.0 — 完整耳廓与自然抬爪

这次针对 0.13.0 的两个实际反馈：动耳时身体底图露出旧耳缘；挥爪像弯曲的细管，切片间隙又形成条纹。

## 改动

- 身体使用 `assets/rongxin-body-v3.png`：补好耳根下面的头顶，删除旧耳尖。左右耳由原定妆图完整提取到 `rongxin-ear-left-v2.png` / `rongxin-ear-right-v2.png`，外侧毛缘跟随运动。
- 挥爪底图升级为 `rongxin-wave-body-v2.png`，使用同一套修复后的头顶。新的路径避免复用旧 PNG 缓存。
- 挥爪总时长 3200 ms：抬爪约 950 ms；随后向外轻招两下；先收回胸前，再于最后 750 ms 放下。动作起止速度缓和，重复触发重新计时。
- `getWavePose` 直接控制肘部和爪心的位置。抬爪时肘部略向外让位，爪子从身体前方收起；支撑爪不移动。
- 站立纹理分为上下臂两块完整 PNG，不再逐条弯曲切片。折叠前臂使用专门绘制的蓬松短毛臂和松弛圆爪，按照相同肘部、爪心坐标配准，抬起时平滑过渡。上臂收进胸毛后隐藏，避免露出裁切边。
- 身体轻微向支撑侧移动，头、耳朵和眼皮作为整体跟随；脸部没有换图。尾巴动作随抬爪渐入渐出。
- 新资源仍按需加载，全部准备好才启用新动作，失败保留既有坐姿回退。关闭时释放图片引用、使未完成的加载失效。

## 验证与限制

已运行 `tools/test-walk.mjs`、`tools/test-nuzzle.mjs`、`tools/test-gestures.mjs` 和 `tools/test-layer-assets.mjs`。

原生 Canvas 检查覆盖 97 个完整挥爪帧：支撑前爪底部始终为设计坐标 y=460；耳尖旧位置在身体和挥爪底图中透明；原眼睛与鼻子区域像素保留。人工查看完整动作以及抬爪中段、放大耳缘。配套动图通过同一生产渲染器生成。

这仍是 2.5D 图片分层动画，不是完整 3D 骨骼。未在 iPhone / SillyTavern 真机上测试，原生 Canvas 检查不能代替浏览器验收。

## 素材重建

离线构建需要 `@napi-rs/canvas`；运行 `node tools/build-ear-assets.mjs`，再运行 `node tools/build-wave-assets.mjs`。生成图只用于限定的头顶修补、前臂区域；完整生成角色没有替换原脸和身体。

生成方式：内置图像生成工具。编辑目标均为 `assets/rongxin-base-v1.png`。原始生成图保存在项目的 `assets/rongxin-crown-repair-green-v1.png` 与 `assets/rongxin-raised-paw-green-v1.png`，不参与运行时绘制。

### 头顶修补提示词

Use case: precise-object-edit. Production animation underpaint plate, not a finished character. Edit this exact kitten image: REMOVE BOTH EARS COMPLETELY, including every outer ear rim, pink triangle and long ear tip. Reconstruct the small rounded furry skull underneath where the ears attach, as if the ears are hidden behind its round head. The top of the rounded head stays at about y=220 in the original 1185x1327 canvas; do not grow a large domed forehead up into the old ear positions. Preserve exact original eyes, face, whiskers, body, legs, tail, proportions, lighting and registration on the same 1185x1327 canvas. Fill the areas formerly occupied by ears with perfectly solid bright chroma-key GREEN #00FF00, and use that exact flat green for all empty background. Silver white layered furry crown matching original grey forehead markings, warm rim light, no green spill. No ears, no ear-shaped tufts. No shadows on background, no checkerboard, no text. This is a clean underlying animation plate; the original ears will be composited back separately.

### 自然前爪提示词

Use case: precise-object-edit. Edit this exact kitten for a natural beckoning animation key pose. KEEP its original face, amber eyes, ears, body registration, tail, other legs, fur colors, lighting and original 1185x1327 framing. Change ONLY the screen-left FRONT leg (the front paw originally centered at x420 y1200). Lift that paw naturally to the chest, so the paw center is near x330 y725. The upper arm stays close against the chest, elbow at about x400 y880; a SHORT, THICK, FLUFFY forearm folds upward, and its small round kitten paw curls softly forward and DOWN at the wrist like a kitten begging or reaching. Show the fluffy BACK of the paw (no pads), relaxed rounded toes pointed diagonally down toward the viewer. It must look anatomically feline, full of soft long fur, with a compact folded elbow. NOT a long human arm, NOT a U-shaped hose, NOT bare bone, NOT thin white tubes, NOT clenched human fist with upright fingers, NOT stretched. The lifted front leg is absent from its old position on the ground; keep the other THREE feet on the ground unchanged, naturally repair the chest behind the lifted leg. Use pure flat bright GREEN #00FF00 empty background with no checkerboard and no shadow. The result is a single same seated kitten, one paw politely raised in front of the chest.
