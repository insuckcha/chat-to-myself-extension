import React from "react";
import { ChatMessage } from "../utils/FileUtils";

type Props = {
    message: ChatMessage;
};

export default function ChatBubble({ message }: Props) {
    return <div className="chat-bubble">{message.text}</div>;
}