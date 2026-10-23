import { useEffect, useRef, useState } from "react";
import BlockToolbar from "./BlockToolbar";
import SlashCommandMenu from "./SlashCommandMenu";
import { BLOCK_TYPES, createBlock } from "./editorUtils";

const SHORTCUTS = {
    "/p": BLOCK_TYPES.PARAGRAPH,
    "/h1": BLOCK_TYPES.HEADING1,
    "/h2": BLOCK_TYPES.HEADING2,
    "/h3": BLOCK_TYPES.HEADING3,
    "/bullet": BLOCK_TYPES.BULLET_LIST,
    "/numbered": BLOCK_TYPES.NUMBERED_LIST,
    "/checklist": BLOCK_TYPES.CHECKLIST,
    "/quote": BLOCK_TYPES.QUOTE
};

function BlockEditor({ blocks = [], onChange, readOnly = false }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [slashIndex, setSlashIndex] = useState(null);
    const [slashQuery, setSlashQuery] = useState("");
    const editorRef = useRef(null);
    const inputRefs = useRef({});

    // Avoid creating a new block ID on every render when the parent is empty.
    const safeBlocks = blocks.length > 0 ? blocks : [];

    const updateBlocks = (updatedBlocks) => {
        onChange?.(updatedBlocks.length ? updatedBlocks : [createBlock()]);
    };

    const updateBlock = (index, changes) => {
        const updatedBlocks = safeBlocks.map((block, i) =>
            i === index ? { ...block, ...changes } : block
        );
        updateBlocks(updatedBlocks);
    };

    const addBlock = (type, afterIndex = activeIndex) => {
        const updatedBlocks = [...safeBlocks];
        const insertIndex = Math.max(0, Math.min(afterIndex + 1, updatedBlocks.length));
        const newBlock = createBlock(type);
        updatedBlocks.splice(insertIndex, 0, newBlock);
        updateBlocks(updatedBlocks);
        setActiveIndex(insertIndex);
        setSlashIndex(null);
        setSlashQuery("");
        requestAnimationFrame(() => inputRefs.current[newBlock.id]?.focus());
    };

    const deleteBlock = (index) => {
        if (safeBlocks.length <= 1) {
            const replacement = createBlock();
            updateBlocks([replacement]);
            setActiveIndex(0);
            setSlashIndex(null);
            setSlashQuery("");
            requestAnimationFrame(() => inputRefs.current[replacement.id]?.focus());
            return;
        }

        const updatedBlocks = safeBlocks.filter((_, i) => i !== index);
        updateBlocks(updatedBlocks);
        const nextIndex = Math.max(0, index - 1);
        setActiveIndex(nextIndex);
        setSlashIndex(null);
        setSlashQuery("");
    };

    const moveBlock = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= safeBlocks.length) return;

        const updatedBlocks = [...safeBlocks];
        [updatedBlocks[index], updatedBlocks[targetIndex]] =
            [updatedBlocks[targetIndex], updatedBlocks[index]];

        updateBlocks(updatedBlocks);
        setActiveIndex(targetIndex);
    };

    const closeSlashMenu = () => {
        setSlashIndex(null);
        setSlashQuery("");
    };

    const selectSlashCommand = (type) => {
        if (slashIndex === null) return;
        const index = slashIndex;
        const query = slashQuery;
        const updatedBlocks = safeBlocks.map((block, i) =>
            i === index
                ? { ...block, type, text: "", checked: false }
                : block
        );
        updateBlocks(updatedBlocks);
        setActiveIndex(index);
        closeSlashMenu();
        requestAnimationFrame(() => {
            const block = updatedBlocks[index];
            if (block) inputRefs.current[block.id]?.focus();
        });
    };

    const handleTextChange = (index, value) => {
        const block = safeBlocks[index];
        if (!block) return;

        // Show the menu for a slash command typed at the start of an empty block.
        if (value.startsWith("/") && !value.includes("\n")) {
            const query = value.slice(1).toLowerCase();
            const exactType = SHORTCUTS[value.toLowerCase()];

            if (exactType) {
                updateBlock(index, { type: exactType, text: "", checked: false });
                setActiveIndex(index);
                closeSlashMenu();
                return;
            }

            updateBlock(index, { text: value });
            setActiveIndex(index);
            setSlashIndex(index);
            setSlashQuery(query);
            return;
        }

        updateBlock(index, { text: value });
        setActiveIndex(index);
        closeSlashMenu();
    };

    const handleKeyDown = (event, block, index) => {
        if (readOnly) return;

        if (slashIndex === index) {
            if (event.key === "Escape") {
                event.preventDefault();
                // Remove the typed slash query when dismissing the menu.
                updateBlock(index, { text: "" });
                closeSlashMenu();
                return;
            }

            if (event.key === "Enter") {
                event.preventDefault();
                const command = SHORTCUTS[`/${slashQuery}`];
                if (command) {
                    selectSlashCommand(command);
                } else {
                    selectSlashCommand(BLOCK_TYPES.PARAGRAPH);
                }
                return;
            }
        }

        if (event.key === "Backspace" && block.text === "" && safeBlocks.length > 1) {
            event.preventDefault();
            deleteBlock(index);
            return;
        }

        if (event.key === "Enter" && !event.shiftKey) {
            if (
                block.type === BLOCK_TYPES.HEADING1 ||
                block.type === BLOCK_TYPES.HEADING2 ||
                block.type === BLOCK_TYPES.HEADING3 ||
                block.type === BLOCK_TYPES.QUOTE
            ) {
                event.preventDefault();
                addBlock(BLOCK_TYPES.PARAGRAPH, index);
            } else if (
                block.type === BLOCK_TYPES.BULLET_LIST ||
                block.type === BLOCK_TYPES.NUMBERED_LIST ||
                block.type === BLOCK_TYPES.CHECKLIST
            ) {
                event.preventDefault();
                addBlock(block.type, index);
            }
        }
    };

    // Close the menu when clicking outside the editor.
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (editorRef.current && !editorRef.current.contains(event.target)) {
                closeSlashMenu();
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const renderTextInput = (block, index) => {
        const commonProps = {
            ref: (element) => {
                if (element) inputRefs.current[block.id] = element;
            },
            value: block.text,
            readOnly,
            onFocus: () => setActiveIndex(index),
            onChange: (event) => handleTextChange(index, event.target.value),
            onKeyDown: (event) => handleKeyDown(event, block, index),
            className: "form-control border-0 shadow-none",
            placeholder: "Type '/' for commands..."
        };

        if (block.type === BLOCK_TYPES.HEADING1) {
            return <textarea {...commonProps} rows={1} className={`${commonProps.className} fs-2 fw-bold`} placeholder="Heading 1" style={{ resize: "none" }} />;
        }
        if (block.type === BLOCK_TYPES.HEADING2) {
            return <textarea {...commonProps} rows={1} className={`${commonProps.className} fs-4 fw-semibold`} placeholder="Heading 2" style={{ resize: "none" }} />;
        }
        if (block.type === BLOCK_TYPES.HEADING3) {
            return <textarea {...commonProps} rows={1} className={`${commonProps.className} fs-5 fw-semibold`} placeholder="Heading 3" style={{ resize: "none" }} />;
        }
        if (block.type === BLOCK_TYPES.QUOTE) {
            return <textarea {...commonProps} rows={2} className={`${commonProps.className} fst-italic border-start border-3 ps-3`} placeholder="Write a quote..." style={{ resize: "vertical" }} />;
        }

        return (
            <textarea
                {...commonProps}
                rows={Math.max(1, Math.ceil((block.text.length + 1) / 80))}
                placeholder={
                    block.type === BLOCK_TYPES.BULLET_LIST || block.type === BLOCK_TYPES.NUMBERED_LIST
                        ? "List item"
                        : block.type === BLOCK_TYPES.CHECKLIST
                            ? "Checklist item"
                            : "Start writing..."
                }
                style={{ resize: "vertical" }}
            />
        );
    };

    return (
        <div className="card" ref={editorRef}>
            {!readOnly && <BlockToolbar onAddBlock={(type) => addBlock(type)} disabled={readOnly} />}

            <div className="card-body p-4">
                {safeBlocks.map((block, index) => (
                    <div
                        key={block.id}
                        className={`position-relative d-flex align-items-start gap-2 mb-2 ${activeIndex === index ? "bg-light rounded" : ""}`}
                        onClick={() => setActiveIndex(index)}
                    >
                        <div className="pt-2 text-muted" style={{ width: "28px", minWidth: "28px", textAlign: "center" }}>
                            {block.type === BLOCK_TYPES.BULLET_LIST && "•"}
                            {block.type === BLOCK_TYPES.NUMBERED_LIST &&
                                `${safeBlocks.slice(0, index + 1).filter((item) => item.type === BLOCK_TYPES.NUMBERED_LIST).length}.`}
                            {block.type === BLOCK_TYPES.CHECKLIST && (
                                <input
                                    type="checkbox"
                                    checked={Boolean(block.checked)}
                                    disabled={readOnly}
                                    onChange={(event) => updateBlock(index, { checked: event.target.checked })}
                                    aria-label="Mark checklist item complete"
                                />
                            )}
                            {block.type === BLOCK_TYPES.QUOTE && "❝"}
                        </div>

                        <div className="flex-grow-1 position-relative">
                            {renderTextInput(block, index)}

                            {slashIndex === index && !readOnly && (
                                <SlashCommandMenu
                                    visible
                                    query={slashQuery}
                                    onSelect={selectSlashCommand}
                                    onClose={closeSlashMenu}
                                />
                            )}
                        </div>

                        {!readOnly && (
                            <div className="d-flex gap-1 pt-1">
                                <button type="button" className="btn btn-sm btn-light" title="Move up" disabled={index === 0} onClick={() => moveBlock(index, -1)}>↑</button>
                                <button type="button" className="btn btn-sm btn-light" title="Move down" disabled={index === safeBlocks.length - 1} onClick={() => moveBlock(index, 1)}>↓</button>
                                <button type="button" className="btn btn-sm btn-outline-danger" title="Delete block" onClick={() => deleteBlock(index)}>×</button>
                            </div>
                        )}
                    </div>
                ))}

                {safeBlocks.length === 0 && (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => updateBlocks([createBlock()])}
                    >
                        Add first block
                    </button>
                )}
            </div>
        </div>
    );
}

export default BlockEditor;
