import React, { useEffect, useState } from "react";
import { ChatMessage, formatTimestamp } from "./utils/FileUtils";
import ChatBubble from "./components/ChatBubble";
import ChatInput from "./components/ChatInput";

const App = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        chrome.storage.local.get("messages", (result) => {
            if (result.messages) {
                setMessages(result.messages);
            }
        });
    }, []);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        const newMessage: ChatMessage = {
            text: trimmed,
            timestamp: formatTimestamp()
        };
        const newMessages = [...messages, newMessage];

        setMessages(newMessages);
        chrome.storage.local.set({ messages: newMessages });

        setInput("");
    };

    const exportChat = () => {
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

    const clearMessages = () => {
        chrome.storage.local.remove("messages", () => {
            setMessages([]);
            setShowConfirm(false);
        });
    };

    const saveAndClearMessages = async () => {
        try {
            const today = new Date().toISOString().slice(0, 10);
            const handle = await window.showSaveFilePicker({
                suggestedName: `my-chat-${today}.txt`,
                types: [{ description: "Text Files", accept: { "text/plain": [".txt"] } }]
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

    return (
        <div className="chat-box">
            <div className="chat-messages">
                {[...messages].reverse().map((msg, idx) => (
                    <ChatBubble key={idx} message={msg} />
                ))}
            </div>

            <div className="chat-input">
                <ChatInput input={input} onInputChange={setInput} onSend={handleSend} />

                <div className="menu-container">
                    <button onClick={() => setShowMenu(!showMenu)}>☰</button>
                    {showMenu && (
                        <div className="dropdown-menu">
                            <button onClick={exportChat}>
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
                            <button onClick={clearMessages}>Clear Without Saving</button>
                            <button className="danger" onClick={saveAndClearMessages}>
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
