export default async function handler(req, res) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    // =========================
    // API KEY
    // =========================

    const key = req.query?.key;

    if (!key) {
        return res.status(401).json({
            success: false,
            error: "API key required",
            usage: "/api/chat?key=aritra&prompt=hi"
        });
    }

    if (key !== "aritra") {
        return res.status(401).json({
            success: false,
            error: "Invalid API key"
        });
    }

    // =========================
    // GET REQUEST
    // =========================

    if (req.method === "GET") {

        const prompt = req.query?.prompt;

        // No prompt = API status
        if (!prompt) {
            return res.status(200).json({
                success: true,
                developer: "@its_aritra_nath",
                api: "Qwen 3.8 27B API",
                status: "online",
                authentication: "API key",
                endpoint: "/api/chat",
                usage: "/api/chat?key=aritra&prompt=hi"
            });
        }

        try {

            const ollamaUrl = process.env.OLLAMA_URL;

            if (!ollamaUrl) {
                return res.status(500).json({
                    success: false,
                    error: "OLLAMA_URL is not configured"
                });
            }

            const ollamaResponse = await fetch(
                `${ollamaUrl}/api/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "qwen3.8-27b-uncensored-mtp:latest",
                        messages: [
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        stream: false
                    })
                }
            );

            const text = await ollamaResponse.text();

            if (!ollamaResponse.ok) {
                return res.status(502).json({
                    success: false,
                    error: "Ollama request failed",
                    upstream_status: ollamaResponse.status,
                    upstream_response: text.slice(0, 2000)
                });
            }

            let data;

            try {
                data = JSON.parse(text);
            } catch {
                return res.status(502).json({
                    success: false,
                    error: "Invalid JSON received from Ollama",
                    raw_response: text.slice(0, 2000)
                });
            }

            // =========================
            // FINAL RESPONSE
            // =========================

            return res.status(200).json({

                success: true,

                developer: "@its_aritra_nath",

                api: "Qwen 3.8 27B API",

                status: "online",

                authentication: "API key",

                endpoint: "/api/chat",

                model:
                    data.model ||
                    "qwen3.8-27b-uncensored-mtp:latest",

                prompt: prompt,

                response:
                    data.message?.content || "",

                thinking:
                    data.message?.thinking || "",

                done:
                    data.done ?? true,

                done_reason:
                    data.done_reason || null
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                error: "Internal server error",
                message: error.message
            });
        }
    }

    // =========================
    // POST REQUEST
    // =========================

    if (req.method === "POST") {

        return res.status(200).json({
            success: true,
            message: "POST endpoint available",
            usage: "Use GET with ?key=aritra&prompt=your-question"
        });
    }

    return res.status(405).json({
        success: false,
        error: "Method not allowed"
    });
}
