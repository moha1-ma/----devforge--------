import { invokeLLM } from "./_core/llm";
import { addPrivateAiMessage, getGithubProjectLink, getPrivateAiMessages, markPrivateAiThreadManaged } from "./privateWorkspace";
import { researchQualityInstruction, resolveResearchMode, type ResearchMode } from "./aiResearchPolicy";

function responseText(content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } } | { type: "file_url"; file_url: { url: string } }>) {
  if (typeof content === "string") return content.trim();
  return content.filter(part => part.type === "text").map(part => part.text).join("\n").trim();
}

export async function askPrivateAiAssistant(input: { ownerId: number; threadId: number; content: string; githubProjectId?: number; researchMode?: ResearchMode }) {
  const content = input.content.trim();
  if (!content) throw new Error("اكتب رسالة قبل الإرسال");
  await addPrivateAiMessage({ ownerId: input.ownerId, threadId: input.threadId, role: "user", content });
  const history = await getPrivateAiMessages(input.ownerId, input.threadId);
  const recentMessages = history.slice(-12).map(message => ({ role: message.role, content: message.content }));
  const githubLink = input.githubProjectId ? await getGithubProjectLink(input.ownerId, input.githubProjectId) : null;
  if (input.githubProjectId && !githubLink) throw new Error("اختر مستودع GitHub لهذا المشروع أولًا من صفحة GitHub.");
  const githubContext = githubLink
    ? `سياق GitHub الذي اختاره المالك لهذه الرسالة فقط: المستودع ${githubLink.repositoryFullName}، الفرع ${githubLink.defaultBranch}. هذه بيانات تعريف محفوظة، وليست قراءة مباشرة من GitHub. لا تدّع أنك فتحت المستودع أو قرأت ملفاته أو نفذت أي عملية GitHub. استخدمها فقط لتخصيص الشرح والأمثلة، واطلب من المالك لصق أي ملف أو خطأ يريد مراجعته.`
    : null;
  const research = resolveResearchMode(input.researchMode);
  const response = await invokeLLM({
    model: "gpt-5-mini",
    maxCompletionTokens: 420,
    reasoning: { effort: "minimal" },
    messages: [
      { role: "system", content: `أنت مساعد DevForge الخاص بالمالك. أجب بلغة المستخدم، والعربية هي اللغة الافتراضية. قدّم جوابًا عمليًا عالي الجودة: ابدأ بالخلاصة، ثم أعط خطوات مرتبة أو مثالًا صغيرًا عند الحاجة، وافصل بين الحقائق والافتراضات والمخاطر. ساعد في تخطيط المنتجات، البرمجة، مراجعة النصوص، وتفكيك المهام. لا تطلب أو تكشف مفاتيح سرية أو كلمات مرور، ولا تدّع تنفيذ تغييرات خارج هذه المحادثة. ${researchQualityInstruction(input.researchMode)}` },
      ...(githubContext ? [{ role: "system" as const, content: githubContext }] : []),
      ...recentMessages,
    ],
  });
  const answer = responseText(response.choices[0]?.message.content ?? "");
  if (!answer) throw new Error("لم يُرجع النموذج ردًا صالحًا. حاول برسالة أقصر.");
  await addPrivateAiMessage({ ownerId: input.ownerId, threadId: input.threadId, role: "assistant", content: answer });
  await markPrivateAiThreadManaged(input.ownerId, input.threadId);
  return { answer, model: "gpt-5-mini", usage: response.usage ?? null, research, githubContext: githubLink ? { repositoryFullName: githubLink.repositoryFullName, defaultBranch: githubLink.defaultBranch } : null };
}
