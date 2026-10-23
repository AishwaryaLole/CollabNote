
import { BLOCK_TYPES } from "./editorUtils";

function BlockToolbar({ onAddBlock, disabled = false }) {
    const options = [
        { label: "Paragraph", type: BLOCK_TYPES.PARAGRAPH },
        { label: "Heading 1", type: BLOCK_TYPES.HEADING1 },
        { label: "Heading 2", type: BLOCK_TYPES.HEADING2 },
        { label: "Heading 3", type: BLOCK_TYPES.HEADING3 },
        { label: "Bullet list", type: BLOCK_TYPES.BULLET_LIST },
        { label: "Numbered list", type: BLOCK_TYPES.NUMBERED_LIST },
        { label: "Checklist", type: BLOCK_TYPES.CHECKLIST },
        { label: "Quote", type: BLOCK_TYPES.QUOTE }
    ];

    return (
        <div className="d-flex flex-wrap gap-2 border-bottom p-2 bg-light">
            {options.map((option) => (
                <button
                    key={option.type}
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={disabled}
                    onClick={() => onAddBlock(option.type)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

export default BlockToolbar;
