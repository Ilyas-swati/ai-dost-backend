// AI Dost Backend - Chat Endpoint
// Deployed on Vercel
// AI Provider: Google Gemini

export default async function handler(req, res) {
    // CORS headers (Android app ke liye)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Sirf POST allow
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, language } = req.body || {};

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // API key environment variable se aati hai (Vercel settings mein set karenge)
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: 'Server configuration error: API key missing'
            });
        }

        // Language ke hisaab se system prompt
        let systemPrompt = "You are AI Dost, a helpful AI assistant. Reply concisely and helpfully.";
        if (language === 'ur') {
            systemPrompt = "آپ AI Dost ہیں، ایک مددگار AI اسسٹنٹ۔ اردو میں مختصر اور مددگار جواب دیں۔";
        } else if (language === 'roman') {
            systemPrompt = "You are AI Dost, a helpful AI assistant. Reply in Roman Urdu (Urdu written in English letters). Keep replies short and helpful.";
        } else {
            systemPrompt = "You are AI Dost, a helpful AI assistant. Reply in English. Keep replies short and helpful.";
        }

        // Gemini API call
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: systemPrompt + "\n\nUser: " + message }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
                topP: 0.95
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Gemini API error:', errText);
            return res.status(500).json({
                error: 'AI service error. Please try again.'
            });
        }

        const data = await response.json();

        // Response parse karein
        let reply = '';
        if (data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                reply = candidate.content.parts[0].text || '';
            }
        }

        if (!reply) {
            return res.status(500).json({ error: 'Empty response from AI' });
        }

        // Success
        return res.status(200).json({ reply: reply.trim() });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Server error: ' + (error.message || 'Unknown')
        });
    }
}
