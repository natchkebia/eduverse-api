// export async function translate(
//   text: string,
//   from: 'ka' | 'en',
//   to: 'ka' | 'en',
// ): Promise<string> {
//   if (!text) return text;
//   if (from === to) return text;

//   try {
//     const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
//       text,
//     )}&langpair=${from}|${to}`;

//     const res = await fetch(url);
//     const data = await res.json();

//     const translated = data?.responseData?.translatedText;
//     return translated?.trim() || text;
//   } catch (e) {
//     console.error('MyMemory translate failed:', e);
//     return text;
//   }
// }
