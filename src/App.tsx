import React, { useEffect, useState, useRef } from "react";

type ChatMessage = {
    text: string;
    timestamp: string;
};

let fileHandle: FileSystemFileHandle | null = null;

async function initFileAccess(currentMessages?: ChatMessage[]) {
    try {
        const today = new Date().toISOString().slice(0, 10);
        fileHandle = await window.showSaveFilePicker({
            suggestedName: `my-chat-${today}.txt`,
            types: [
                {
                    description: "Text Files",
                    accept: { "text/plain": [".txt"] }
                }
            ]
        });

        if (currentMessages && currentMessages.length > 0) {
            const content = currentMessages.map((m) => `[${m.timestamp}] ${m.text}`).join("\n");
            await writeToFile(content);
        }
    } catch (e) {
        console.warn("File access canceled or not available:", e);
    }
}

async function writeToFile(content: string) {
    if (!fileHandle) {
        await initFileAccess();
        if (!fileHandle) return;
    }
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
}

const App = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true); // Dark mode toggle state
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load theme setting from chrome storage
        chrome.storage.local.get(["isDarkMode"], (result) => {
            if (result.isDarkMode !== undefined) {
                setIsDarkMode(result.isDarkMode);
            }
        });

        // Apply theme classes to body
        if (isDarkMode) {
            document.body.classList.add("dark-mode");
            document.body.classList.remove("light-mode");
        } else {
            document.body.classList.add("light-mode");
            document.body.classList.remove("dark-mode");
        }

        chrome.storage.local.get("messages", (result) => {
            if (result.messages) {
                setMessages(result.messages);
            }
        });
    }, [isDarkMode]); // Trigger when theme changes

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = () => {
        if (!input.trim()) return;
        const now = new Date().toISOString().slice(0, 16).replace("T", " ");
        const newMessage: ChatMessage = { text: input.trim(), timestamp: now };
        const newMessages = [...messages, newMessage];

        setMessages(newMessages);
        chrome.storage.local.set({ messages: newMessages });

        const content = newMessages.map((m) => `[${m.timestamp}] ${m.text}`).join("\n");
        writeToFile(content);

        setInput("");
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") sendMessage();
    };

    const handleDownload = () => {
        const text = messages.map((m) => `[${m.timestamp}] ${m.text}`).join("\n");
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "my-chat.txt";
        a.click();
        URL.revokeObjectURL(url);
        setShowMenu(false);
    };

    const clearWithoutSaving = () => {
        chrome.storage.local.remove("messages", () => {
            setMessages([]);
            writeToFile(""); // optional clear
            setShowConfirm(false);
        });
    };

    const saveAndClear = async () => {
        try {
            const today = new Date().toISOString().slice(0, 10);
            const handle = await window.showSaveFilePicker({
                suggestedName: `my-chat-${today}.txt`,
                types: [
                    {
                        description: "Text Files",
                        accept: { "text/plain": [".txt"] }
                    }
                ]
            });

            const text = messages.map((m) => `[${m.timestamp}] ${m.text}`).join("\n");
            const writable = await handle.createWritable();
            await writable.write(text);
            await writable.close();

            chrome.storage.local.remove("messages", () => {
                setMessages([]);
                setShowConfirm(false);
            });
        } catch (e) {
            console.warn("Save canceled or failed:", e);
        }
    };

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);

        // Save theme preference to local storage
        chrome.storage.local.set({ isDarkMode: newTheme });
    };

    return (
        <div className="chat-box">
            <div className="theme-toggle">
                <label className="switch">
                    <input type="checkbox" checked={isDarkMode} onChange={toggleTheme} />
                    <span className="slider"></span>
                </label>
            </div>

            <div className="chat-messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className="chat-bubble" data-time={msg.timestamp}>
                        {msg.text}
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            <div className="chat-input">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Type something..."
                />
                <button className="send-button" onClick={sendMessage}>
                    ➤
                </button>
                <div className="menu-container">
                    <button onClick={() => setShowMenu(!showMenu)}>☰</button>
                    {showMenu && (
                        <div className="dropdown-menu">
                            <button onClick={handleDownload}>
                                <span>💾</span>Export Chat
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirm(true);
                                    setShowMenu(false);
                                }}
                            >
                                <span>🧹</span>Clear Messages
                            </button>
                            <button
                                onClick={() => {
                                    initFileAccess(messages);
                                    setShowMenu(false);
                                }}
                            >
                                <span>💾</span>Set Save Location
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showConfirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>Do you want to save your chat before clearing it?</p>
                        <div className="modal-buttons three">
                            <button onClick={() => setShowConfirm(false)}>Cancel</button>
                            <button onClick={clearWithoutSaving}>Clear Without Saving</button>
                            <button className="danger" onClick={saveAndClear}>
                                Save & Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
