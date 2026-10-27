# 参衡 · 调查驾驶台

海参养殖调查双体无人船的网页交互原型。**模拟用，不连接真实机器。**

[打开驾驶模拟台](https://yun999-ccc.github.io/shenheng-driving-simulator/)

![实际界面](assets/preview.png)

## 如何体验

- 拖动查看三维样机，滚轮缩放，切换跟随、总览和近看视角。
- W/A/S/D 或屏幕方向按钮驾驶；Q/E 或深度滑杆升降相机。
- 点击“开始航线调查”执行预设均匀航线，可选择体验倍速。
- 空格或“急停”停止运动，必须显式解除；手动接管会清除自动航线。
- 记录当前观察、查看记录并导出带有 SIMULATED_ONLY 标识的 CSV。

## 本地运行

无需安装 npm 依赖。需要支持 WebGL 2、ES modules 和 import maps 的现代浏览器。

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 http://127.0.0.1:8080/ 。不要直接双击 HTML 文件运行。Three.js 已随项目提供，运行时无需第三方 CDN、API 密钥或账号登录。

```sh
node tests.mjs
```

状态模型包含12项检查，覆盖驾驶、升降、急停、接管、边界、航线完成、返航和合成观测关联。这些检查不是实机性能验证。

## 文件结构

- index.html / style.css：中文界面和响应式布局。
- simulation.mjs：简化运动学、任务状态与模拟记录。
- scene.js：程序化样机、合成水下场景和下视画面。
- app.js：输入处理、界面同步与 CSV 导出。
- vendor/：固定版本 Three.js 0.186.1 及其 MIT 许可。

## 数据与验证边界

位置、速度、深度、电量、画面、目标和质量分数均为模拟。目标按合成世界已知编号关联，未运行真实海参识别算法。质量分数不等于检出概率；网格面积为近似值。尚未完成浮力、水动力、防水、续航或实机测试。刷新或关闭网页后记录不保留，需要保留时先导出。

## 发布

GitHub Pages 从 main 分支根目录发布，.nojekyll 关闭 Jekyll 处理。所有资源使用相对路径，兼容仓库子路径。

## 来源与许可

依赖与技能来源见 [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt) 和 [Three.js 许可证](vendor/THREE-LICENSE.txt)。本项目未额外授予原创代码的开源再利用许可；公开仓库用于查看源码与展示交互原型。
