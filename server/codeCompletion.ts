import { invokeLLM } from "./_core/llm";
import { codeSuggestionOutputSchema, codeSuggestionSafetyInstruction, parseCodeSuggestion, prepareCodeSuggestionContext, type CodeSuggestionMode } from "./codeCompletionPolicy";
import { readPrivateSourceFile } from "./privateWorkspace";

function getText(content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } } | { type: "file_url"; file_url: { url: string } }>) { return typeof content === "string" ? content : content.filter(item => item.type === "text").map(item => item.text).join("\n"); }

export async function createCodeSuggestion(input: { ownerId: number; sourceFileId: number; content: string; cursorOffset: number; mode: CodeSuggestionMode }) {
  const owned = await readPrivateSourceFile(input.ownerId, input.sourceFileId);
  const context = prepareCodeSuggestionContext(input.content, input.cursorOffset);
  const intent = input.mode === "complete" ? "أكمل النص البرمجي الناقص عند موضع المؤشر فقط. لا تعِد النص السابق." : "اقترح نسخة محسنة للجزء المحيط بالمؤشر فقط. حافظ على هدفه ولا توسع النطاق.";
  const response = await invokeLLM({ model: "gpt-5-mini", maxCompletionTokens: 500, reasoning: { effort: "minimal" }, responseFormat: codeSuggestionOutputSchema, messages: [{ role: "system", content: codeSuggestionSafetyInstruction }, { role: "user", content: `العملية: ${input.mode}\nاللغة: ${owned.file.language}\nالمسار: ${owned.file.path}\n${intent}\n\nالنص قبل المؤشر:\n---\n${context.before}\n---\n\nالنص بعد المؤشر:\n---\n${context.after}\n---` }] });
  const suggestion = parseCodeSuggestion(getText(response.choices[0]?.message.content ?? ""), input.mode);
  return { ...suggestion, language: owned.file.language, sourceFileId: owned.file.id };
}
