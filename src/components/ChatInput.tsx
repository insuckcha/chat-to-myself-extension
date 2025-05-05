import React from "react";

type Props = {
    input: string;
    onInputChange: (val: string) => void;
    onSend: () => void;
};

export default function ChatInput({ input, onInputChange, onSend }: Props) {
    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") onSend();
    };

    return (
        <>
            <input
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type something..."
            />
            <button className="send-button" onClick={onSend}>
                ➤
            </button>
        </>
    );
}
