export async function onRequest(context) {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };

    // Handle CORS preflight requests
    if (context.request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers
        });
    }

    if (context.request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
            status: 405,
            headers
        });
    }

    try {
        const { prompt } = await context.request.json();
        if (!prompt) {
            return new Response(JSON.stringify({ error: "No prompt provided." }), {
                status: 400,
                headers
            });
        }

        // Read API key from Cloudflare Pages Environment Variables
        const apiKey = context.env.GROQ_API_KEY || "";

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "Groq API Key is not configured on Cloudflare. Please set GROQ_API_KEY in Cloudflare Pages Dashboard." }), {
                status: 500,
                headers
            });
        }

        const payload = {
            model: "qwen/qwen3-32b",
            messages: [
                {
                    role: "system",
                    content: "Anda adalah analis bisnis senior yang ahli dalam data visualization dan business intelligence. Jawab profesional, ringkas, dan langsung ke poin. Jangan pernah menulis proses berpikir dalam respons akhir."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.6,
            max_tokens: 2000
        };

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            return new Response(JSON.stringify({ error: `Groq API returned error: ${response.status}`, details: errText }), {
                status: response.status,
                headers
            });
        }

        const decoded = await response.json();
        if (decoded.choices && decoded.choices[0] && decoded.choices[0].message) {
            return new Response(JSON.stringify({ result: decoded.choices[0].message.content }), {
                status: 200,
                headers
            });
        } else {
            return new Response(JSON.stringify({ error: "Invalid API response from Groq.", raw: decoded }), {
                status: 500,
                headers
            });
        }

    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), {
            status: 500,
            headers
        });
    }
}
