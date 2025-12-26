exports.handler = async (event, context) => {
  // 1. SETUP HEADER (Biar bisa diakses dari mana aja)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle Preflight Request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 2. AMBIL DATA INPUT
    // Cek apakah dari URL (?word=...) atau Body JSON
    const params = event.queryStringParameters || {};
    let body = {};
    if (event.body) {
      try { body = JSON.parse(event.body); } catch (e) {}
    }

    // Prioritas pengambilan data
    const word = params.word || body.word || params.text || body.text;
    const fromLang = params.from || body.from || 'en';
    const toLang = params.to || body.to || 'id';

    // Validasi: Kalau gak ada kata, tolak.
    if (!word) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          status: false,
          creator: "SofiApis",
          message: "Masukkan kata! Contoh: ?word=Hello"
        })
      };
    }

    // 3. JALANKAN LOGIKA (Panggil Fungsi di bawah)
    const result = await translateAI(word, fromLang, toLang);

    // 4. KIRIM HASIL BERSIH
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 200,
        creator: "SofiApis",
        result: result
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 500,
        message: "Server Error",
        error: error.message
      })
    };
  }
};

// ==========================================
// 🧠 LOGIKA TRANSLATE (Output Rapi)
// ==========================================

async function translateAI(word, from, to) {
    const url = 'https://api.translasion.com/enhance/dictionary';
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept-Encoding': 'identity',
            'Content-Type': 'application/json; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({
            'from': from,
            'to': to,
            'word': word,
            'gpt_switch': '0',
            'override_from_flag': '0',
            'scene': 100,
            'system_lang': 'en',
            'app_key': ''
        })
    });

    if (!response.ok) throw new Error("Gagal menghubungi server pusat.");
    
    const json = await response.json();
    const raw = json.data;

    if (!raw) throw new Error("Kata tidak ditemukan.");

    // CLEANING DATA (Kita rapikan biar enak dilihat)
    return {
        text_origin: raw.word,
        text_translate: raw.translated,
        spelling: raw.pronunciation || "-",
        phonetic: {
            us: raw.pron?.us || "-",
            uk: raw.pron?.uk || "-"
        },
        audio: {
            us: raw.pron_audio?.us || null,
            uk: raw.pron_audio?.uk || null
        }
    };
}
