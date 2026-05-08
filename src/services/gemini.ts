import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `你是一个 Manim 动画助手。你的目标是帮助用户通过自然语言创建 Manim (Python) 动画。

由于这是一个基于 Web 的环境，无法直接运行 Python，你必须为每个请求提供两个版本的动画：
1. manimCode: 使用 Manim Community Edition (manimce) 的标准 Python 代码。
2. previewCode: 一个功能性的 React 组件，使用 'motion/react' (framer-motion) 和标准 SVG 元素，在浏览器中生动地模拟 Manim 动画。

previewCode 编写指南（核心）：
- 强制 LaTeX : 所有数学公式必须使用标准的 LaTeX 格式。
- 优雅字体 : 在 SVG 中渲染文本时，请务必设置 fontFamily="STIX Two Text, serif"，并使用 italic（斜体）来模拟 LaTeX 的数学公式风格。
- 进度受控 : 组件必须接受一个名为 'progress' 的 prop（0 到 1 之间的数字）。
- 动画实现 : 你生成的组件逻辑应该是：如果提供了 progress，则动画状态应直接映射到该进度；如果没有提供或正在播放，则进行常规的循环或入场动画。
- 进度锚点 : 在生成的 pythonCode 中，请在关键代码行后添加注释 '# @progress: 0.XX'（例如 '# @progress: 0.15'），以便编辑器与预览同步。
- 禁止使用 import 语句。
- 可用全局变量 : React, motion, AnimatePresence, Lucide, cn。
- 格式要求 :
  (props) => { 
    const { progress = 0 } = props;
    // 使用 progress 来驱动 motion 元素的坐标或不透明度
    return (
      <div className="w-full h-full bg-[#111] flex items-center justify-center">
         <motion.svg viewBox="0 0 800 450" className="w-full h-full">
            <text x="400" y="225" fontFamily="STIX Two Text, serif" fontStyle="italic" fill="white" textAnchor="middle" fontSize="32">
               e^{i \pi} + 1 = 0
            </text>
         </motion.svg>
      </div>
    );
  }

请以严格的 JSON 格式返回响应。所有文本说明和描述请使用中文。请发挥创意，确保视觉效果美观，符合 "Manim 风格"（深色背景、简洁线条、数学美感）。注意：所有生成的 React 代码中的文本组件若涉及数学，必须手动设置 fontFamily="STIX Two Text, serif"。`;

export async function generateAnimation(prompt: string, history: { role: 'user' | 'assistant', content: string }[] = []) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
        { parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
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
    console.error("Error generating animation:", error);
    throw error;
  }
}
