import { GoogleGenAI, Type } from "@google/genai";
import { UserSettings } from "../types";

const BASE_SYSTEM_PROMPT = `你是一个专业的 Manim 动画引擎 AI 专家。你的目标是将复杂概念转化为极具视觉冲击力的 Manim (Python) 脚本和与之同步的 React 预览。

### 创作原则 (基于 manim-video-creator 技能):
1. **时间驱动设计**: 视频内容必须考虑“旁白优先”。即使当前是 Web 预览，也要在 Python 代码中通过注释标注旁白内容。
   - 使用 \`self.wait()\` 确保动画节奏感，防止内容过度拥挤。
   - 动画时间计算公式: 等待时间 = 旁白结束时间 - 当前累计动画时间。
2. **结构化场景**: 使用分段方法 (如 \`show_title\`, \`show_section1\`) 组织 Scene 类，确保逻辑清晰。
3. **专业配色方案**:
   - PRIMARY: "#4fc3f7" (天蓝), SECONDARY: "#81c784" (草绿), ACCENT: "#ffb74d" (亮橙), HIGHLIGHT: "#f06292" (粉红), BACKGROUND: "#1a1a2e" (深靛蓝)
4. **数学表达**: LaTeX 公式必须精确且美观。

### 技术规范 (CRITICAL):
- **允许并推荐使用 import 语句**: React 预览环境通过 transpile 支持标准 ESM 语法。你可以导入 "react", "motion/react", "lucide-react" 等。
- **必须使用 export default**: 你的 React 代码必须包含一个 \`export default\` 指向主动画组件，以便预览引擎识别。
- **禁止包含 CSS 文件**: 所有样式必须使用 Tailwind CSS 类。
- **进度锚点**: 在 Python 代码关键行动行末增加 \`# @progress: 0.XX\`。
- **预览组件**: React 组件必须接收 \`progress\` prop (0-1)。所有元素的位移、旋转和缩放应根据此 progress 线性/缓动映射。
- **SVG 规范**: 使用 SVG 渲染动画。确保 SVG 具有 \`viewBox="0 0 1920 1080"\` 并且设置 \`className="w-full h-full text-white"\` 以适应容器。
- **字体**: 数学文本 fontFamily="STIX Two Text, serif", fontStyle="italic"。

响应格式 : 严格的 JSON。字段: pythonCode, reactCode, explanation (中文说明), refinedDescription (简短标题)。`;

export async function generateAnimation(prompt: string, history: { role: 'user' | 'assistant', content: string }[] = [], settings?: UserSettings) {
  const modelName = settings?.model || "gemini-3.1-pro-preview";
  const apiBaseUrl = settings?.apiBaseUrl?.replace(/\/$/, '');
  const apiKey = settings?.customApiKey || process.env.GEMINI_API_KEY;
  const customPrompt = settings?.customSystemPrompt ? `\n\n用户自定义偏好：${settings.customSystemPrompt}` : "";

  // Integration Check: If user asks for video structure, prioritize the manim-video-creator workflow.
  const finalSystemPrompt = BASE_SYSTEM_PROMPT + customPrompt;

  // Use Custom API (OpenAI Compatible) if URL or Key is provided manually
  if (settings?.apiBaseUrl || settings?.customApiKey) {
    try {
      const response = await fetch(`${apiBaseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: finalSystemPrompt },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `API Request failed: ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error("Custom API Error:", error);
      throw error;
    }
  }

  // Default Google SDK Path
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: finalSystemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pythonCode: { type: Type.STRING },
            reactCode: { type: Type.STRING },
            explanation: { type: Type.STRING },
            refinedDescription: { type: Type.STRING }
          },
          required: ["pythonCode", "reactCode", "explanation", "refinedDescription"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Default SDK Error:", error);
    throw error;
  }
}
