
export const BLOCK_TYPES = {
    PARAGRAPH: "paragraph",
    HEADING1: "heading1",
    HEADING2: "heading2",
    HEADING3: "heading3",
    BULLET_LIST: "bulletList",
    NUMBERED_LIST: "numberedList",
    CHECKLIST: "checklist",
    QUOTE: "quote"
};

export const createBlock = (type = BLOCK_TYPES.PARAGRAPH, text = "") => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    text,
    checked: false
});

export const createDefaultBlocks = () => [
    createBlock(BLOCK_TYPES.PARAGRAPH, "")
];

// Convert stored document content into blocks.
// Supports both new JSON content and existing plain-text documents.
export const parseDocumentContent = (content) => {
    if (!content) {
        return createDefaultBlocks();
    }

    try {
        const parsed = JSON.parse(content);

        if (
            Array.isArray(parsed) &&
            parsed.every(
                (block) =>
                    block &&
                    typeof block.type === "string" &&
                    typeof block.text === "string"
            )
        ) {
            return parsed.map((block) => ({
                id: block.id || createBlock().id,
                type: Object.values(BLOCK_TYPES).includes(block.type)
                    ? block.type
                    : BLOCK_TYPES.PARAGRAPH,
                text: block.text,
                checked: Boolean(block.checked)
            }));
        }
    } catch {
        // Existing content is plain text, not JSON.
    }

    return content.split("\n").map((line) =>
        createBlock(BLOCK_TYPES.PARAGRAPH, line)
    );
};

// Convert blocks to a string that can be stored in the existing content column.
export const serializeBlocks = (blocks) => {
    return JSON.stringify(blocks);
};
