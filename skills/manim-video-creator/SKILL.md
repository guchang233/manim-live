---
name: manim-video-creator
description: 使用Manim（数学动画引擎）创建动画视频。此技能用于：(1) 解说视频和可视化制作，(2) 演示视频，(3) Logo动画，(4) 信息图表，(5) 教育内容，(6) 3D动画，(7) 算法和数据结构可视化。支持2D/3D场景、LaTeX数学公式、图表、TTS旁白、背景音乐等。
---

# Manim 视频创作者

使用Manim Community库创建带有TTS旁白和背景音乐的动画视频。

---

## 视频创建前的必要询问

**重要**: 在开始创建视频之前，必须使用 `AskUserQuestion` 工具询问以下信息。

### 询问项目

```
使用AskUserQuestion确认以下内容：

1. 视频类型
   - 解说/教育视频（论文解说、教程等）
   - 演示视频
   - Logo动画
   - 信息图表/数据可视化
   - 算法/代码可视化
   - 其他

2. 创建范围
   - 仅Manim视频（无音频）
   - Manim视频 + 台本
   - 完整版（Manim + TTS旁白 + BGM）

3. 旁白语音（完整版时）
   - 日语女声（ja-JP-NanamiNeural）- 推荐
   - 日语男声（ja-JP-KeitaNeural）
   - 英语女声（en-US-JennyNeural）
   - 英语男声（en-US-GuyNeural）

4. BGM类型（完整版时）
   - 自动生成（环境音）- 免版权
   - 无BGM
   - 后续添加外部BGM

5. 平台/宽高比
   - YouTube（16:9, 1920x1080）- 推荐
   - YouTube Shorts/TikTok（9:16, 1080x1920）
   - Instagram帖子（1:1, 1080x1080）
   - 自定义
```

---

## 工作流程概览

### 阶段1: Manim视频创建
1. 先创建旁白台本，测量每个片段的长度
2. 计算时间并设计Manim场景
3. 创建场景脚本（用注释明确每个部分的开始/结束时间）
4. 低质量预览渲染 → 确认时间
5. 高质量最终渲染

### 阶段2: 音频生成
1. 使用edge-tts生成旁白音频
2. 用精确的时间戳放置每个片段

### 阶段3: 音频/视频合成
1. 生成或准备BGM
2. 合成旁白和BGM（BGM音量: 推荐-18dB）
3. 使用ffmpeg合成视频和音频

---

## 重要: 时间同步的最佳实践

### 旁白优先设计

为防止视频和旁白不匹配，**先创建旁白台本**，并根据其长度设计视频时间。

```python
# 步骤1: 创建旁白台本，测量每个片段的长度
NARRATIONS = [
    "第一条旁白。",  # 测量结果: 3.5秒
    "第二条旁白。",  # 测量结果: 4.2秒
]

# 步骤2: 设计时间配置
"""
时间配置:
- 部分1: 0.0 - 4.0秒（旁白1 + 余量）
- 部分2: 4.0 - 9.0秒（旁白2 + 余量）
"""

# 步骤3: 反映到场景中
class MyScene(Scene):
    """
    时间配置（旁白同步版）:
    - 部分1: 0.0 - 4.0秒
    - 部分2: 4.0 - 9.0秒
    """
    def construct(self):
        self.section1()  # 4秒
        self.section2()  # 5秒

    def section1(self):
        """部分1: 0.0 - 4.0秒
        旁白 (0.5秒开始, 3.5秒): 第一条旁白。
        """
        # 0.0-1.5秒: 显示标题
        self.play(Write(title), run_time=1.5)
        # 1.5-4.0秒: 等待（等待旁白结束）
        self.wait(2.5)
        # 累计: 4.0秒
```

### 动画时间计算公式

```python
# 基本公式
等待时间 = 旁白结束时间 - 当前累计动画时间

# 示例: 旁白在8.5秒结束，当前动画已进行到6秒
self.wait(8.5 - 6.0)  # = 等待2.5秒
```

### 场景文档格式

请在每个部分用注释明确以下信息：

```python
def show_section(self):
    """部分名称: 开始时间 - 结束时间（所需时间）
    旁白1 (开始秒, 长度): 文本...
    旁白2 (开始秒, 长度): 文本...
    """
    # 时间戳注释
    # 0.0-1.0秒: 动画说明
    self.play(...)
    # 1.0-3.0秒: 等待
    self.wait(2)
    # 累计: 3.0秒
```

---

## 快速开始

### 项目设置
```bash
# 使用uv创建项目
uv init --python 3.12 my-animation
cd my-animation
uv add manim

# 音频处理用（完整版）
uv add edge-tts pydub

# 安装系统依赖包
# macOS
brew install pkg-config cairo pango ffmpeg
brew install --cask mactex  # LaTeX支持

# Linux (Ubuntu/Debian)
# sudo apt-get install libcairo2-dev libpango1.0-dev ffmpeg texlive-full

# Windows
# 1. 安装MiKTeX: https://miktex.org/download
# 2. 安装FFmpeg: https://ffmpeg.org/download.html
# 3. 添加路径到环境变量

# 确认安装
uv run manim checkhealth
```

### 基本场景结构
```python
from manim import *

# 日语字体设置
config.font = "Hiragino Sans"  # macOS
# config.font = "Noto Sans CJK JP"  # Linux
# config.font = "Yu Gothic"  # Windows

# 深色模式背景（推荐）
config.background_color = "#1a1a2e"

# 调色板
PRIMARY = "#4fc3f7"
SECONDARY = "#81c784"
ACCENT = "#ffb74d"
HIGHLIGHT = "#f06292"

class MyScene(Scene):
    def construct(self):
        title = Text("标题", font_size=48, color=PRIMARY)
        self.play(Write(title))
        self.wait(2)
```

### 渲染命令
```bash
# 低质量预览（快速）- 开发/时间确认用
uv run manim -ql scene.py MyScene --disable_caching

# 高质量 - 最终输出用
uv run manim -qh scene.py MyScene --disable_caching

# 4K质量
uv run manim -qk scene.py MyScene
```

---

## 按视频类型的场景结构

### 1. 解说/教育视频（论文解说等）

```python
class ExplainerScene(Scene):
    """
    时间配置:
    - 标题: 0-8秒
    - 部分1: 8-25秒
    - 部分2: 25-45秒
    - 总结: 45-55秒
    - 结尾: 55-65秒
    """
    def construct(self):
        self.show_title()
        self.show_section1()
        self.show_section2()
        self.show_summary()
        self.show_ending()

    def show_title(self):
        """标题: 0-8秒
        旁白 (0.5秒, 7秒): 标题说明...
        """
        title = Text("标题", font_size=72, color=PRIMARY, weight=BOLD)
        subtitle = Text("副标题", font_size=32, color=WHITE)
        subtitle.next_to(title, DOWN, buff=0.5)

        # 0.0-1.5秒: 标题
        self.play(Write(title), run_time=1.5)
        # 1.5-2.5秒: 副标题
        self.play(FadeIn(subtitle), run_time=1)
        # 2.5-7.0秒: 等待
        self.wait(4.5)
        # 7.0-8.0秒: 过渡
        self.play(FadeOut(title), FadeOut(subtitle), run_time=1)

    def show_section1(self):
        """部分1: 8-25秒"""
        section_title = Text("部分1", font_size=42, color=ACCENT)
        section_title.to_edge(UP, buff=0.5)
        self.play(Write(section_title), run_time=1)
        # ... 部分内容
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=1)

    def show_summary(self):
        """总结部分"""
        title = Text("总结", font_size=42, color=ACCENT)
        title.to_edge(UP, buff=0.5)

        points = VGroup(
            Text("• 要点1", font_size=26),
            Text("• 要点2", font_size=26),
            Text("• 要点3", font_size=26),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.5)
        points.next_to(title, DOWN, buff=0.8)
        points.shift(LEFT * 2)

        self.play(Write(title))
        for point in points:
            self.play(FadeIn(point, shift=RIGHT * 0.3), run_time=0.8)
            self.wait(1.5)

    def show_ending(self):
        """结尾"""
        self.play(*[FadeOut(mob) for mob in self.mobjects])
        thanks = Text("感谢观看", font_size=32, color=GRAY)
        self.play(Write(thanks))
        self.wait(3)
```

### 2. 演示视频

```python
class PresentationScene(Scene):
    """幻灯片形式的演示视频"""
    def construct(self):
        self.slide_title("演示标题", "演讲者姓名")
        self.slide_bullets("概要", ["要点1", "要点2", "要点3"])
        self.slide_diagram()

    def slide_title(self, title, author):
        t = Text(title, font_size=56, color=PRIMARY)
        a = Text(author, font_size=28, color=GRAY)
        a.next_to(t, DOWN, buff=0.5)
        self.play(Write(t), FadeIn(a))
        self.wait(2)
        self.play(FadeOut(t), FadeOut(a))

    def slide_bullets(self, title, bullets):
        t = Text(title, font_size=42, color=ACCENT).to_edge(UP)
        items = VGroup(*[
            Text(f"• {b}", font_size=28) for b in bullets
        ]).arrange(DOWN, aligned_edge=LEFT, buff=0.5)
        items.next_to(t, DOWN, buff=0.8).shift(LEFT * 2)

        self.play(Write(t))
        for item in items:
            self.play(FadeIn(item, shift=RIGHT * 0.5))
            self.wait(1)
        self.wait(1)
        self.play(*[FadeOut(mob) for mob in self.mobjects])
```

### 3. Logo动画

```python
class LogoAnimation(Scene):
    def construct(self):
        circle = Circle(radius=1.5, color=BLUE, fill_opacity=0.8)
        text = Text("LOGO", font_size=48, color=WHITE)

        self.play(GrowFromCenter(circle), run_time=1)
        self.play(Write(text), run_time=0.8)
        self.play(
            circle.animate.scale(1.1),
            text.animate.scale(1.1),
            rate_func=there_and_back,
            run_time=0.5
        )
        self.wait(1)
```

### 4. 流程图/循环图

```python
class CycleFlowScene(Scene):
    """循环图（思考→行动→观察等）"""
    def construct(self):
        # 创建框
        box1 = RoundedRectangle(width=3, height=1.2, corner_radius=0.15,
                                fill_color=PRIMARY, fill_opacity=0.3,
                                stroke_color=PRIMARY, stroke_width=2)
        box1.shift(UP * 1.5)
        label1 = Text("步骤1", font_size=22, color=PRIMARY)
        label1.move_to(box1.get_center())

        box2 = RoundedRectangle(width=3, height=1.2, corner_radius=0.15,
                                fill_color=SECONDARY, fill_opacity=0.3,
                                stroke_color=SECONDARY, stroke_width=2)
        box2.shift(RIGHT * 3 + DOWN * 0.8)
        label2 = Text("步骤2", font_size=22, color=SECONDARY)
        label2.move_to(box2.get_center())

        box3 = RoundedRectangle(width=3, height=1.2, corner_radius=0.15,
                                fill_color=ACCENT, fill_opacity=0.3,
                                stroke_color=ACCENT, stroke_width=2)
        box3.shift(LEFT * 3 + DOWN * 0.8)
        label3 = Text("步骤3", font_size=22, color=ACCENT)
        label3.move_to(box3.get_center())

        # 箭头
        arrow1 = Arrow(box1.get_right() + DOWN * 0.2, box2.get_top(), color=WHITE, buff=0.1)
        arrow2 = Arrow(box2.get_left(), box3.get_right(), color=WHITE, buff=0.1)
        arrow3 = Arrow(box3.get_top() + RIGHT * 0.3, box1.get_left() + DOWN * 0.2, color=WHITE, buff=0.1)

        # 依次动画
        self.play(Create(box1), Write(label1), run_time=1)
        self.play(Create(arrow1), run_time=0.5)
        self.play(Create(box2), Write(label2), run_time=1)
        self.play(Create(arrow2), run_time=0.5)
        self.play(Create(box3), Write(label3), run_time=1)
        self.play(Create(arrow3), run_time=0.5)
        self.wait(2)
```

---

## TTS旁白

### 可用语音

| 语言 | 语音ID | 性别 | 特点 |
|------|--------|------|------|
| 日语 | ja-JP-NanamiNeural | 女性 | 清晰易听（推荐）|
| 日语 | ja-JP-KeitaNeural | 男性 | 稳重的声音 |
| 英语 | en-US-JennyNeural | 女性 | 自然 |
| 英语 | en-US-GuyNeural | 男性 | 专业 |
| 英语 | en-US-AriaNeural | 女性 | 充满活力 |
| 中文 | zh-CN-XiaoxiaoNeural | 女性 | 标准 |
| 韩语 | ko-KR-SunHiNeural | 女性 | 标准 |

### 旁白长度测量

```python
# measure_audio.py
import asyncio
import edge_tts
from pydub import AudioSegment
import os

VOICE = "ja-JP-NanamiNeural"  # 或选定的语音

NARRATIONS = [
    "第一条旁白。",
    "第二条旁白。",
]

async def measure_duration(text: str, index: int) -> float:
    temp_path = f"temp_{index}.mp3"
    communicate = edge_tts.Communicate(text, VOICE, rate="+0%")
    await communicate.save(temp_path)

    audio = AudioSegment.from_mp3(temp_path)
    duration = len(audio) / 1000.0

    os.remove(temp_path)
    return duration

async def main():
    print("旁白音频长度测量:")
    print("=" * 50)
    total = 0
    for i, text in enumerate(NARRATIONS):
        duration = await measure_duration(text, i)
        total += duration
        print(f"{i+1}. [{duration:.2f}秒] {text[:30]}...")
    print("=" * 50)
    print(f"总计: {total:.2f}秒")

asyncio.run(main())
```

### 带时间戳的音频生成

```python
# generate_audio.py
import asyncio
import edge_tts
from pydub import AudioSegment
import os

VOICE = "ja-JP-NanamiNeural"

# (开始秒, 文本)
NARRATIONS = [
    (0.5, "第一条旁白。"),
    (8.5, "第二条旁白。"),
    (16.0, "第三条旁白。"),
]

async def generate_audio_segment(text: str, output_path: str):
    communicate = edge_tts.Communicate(text, VOICE, rate="+0%")
    await communicate.save(output_path)

async def main():
    audio_dir = "audio_segments"
    os.makedirs(audio_dir, exist_ok=True)

    # 指定视频总时长
    video_duration_ms = 120 * 1000
    final_audio = AudioSegment.silent(duration=video_duration_ms)

    print("生成旁白中...")
    for i, (start_time, text) in enumerate(NARRATIONS):
        segment_path = f"{audio_dir}/segment_{i:02d}.mp3"
        print(f"  {i+1}/{len(NARRATIONS)}: [{start_time:.1f}秒] {text[:30]}...")
        await generate_audio_segment(text, segment_path)

        segment = AudioSegment.from_mp3(segment_path)
        start_ms = int(start_time * 1000)
        final_audio = final_audio.overlay(segment, position=start_ms)

    final_audio.export("narration.mp3", format="mp3")
    print("完成: narration.mp3")

    # 清理
    for i in range(len(NARRATIONS)):
        os.remove(f"{audio_dir}/segment_{i:02d}.mp3")
    os.rmdir(audio_dir)

asyncio.run(main())
```

---

## BGM生成/添加

### 自动生成BGM（免版权）

无需外部下载，仅使用pydub即可生成环境音BGM。

```python
# generate_bgm.py
import math
import struct
import wave
import os
from pydub import AudioSegment

def generate_ambient_chord(frequencies, duration_ms, sample_rate=44100, amplitude=0.15):
    """合成多个频率生成环境音和弦"""
    n_samples = int(sample_rate * duration_ms / 1000)
    samples = []

    for i in range(n_samples):
        t = i / sample_rate
        value = 0
        for freq in frequencies:
            phase_mod = 0.002 * math.sin(2 * math.pi * 0.1 * t)
            value += amplitude * math.sin(2 * math.pi * freq * t * (1 + phase_mod))
        samples.append(value / len(frequencies))

    return samples

def apply_envelope(samples, attack_ms, decay_ms, sustain_level, release_ms, sample_rate=44100):
    """应用ADSR包络"""
    n_samples = len(samples)
    attack_samples = int(sample_rate * attack_ms / 1000)
    decay_samples = int(sample_rate * decay_ms / 1000)
    release_samples = int(sample_rate * release_ms / 1000)

    result = []
    for i, sample in enumerate(samples):
        if i < attack_samples:
            envelope = i / attack_samples
        elif i < attack_samples + decay_samples:
            decay_progress = (i - attack_samples) / decay_samples
            envelope = 1.0 - (1.0 - sustain_level) * decay_progress
        elif i > n_samples - release_samples:
            release_progress = (i - (n_samples - release_samples)) / release_samples
            envelope = sustain_level * (1.0 - release_progress)
        else:
            envelope = sustain_level
        result.append(sample * envelope)

    return result

def samples_to_wav(samples, filename, sample_rate=44100):
    """将样本写入WAV文件"""
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)

        for sample in samples:
            sample = max(-1.0, min(1.0, sample))
            packed = struct.pack('h', int(sample * 32767))
            wav_file.writeframes(packed)

def generate_ambient_bgm(duration_seconds=130, output_path="bgm.mp3"):
    """生成环境音BGM"""
    print("生成环境音BGM中...")

    sample_rate = 44100
    duration_ms = duration_seconds * 1000

    # C大调系和弦进行
    chord_progressions = [
        [130.81, 164.81, 196.00],  # C E G
        [146.83, 174.61, 220.00],  # D F A
        [164.81, 196.00, 246.94],  # E G B
        [130.81, 164.81, 196.00],  # C E G
    ]

    chord_duration_ms = 8000
    all_samples = []

    for i in range(int(duration_ms / chord_duration_ms) + 1):
        chord = chord_progressions[i % len(chord_progressions)]
        samples = generate_ambient_chord(chord, chord_duration_ms, sample_rate, amplitude=0.12)
        samples = apply_envelope(samples, 2000, 1000, 0.7, 2000, sample_rate)
        all_samples.extend(samples)

    all_samples = all_samples[:int(sample_rate * duration_seconds)]

    # 添加低音持续音
    print("  添加低音持续音中...")
    drone_freq = 65.41  # C2
    for i in range(len(all_samples)):
        t = i / sample_rate
        drone = 0.08 * math.sin(2 * math.pi * drone_freq * t)
        drone += 0.04 * math.sin(2 * math.pi * drone_freq * 1.5 * t)
        all_samples[i] += drone

    # 淡入淡出
    print("  淡入淡出处理中...")
    fade_in_samples = int(sample_rate * 3)
    fade_out_samples = int(sample_rate * 5)

    for i in range(fade_in_samples):
        all_samples[i] *= i / fade_in_samples

    for i in range(fade_out_samples):
        idx = len(all_samples) - fade_out_samples + i
        all_samples[idx] *= (fade_out_samples - i) / fade_out_samples

    # 写入WAV
    temp_wav = "temp_bgm.wav"
    samples_to_wav(all_samples, temp_wav, sample_rate)

    # 转换为MP3
    audio = AudioSegment.from_wav(temp_wav)
    audio.export(output_path, format="mp3", bitrate="128k")

    os.remove(temp_wav)
    print(f"BGM生成完成: {output_path}")

if __name__ == "__main__":
    generate_ambient_bgm(130, "bgm.mp3")
```

### 旁白和BGM合成

```python
# combine_final.py
from pydub import AudioSegment
import subprocess
import os

def combine_audio_and_video():
    """合成旁白和BGM，并与视频结合"""
    print("处理音频中...")

    narration = AudioSegment.from_mp3("narration.mp3")
    bgm = AudioSegment.from_mp3("bgm.mp3")

    # 调整BGM音量（-18dB）
    bgm = bgm - 18

    # 合成音频
    mixed_audio = narration.overlay(bgm)

    # 添加淡入淡出
    mixed_audio = mixed_audio.fade_in(2000).fade_out(3000)

    # 导出最终音频
    mixed_audio.export("final_audio.mp3", format="mp3")
    print("音频合成完成: final_audio.mp3")

    # 合成视频和音频
    print("合成视频和音频中...")
    subprocess.run([
        "ffmpeg",
        "-i", "media/videos/MyScene/1080p60/MyScene.mp4",
        "-i", "final_audio.mp3",
        "-c:v", "copy",
        "-c:a", "aac",
        "-shortest",
        "-y",
        "final_video.mp4"
    ])

    print("完成: final_video.mp4")

if __name__ == "__main__":
    combine_audio_and_video()
```

---

## 常用Manim动画

### 基础动画

```python
# 文本动画
self.play(Write(text))           # 书写效果
self.play(FadeIn(text))          # 淡入
self.play(FadeOut(text))         # 淡出
self.play(Transform(text1, text2))  # 变换

# 形状动画
self.play(Create(circle))        # 创建
self.play(GrowFromCenter(circle))  # 从中心生长
self.play(Uncreate(circle))      # 反向创建

# 移动动画
self.play(circle.animate.shift(RIGHT * 2))
self.play(circle.animate.scale(1.5))
self.play(circle.animate.rotate(PI/4))
```

### 组合动画

```python
# 同时播放多个动画
self.play(
    Write(text),
    Create(circle),
    run_time=2
)

# 顺序播放
for obj in objects:
    self.play(FadeIn(obj), run_time=0.5)

# Succession动画（按顺序）
self.play(Succession(
    Create(obj1),
    Create(obj2),
    Create(obj3)
))
```

### 高级动画

```python
# 沿路径移动
self.play(MoveAlongPath(dot, path))

# 更新属性
self.play(
    text.animate.set_color(RED),
    circle.animate.set_fill_opacity(0.5)
)

# 动画组
self.play(
    AnimationGroup(
        FadeIn(obj1),
        Write(obj2),
        lag_ratio=0.5  # 延迟比例
    )
)
```

---

## 常用Manim对象

### 文本对象

```python
# 基本文本
text = Text("文本", font_size=48, color=WHITE)

# 多行文本
text = Text("第一行\n第二行", line_spacing=0.8)

# 数学公式
formula = MathTex("E = mc^2", font_size=48)

# 带格式的数学公式
formula = MathTex(
    r"\sum_{i=1}^{n} i = \frac{n(n+1)}{2}",
    font_size=48
)
```

### 形状对象

```python
# 基本形状
circle = Circle(radius=1, color=BLUE)
square = Square(side_length=2, color=RED)
rectangle = Rectangle(width=3, height=1.5, color=GREEN)

# 线条
line = Line(LEFT * 2, RIGHT * 2, color=YELLOW)
arrow = Arrow(LEFT, RIGHT, color=ORANGE)

# 多边形
triangle = RegularPolygon(n=3, radius=1.5, color=PURPLE)
hexagon = RegularPolygon(n=6, radius=1.5, color=CYAN)

# 圆角矩形
rounded_rect = RoundedRectangle(
    width=3, height=1.5,
    corner_radius=0.3,
    color=PINK
)
```

### 组合对象

```python
# 垂直排列
group = VGroup(
    Text("项目1"),
    Text("项目2"),
    Text("项目3")
).arrange(DOWN, buff=0.5)

# 水平排列
group = HGroup(
    Circle(),
    Square(),
    Triangle()
).arrange(RIGHT, buff=0.5)

# 嵌套组合
outer = VGroup(
    Text("标题"),
    VGroup(
        Text("子项1"),
        Text("子项2")
    ).arrange(DOWN)
)
```

---

## 常用布局和定位

### 定位方法

```python
# 相对定位
obj.next_to(other, direction=RIGHT, buff=0.5)
obj.to_edge(UP, buff=0.5)
obj.shift(RIGHT * 2)
obj.move_to(ORIGIN)

# 对齐
obj.align_to(other, UP)
obj.align_to(other, LEFT)

# 居中
obj.center()
```

### 布局示例

```python
# 创建标题和内容
title = Text("标题", font_size=48)
content = Text("内容文本", font_size=32)

# 布局
title.to_edge(UP, buff=1)
content.next_to(title, DOWN, buff=0.8)

# 多列布局
left_col = VGroup(*left_items).arrange(DOWN, buff=0.5)
right_col = VGroup(*right_items).arrange(DOWN, buff=0.5)
columns = HGroup(left_col, right_col).arrange(RIGHT, buff=2)
columns.center()
```

---

## 调试和故障排除

### 常见问题

```python
# 字体问题
# 如果日文字符显示不正确
config.font = "Noto Sans CJK JP"  # Linux
config.font = "Yu Gothic"  # Windows
config.font = "Hiragino Sans"  # macOS

# LaTeX问题
# 如果数学公式不渲染
# 确保安装了TeX Live (Linux) 或 MacTeX (macOS) 或 MiKTeX (Windows)

# 视频质量问题
# 使用更高的质量设置
# -ql: 低质量（快速）
# -qm: 中等质量
# -qh: 高质量
# -qk: 4K质量

# 性能问题
# 禁用缓存
uv run manim -ql scene.py MyScene --disable_caching
```

### 调试技巧

```python
# 添加时间戳注释
# 在代码中添加注释标记时间
# 0.0-2.0秒: 动画描述
self.play(...)

# 使用print调试
print(f"当前时间: {self.renderer.time}")

# 测试单个部分
# 注释掉其他部分，专注于测试特定部分
```

---

## 完整工作流示例

### 创建完整视频的步骤

```bash
# 1. 创建项目
uv init --python 3.12 my-video
cd my-video
uv add manim edge-tts pydub

# 2. 创建场景脚本
# 编辑 scene.py

# 3. 测量旁白长度
uv run python measure_audio.py

# 4. 调整场景时间
# 根据测量结果调整 run_time 和 wait

# 5. 预览渲染
uv run manim -ql scene.py MyScene --disable_caching

# 6. 最终渲染
uv run manim -qh scene.py MyScene --disable_caching

# 7. 生成旁白
uv run python generate_audio.py

# 8. 生成BGM
uv run python generate_bgm.py

# 9. 合成最终视频
uv run python combine_final.py
```

---

## 最佳实践

### 代码组织

```python
# 使用类方法组织场景
class MyScene(Scene):
    def construct(self):
        self.intro()
        self.main_content()
        self.conclusion()

    def intro(self):
        """介绍部分"""
        pass

    def main_content(self):
        """主要内容"""
        pass

    def conclusion(self):
        """结论部分"""
        pass
```

### 时间管理

```python
# 使用常量定义时间
INTRO_DURATION = 8
SECTION1_DURATION = 17
SECTION2_DURATION = 20

# 在场景中使用
self.play(..., run_time=INTRO_DURATION)
self.wait(SECTION1_DURATION)
```

### 可重用组件

```python
# 创建可重用的组件函数
def create_title(text, color=PRIMARY):
    return Text(text, font_size=72, color=color, weight=BOLD)

def create_bullet(text, font_size=28):
    return Text(f"• {text}", font_size=font_size)

# 在场景中使用
title = create_title("我的标题")
bullet = create_bullet("要点")
```

---

## 参考资源

### 官方文档
- Manim Community: https://docs.manim.community/
- Manim GitHub: https://github.com/ManimCommunity/manim

### 学习资源
- Manim教程: https://www.manim.community/
- 示例代码: https://github.com/ManimCommunity/manim/tree/main/examples

### 工具
- edge-tts: https://github.com/rany2/edge-tts
- pydub: https://github.com/jiaaro/pydub
- ffmpeg: https://ffmpeg.org/
