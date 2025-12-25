const express = require('express');
const axios = require('axios');
const app = express();

// Railway otomatis ngasih PORT, kalau di lokal pakai 3000
const port = process.env.PORT || 3000;

app.use(express.json());

// ==================================================
// 🔥 LOGIKA AGUNGDEVX (KODE ASLI KAMU)
// ==================================================

const AgungDevXAI = {
    conversations: {},

    handler: async (userId, text) => {
        try {
            // Setup Waktu Indonesia
            const d = new Date();
            const jam = d.toLocaleTimeString("en-US", { timeZone: "Asia/Jakarta" });
            const hari = d.toLocaleDateString('id-ID', { weekday: 'long' });
            const tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

            const logic = `You are AgungDevX. You are a beginner developer and a bit aggressive. Use the typical term *mas brow* to call people. Respond to the point. Use the date format ${tgl}, time ${jam}, day ${hari}`;

            // Logic Memory Simpel
            if (AgungDevXAI.conversations[userId]) {
                AgungDevXAI.conversations[userId] += `\nUser: ${text}`;
            } else {
                AgungDevXAI.conversations[userId] = `User: ${text}`;
            }

            // Panggil AI
            const response = await AgungDevXAI.chatWithAI(AgungDevXAI.conversations[userId], logic);

            if (!response) {
                return {
                    status: 500,
                    success: false,
                    message: "AI na error euy, lieur meureun."
                };
            }

            // Simpan jawaban ke memory
            AgungDevXAI.conversations[userId] += `\n${response}`;

            return {
                status: 200,
                success: true,
                payload: {
                    user_id: userId,
                    response: response,
                    metadata: { date: tgl, time: jam }
                }
            };

        } catch (e) {
            return { status: 500, success: false, message: e.message };
        }
    },

    chatWithAI: async (text, logic) => {
        try {
            // Nembak API ChatEverywhere pakai AXIOS (Aman di Railway)
            const { data } = await axios.post("https://chateverywhere.app/api/chat/", {
                "model": {
                    "id": "gpt-4",
                    "name": "GPT-4",
                    "maxLength": 32000,
                    "tokenLimit": 8000,
                    "completionTokenLimit": 5000,
                    "deploymentName": "gpt-4"
                },
                "messages": [{ "role": "user", "content": text }],
                "prompt": logic,
                "temperature": 0.5
            }, {
                headers: {
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                }
            });

            return data;
        } catch (error) {
            console.error("Error API:", error.message);
            return null;
        }
    }
};

// ==================================================
// 🌐 SETUP ROUTE AGAR BISA DIAKSES LEWAT LINK
// ==================================================

// Handler Utama (Bisa GET biasa, Bisa POST)
const apiHandler = async (req, res) => {
    // Ambil data entah dari URL (?text=...) atau dari Body JSON
    const text = req.query.text || req.query.message || req.body.text || req.body.message;
    const userId = req.query.user || req.body.user || "user_default";

    // Validasi
    if (!text) {
        return res.status(400).json({
            status: 400,
            success: false,
            creator: "AgungDevX",
            message: "Mana teksna mas brow? Masukkan parameter ?text=Halo"
        });
    }

    // Jalankan Logic
    const result = await AgungDevXAI.handler(userId, text);
    
    // Kirim JSON
    res.status(result.status).json(result);
};

// Pasang di route utama '/'
app.get('/', apiHandler);
app.post('/', apiHandler);

// Jalankan Server Railway
app.listen(port, () => {
    console.log(`🚀 AgungDevX Server running on port ${port}`);
});
