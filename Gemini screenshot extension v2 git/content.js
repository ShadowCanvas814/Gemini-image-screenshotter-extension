let isToggled = true; 

// 1. The Key Listener
window.addEventListener('keydown', (e) => {
    // Only trigger if 'z' is pressed and we aren't typing in an input box
    if (isToggled && e.key.toLowerCase() === 'z' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        createGeminiWindow("Thinking..."); 
        chrome.runtime.sendMessage({ action: "capture_screen" });
    }
});

// 2. Listen for the response from the background script
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "display_response") {
        const contentDiv = document.getElementById('gemini-content');
        if (contentDiv) {
            contentDiv.innerText = request.data;
        }
    }
});

// 3. UI Creation Function
function createGeminiWindow(text) {
    let container = document.getElementById('gemini-overlay');
    if (!container) {
        container = document.createElement('div');
        container.id = 'gemini-overlay';
        container.innerHTML = `
            <div id="gemini-header">
                <span>Gemini Quick-Cap</span>
                <button id="gemini-close">×</button>
            </div>
            <div id="gemini-content">${text}</div>
            <div id="gemini-resizer"></div>
        `;
        document.body.appendChild(container);
        setupInteractions(container);
    } else {
        document.getElementById('gemini-content').innerText = text;
    }
}

// 4. Dragging & Closing Logic
function setupInteractions(el) {
    const header = el.querySelector('#gemini-header');
    const closeBtn = el.querySelector('#gemini-close');
    
    closeBtn.onclick = () => el.remove();

    let isDragging = false;
    header.onmousedown = (e) => {
        isDragging = true;
        let shiftX = e.clientX - el.getBoundingClientRect().left;
        let shiftY = e.clientY - el.getBoundingClientRect().top;

        document.onmousemove = (e) => {
            if (!isDragging) return;
            el.style.left = e.pageX - shiftX + 'px';
            el.style.top = e.pageY - shiftY + 'px';
            el.style.right = 'auto'; // Disable the default 'right' positioning
        };

        document.onmouseup = () => {
            isDragging = false;
            document.onmousemove = null;
        };
    };
}