export type ChatMessage = {
    text: string;
    timestamp: string;
};

let fileHandle: FileSystemFileHandle | null = null;

export const formatTimestamp = () =>
    new Date().toISOString().slice(0, 16).replace("T", " ");

export async function writeToFile(content: string) {
    if (!fileHandle) {
        await initFileAccess();
        if (!fileHandle) return;
    }
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
}

export async function initFileAccess(currentMessages?: ChatMessage[]) {
    try {
        const today = new Date().toISOString().slice(0, 10);
        fileHandle = await window.showSaveFilePicker({
            suggestedName: `my-chat-${today}.txt`,
            types: [{ description: "Text Files", accept: { "text/plain": [".txt"] } }]
        });

        if (currentMessages?.length) {
            const content = currentMessages.map((m) => `[${m.timestamp}] ${m.text}`).join("\n");
            await writeToFile(content);
        }
    } catch (e) {
        console.warn("File access canceled or not available:", e);
    }
}
