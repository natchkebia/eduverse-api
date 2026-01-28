import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!apiKey) {
  // dev-ში რომ არ დაგენგრეს app, უბრალოდ დაგილოგავს
  console.warn('⚠️ OPENAI_API_KEY is missing. translate() will return original text.');
}

const openai = new OpenAI({ apiKey: apiKey || 'missing' });

export async function translate(
  text: string,
  from: 'ka' | 'en',
  to: 'ka' | 'en',
): Promise<string> {
  if (!text) return text;
  if (from === to) return text;

  // თუ key არ გაქვს, fallback
  if (!apiKey) return text;

  try {
    const res = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional translator. Translate accurately and naturally. Return ONLY the translation, no quotes, no explanations.',
        },
        {
          role: 'user',
          content: `Translate from ${from === 'ka' ? 'Georgian' : 'English'} to ${
            to === 'ka' ? 'Georgian' : 'English'
          }:\n\n${text}`,
        },
      ],
    });

    return res.choices[0]?.message?.content?.trim() || text;
  } catch (e) {
    console.error('translate() failed:', e);
    return text;
  }
}
