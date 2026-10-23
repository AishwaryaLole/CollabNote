import { BLOCK_TYPES } from "./editorUtils";

function SlashCommandMenu({
    onSelect,
    onClose,
    visible = false,
    query = ""
}) {
    if (!visible) return null;

    const commands = [
        { label: "Paragraph", description: "Regular text", type: BLOCK_TYPES.PARAGRAPH, shortcuts: ["/p", "/paragraph"] },
        { label: "Heading 1", description: "Large heading", type: BLOCK_TYPES.HEADING1, shortcuts: ["/h1", "/heading1"] },
        { label: "Heading 2", description: "Medium heading", type: BLOCK_TYPES.HEADING2, shortcuts: ["/h2", "/heading2"] },
        { label: "Heading 3", description: "Small heading", type: BLOCK_TYPES.HEADING3, shortcuts: ["/h3", "/heading3"] },
        { label: "Bullet list", description: "Unordered list item", type: BLOCK_TYPES.BULLET_LIST, shortcuts: ["/bullet", "/bullets"] },
        { label: "Numbered list", description: "Ordered list item", type: BLOCK_TYPES.NUMBERED_LIST, shortcuts: ["/numbered", "/number"] },
        { label: "Checklist", description: "Task with checkbox", type: BLOCK_TYPES.CHECKLIST, shortcuts: ["/checklist", "/check"] },
        { label: "Quote", description: "Quoted text", type: BLOCK_TYPES.QUOTE, shortcuts: ["/quote"] }
    ];

    const normalizedQuery = query.trim().toLowerCase();
    const filteredCommands = commands.filter((command) => {
        if (!normalizedQuery) return true;
        return (
            command.label.toLowerCase().includes(normalizedQuery) ||
            command.description.toLowerCase().includes(normalizedQuery) ||
            command.shortcuts.some((shortcut) =>
                shortcut.slice(1).includes(normalizedQuery)
            )
        );
    });

    return (
        <div
            className="list-group shadow bg-white"
            role="listbox"
            aria-label="Block commands"
            style={{
                position: "absolute",
                left: "8px",
                top: "calc(100% + 4px)",
                zIndex: 1050,
                width: "230px",
                maxHeight: "220px",
                overflowY: "auto",
                borderRadius: "8px"
            }}
        >
            {filteredCommands.length > 0 ? (
                filteredCommands.map((command) => (
                    <button
                        key={command.type}
                        type="button"
                        className="list-group-item list-group-item-action py-2"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                            onSelect(command.type);
                            onClose?.();
                        }}
                    >
                        <div className="fw-semibold">{command.label}</div>
                        <small className="text-muted">{command.description}</small>
                    </button>
                ))
            ) : (
                <div className="list-group-item text-muted small">
                    No matching block types
                </div>
            )}
        </div>
    );
}

export default SlashCommandMenu;
