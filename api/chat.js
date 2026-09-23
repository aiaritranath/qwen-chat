export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const ollamaUrl = process.env.OLLAMA_URL;

        if (!ollamaUrl) {
            return res.status(500).json({
                error: "OLLAMA_URL environment variable is missing"
            });
        }

        const response = await fetch(
            ollamaUrl + "/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(req.body)
            }
        );

        const contentType =
            response.headers.get("content-type") || "";

        const responseText =
            await response.text();

        if (!response.ok) {

            return res.status(response.status).json({
                error: "Ollama request failed",
                upstream_status: response.status,
                upstream_response: responseText.slice(0, 2000)
            });
        }

        if (contentType.includes("application/json")) {

            return res.status(200).json(
                JSON.parse(responseText)
            );

        }

        return res.status(200).send(responseText);

    } catch (error) {

        console.error("API ERROR:", error);

        return res.status(500).json({
            error: error.message
        });
    }
}
