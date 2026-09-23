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
    // API KEY FROM URL
    // =========================

    const key =
        req.query?.key ||
        new URL(req.url, `https://${req.headers.host}`).searchParams.get("key");

    if (!key) {
        return res.status(401).json({
            success: false,
            error: "API key required",
            usage: "/api/chat?key=aritra"
        });
    }

    if (key !== "aritra") {
        return res.status(401).json({
            success: false,
            error: "Invalid API key"
        });
    }

    // =========================
    // GET
    // =========================

    if (req.method === "GET") {

        return res.status(200).json({
            success: true,
            developer: "@its_aritra_nath",
            api: "Qwen 3.8 27B API",
            status: "online",
            authentication: "API key",
            endpoint: "/api/chat"
        });
    }

    // =========================
    // POST
    // =========================

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed",
            allowed_methods: ["GET", "POST"]
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

        const body = req.body || {};

        const model =
            body.model ||
            "qwen3.8-27b-uncensored-mtp:latest";

        const messages = body.messages;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                error: "messages must be a non-empty array"
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
                    model,
                    messages,
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

        return res.status(200).json({
            success: true,
            developer: "@its_aritra_nath",
            model: data.model || model,
            created_at: data.created_at || null,
            response: data.message?.content || "",
            thinking: data.message?.thinking || "",
            done: data.done ?? true,
            done_reason: data.done_reason || null
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            error: "Internal server error",
            message: error.message
        });
    }
}
