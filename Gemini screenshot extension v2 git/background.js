async function sendToGemini(base64Image, tabId) {
    const API_KEY = "Your_Key_Here"; 
    // Stable March 2026 Model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

    try {
        const imageData = base64Image.split(',')[1];
        
        // Timeout logic: if Gemini takes >15s, tell the user
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Solve this. Final answer only. Be brief." },
                        { inline_data: { mime_type: "image/png", data: imageData } }
                    ]
                }]
            })
        });

        clearTimeout(timeout);
        const json = await response.json();

        if (json.error) {
            chrome.tabs.sendMessage(tabId, { action: "display_response", data: "API Error: " + json.error.message });
        } else if (json.candidates && json.candidates[0]?.content?.parts?.[0]?.text) {
            chrome.tabs.sendMessage(tabId, { action: "display_response", data: json.candidates[0].content.parts[0].text });
        } else {
            chrome.tabs.sendMessage(tabId, { action: "display_response", data: "Error: Gemini blocked this image (Safety)." });
        }
    } catch (err) {
        let msg = "Network Error: Connection failed.";
        if (err.name === 'AbortError') msg = "Timeout: Gemini is taking too long.";
        chrome.tabs.sendMessage(tabId, { action: "display_response", data: msg });
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "capture_screen") {
        const tabId = sender.tab.id; 
        const windowId = sender.tab.windowId; // More reliable than 'null'
        
        chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                chrome.tabs.sendMessage(tabId, { action: "display_response", data: "Error: Capture failed. Refresh the page." });
                return;
            }
            sendToGemini(dataUrl, tabId);
        });

        return true; // Keeps the communication line open for the async fetch
    }
});