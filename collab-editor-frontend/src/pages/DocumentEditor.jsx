import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BlockEditor from "../components/editors/BlockEditor";

import {
    parseDocumentContent,
    serializeBlocks
} from "../components/editors/editorUtils";
import {
    getDocument,
    updateDocumentContent,
    getCollaborators,
    addCollaborator,
    updateCollaboratorPermission,
    removeCollaborator
} from "../services/api";

import {
    connectWebSocket,
    sendDocumentChange,
    disconnectWebSocket
} from "../websocket/websocketClient";

import {
    getLoggedInUser
} from "../utils/auth";


function DocumentEditor() {

    const { documentId } = useParams();
    const navigate = useNavigate();

    // ================================
    // USER
    // ================================

    const loggedInUser = getLoggedInUser();


    // ================================
    // DOCUMENT
    // ================================

    const [document, setDocument] = useState(null);
    const [content, setContent] = useState("");
    const [blocks, setBlocks] = useState([]);


    // ================================
    // COLLABORATORS
    // ================================

    const [collaborators, setCollaborators] = useState([]);

    const [loadingCollaborators, setLoadingCollaborators] =
        useState(false);


    // ================================
    // PERMISSION
    // ================================

    const [permission, setPermission] = useState(null);

    const [checkingPermission, setCheckingPermission] =
        useState(true);


    // ================================
    // LOADING
    // ================================

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);


    // ================================
    // MESSAGES
    // ================================

    const [error, setError] = useState("");

    const [message, setMessage] = useState("");


    // ================================
    // MODALS
    // ================================

    const [showPeople, setShowPeople] = useState(false);

    const [showShare, setShowShare] = useState(false);


    // ================================
    // SHARE
    // ================================

    const [shareUserId, setShareUserId] = useState("");

    const [sharePermission, setSharePermission] =
        useState("EDITOR");

    const [sharing, setSharing] = useState(false);


    // ================================
    // LOAD DOCUMENT
    // ================================

    useEffect(() => {

        loadDocument();

    }, [documentId]);

    useEffect(() => {

    if (!documentId || !permission) {
        return;
    }

    connectWebSocket(documentId, (message) => {

        // Ignore changes sent by the current user
        if (
            Number(message.userId) ===
            Number(loggedInUser?.userId)
        ) {
            return;
        }

        const incomingContent = message.content || "";
        setContent(incomingContent);
        setBlocks(parseDocumentContent(incomingContent));
    });

    return () => {
        disconnectWebSocket();
    };

}, [documentId, permission]);


    const loadDocument = async () => {

        try {

            setLoading(true);

            setCheckingPermission(true);

            setError("");

            const result =
                await getDocument(documentId);

            setDocument(result);

            const storedContent = result.content || "";
            setContent(storedContent);
            setBlocks(parseDocumentContent(storedContent));

            await determinePermission(result);

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Unable to load document."
            );

        } finally {

            setLoading(false);

            setCheckingPermission(false);

        }
    };


    // ================================
    // DETERMINE USER PERMISSION
    // ================================

    const determinePermission = async (
        currentDocument
    ) => {

        if (!loggedInUser?.userId) {

            navigate("/login", {
                replace: true
            });

            return;
        }


        const currentUserId =
            Number(loggedInUser.userId);


        // --------------------------------
        // OWNER
        // --------------------------------

        const ownerId =
            currentDocument?.owner?.id ??
            currentDocument?.ownerId;


        if (
            ownerId !== null &&
            ownerId !== undefined &&
            Number(ownerId) === currentUserId
        ) {

            setPermission("OWNER");

            return;
        }


        // --------------------------------
        // SHARED USER
        // --------------------------------

        try {

            const result =
                await getCollaborators(
                    currentDocument.id
                );

            setCollaborators(result);


            const currentCollaborator =
                result.find(
                    (collaborator) =>
                        Number(
                            collaborator.user?.id
                        ) === currentUserId
                );


            if (!currentCollaborator) {

                setPermission(null);

                setError(
                    "You do not have access to this document."
                );

                return;
            }


            setPermission(
                currentCollaborator.permission
            );

        } catch (error) {

            console.error(error);

            setPermission(null);

            throw error;
        }
    };


    // ================================
    // LOAD COLLABORATORS
    // ================================

    const loadCollaborators = async () => {

        try {

            setLoadingCollaborators(true);

            setError("");

            const result =
                await getCollaborators(
                    documentId
                );

            setCollaborators(result);

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Unable to load collaborators."
            );

        } finally {

            setLoadingCollaborators(false);

        }
    };


    // ================================
    // PEOPLE
    // ================================

    const handlePeople = async () => {

        setShowPeople(true);

        setShowShare(false);

        setMessage("");

        setError("");

        await loadCollaborators();
    };


    // ================================
    // SHARE
    // ================================

    const handleShare = () => {

        if (permission !== "OWNER") {

            setError(
                "Only the document owner can share this document."
            );

            return;
        }


        setShowShare(true);

        setShowPeople(false);

        setShareUserId("");

        setSharePermission("EDITOR");

        setError("");

        setMessage("");
    };


    // ================================
    // ADD COLLABORATOR
    // ================================

    const handleAddCollaborator = async () => {

        if (permission !== "OWNER") {

            setError(
                "Only the document owner can add collaborators."
            );

            return;
        }


        if (!shareUserId.trim()) {

            setError(
                "Please enter a user ID."
            );

            return;
        }


        const userId =
            Number(shareUserId);


        if (
            isNaN(userId) ||
            userId <= 0
        ) {

            setError(
                "Please enter a valid user ID."
            );

            return;
        }


        try {

            setSharing(true);

            setError("");

            setMessage("");


            await addCollaborator(
                documentId,
                {
                    userId: userId,
                    permission: sharePermission
                }
            );


            setMessage(
                "Collaborator added successfully."
            );


            setShareUserId("");


            await loadCollaborators();


            setShowShare(false);

            setShowPeople(true);

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Failed to add collaborator."
            );

        } finally {

            setSharing(false);
        }
    };


    // ================================
    // CHANGE PERMISSION
    // ================================

    const handlePermissionChange = async (
        userId,
        newPermission
    ) => {

        if (permission !== "OWNER") {

            setError(
                "Only the document owner can change permissions."
            );

            return;
        }


        try {

            setError("");

            setMessage("");


            await updateCollaboratorPermission(
                documentId,
                userId,
                newPermission
            );


            setCollaborators(
                (current) =>
                    current.map(
                        (collaborator) =>
                            Number(
                                collaborator.user?.id
                            ) === Number(userId)
                                ? {
                                    ...collaborator,
                                    permission:
                                        newPermission
                                }
                                : collaborator
                    )
            );


            setMessage(
                "Permission updated successfully."
            );

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Failed to update permission."
            );
        }
    };


    // ================================
    // REMOVE COLLABORATOR
    // ================================

    const handleRemoveCollaborator = async (
        userId
    ) => {

        if (permission !== "OWNER") {

            setError(
                "Only the document owner can remove collaborators."
            );

            return;
        }


        const confirmRemove =
            window.confirm(
                "Are you sure you want to remove this collaborator?"
            );


        if (!confirmRemove) {
            return;
        }


        try {

            setError("");

            setMessage("");


            await removeCollaborator(
                documentId,
                userId
            );


            setCollaborators(
                (current) =>
                    current.filter(
                        (collaborator) =>
                            Number(
                                collaborator.user?.id
                            ) !== Number(userId)
                    )
            );


            setMessage(
                "Collaborator removed successfully."
            );

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Failed to remove collaborator."
            );
        }
    };


    // ================================
    // BLOCK EDITOR CHANGES
    // ================================

    const handleBlocksChange = (updatedBlocks) => {

        setBlocks(updatedBlocks);

        const serializedContent = serializeBlocks(updatedBlocks);
        setContent(serializedContent);

        if (
            permission === "OWNER" ||
            permission === "EDITOR"
        ) {
            sendDocumentChange(
                documentId,
                serializedContent
            );
        }
    };


    // ================================
    // SAVE DOCUMENT
    // ================================

    const handleSave = async () => {

        // VIEWER cannot save

        if (
            permission !== "OWNER" &&
            permission !== "EDITOR"
        ) {

            setError(
                "You have VIEWER permission. This document is read-only."
            );

            return;
        }


        try {

            setSaving(true);

            setMessage("");

            setError("");


            const serializedContent = serializeBlocks(blocks);

            const updatedDocument =
                await updateDocumentContent(
                    documentId,
                    serializedContent
                );

            setDocument(updatedDocument);

            const savedContent =
                updatedDocument.content ?? serializedContent;

            setContent(savedContent);
            setBlocks(parseDocumentContent(savedContent));


            setMessage(
                "Document saved successfully."
            );

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Failed to save document."
            );

        } finally {

            setSaving(false);
        }
    };


    // ================================
    // PERMISSION LABEL
    // ================================

    const getPermissionLabel = () => {

        if (permission === "OWNER") {
            return "Owner";
        }

        if (permission === "EDITOR") {
            return "Editor";
        }

        if (permission === "VIEWER") {
            return "Viewer";
        }

        return "No Access";
    };


    // ================================
    // LOADING
    // ================================

    if (loading || checkingPermission) {

        return (
            <div className="min-vh-100 bg-light">

                <nav className="navbar bg-white border-bottom shadow-sm px-4 py-2">

                    <div className="container-fluid">

                        <span className="navbar-brand fw-bold fs-5 mb-0">

                            <i className="bi bi-file-earmark-text text-primary me-2"></i>

                            CollabNote

                        </span>

                    </div>

                </nav>


                <div className="container text-center py-5">

                    <div
                        className="spinner-border text-primary"
                        role="status"
                    ></div>

                    <p className="text-muted mt-3">

                        Loading document...

                    </p>

                </div>

            </div>
        );
    }


    // ================================
    // NO ACCESS / ERROR
    // ================================

    if (error && !document) {

        return (
            <div className="min-vh-100 bg-light">

                <nav className="navbar bg-white border-bottom shadow-sm px-4 py-2">

                    <div className="container-fluid">

                        <span className="navbar-brand fw-bold fs-5 mb-0">

                            <i className="bi bi-file-earmark-text text-primary me-2"></i>

                            CollabNote

                        </span>

                    </div>

                </nav>


                <div className="container py-5">

                    <div className="alert alert-danger">

                        <i className="bi bi-exclamation-triangle me-2"></i>

                        {error}

                    </div>


                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >

                        <i className="bi bi-arrow-left me-2"></i>

                        Back to Documents

                    </button>

                </div>

            </div>
        );
    }


    // ================================
    // MAIN UI
    // ================================

    return (
        <div className="min-vh-100 bg-light">


            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <nav className="navbar bg-white border-bottom shadow-sm px-4 py-2">

                <div className="container-fluid">

                    <div className="d-flex align-items-center">

                        <button
                            type="button"
                            className="btn btn-light btn-sm me-3"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                            title="Back"
                        >

                            <i className="bi bi-arrow-left"></i>

                        </button>


                        <span className="navbar-brand fw-bold fs-5 mb-0">

                            <i className="bi bi-file-earmark-text text-primary me-2"></i>

                            CollabNote

                        </span>

                    </div>


                    <div className="d-flex align-items-center gap-3">

                        {/* CONNECTION */}

                        <span className="small">

                            <i className="bi bi-circle-fill text-success me-1"></i>

                            Connected

                        </span>


                        {/* PERMISSION */}

                        {permission && (

                            <span
                                className={
                                    permission === "VIEWER"
                                        ? "badge bg-secondary"
                                        : permission === "EDITOR"
                                            ? "badge bg-primary"
                                            : "badge bg-success"
                                }
                            >

                                {getPermissionLabel()}

                            </span>

                        )}

                    </div>

                </div>

            </nav>


            {/* ================================= */}
            {/* DOCUMENT */}
            {/* ================================= */}

            <main className="container py-4">


                {/* DOCUMENT HEADER */}

                <div className="d-flex justify-content-between align-items-center mb-4">

                    <div>

                        <h3 className="fw-bold mb-1">

                            <i className="bi bi-file-earmark-text text-primary me-2"></i>

                            {document.title}

                        </h3>


                        <small className="text-muted">

                            Document #{document.id}

                        </small>

                    </div>


                    {/* ACTION BUTTONS */}

                    <div className="d-flex gap-2">


                        {/* PEOPLE */}

                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={handlePeople}
                        >

                            <i className="bi bi-people me-2"></i>

                            People

                        </button>


                        {/* SHARE */}

                        {permission === "OWNER" && (

                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={handleShare}
                            >

                                <i className="bi bi-share me-2"></i>

                                Share

                            </button>

                        )}


                        {/* SAVE */}

                        {(permission === "OWNER" ||
                            permission === "EDITOR") && (

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving}
                            >

                                {saving ? (

                                    <>

                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                        ></span>

                                        Saving...

                                    </>

                                ) : (

                                    <>

                                        <i className="bi bi-save me-2"></i>

                                        Save

                                    </>

                                )}

                            </button>

                        )}


                        {/* BACK */}

                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >

                            <i className="bi bi-arrow-left me-2"></i>

                            Back

                        </button>

                    </div>

                </div>


                {/* ================================= */}
                {/* VIEWER MESSAGE */}
                {/* ================================= */}

                {permission === "VIEWER" && (

                    <div className="alert alert-secondary">

                        <i className="bi bi-eye me-2"></i>

                        You have <strong>VIEWER</strong> permission.
                        This document is read-only.

                    </div>

                )}


                {/* ================================= */}
                {/* MESSAGE */}
                {/* ================================= */}

                {message && (

                    <div className="alert alert-success">

                        <i className="bi bi-check-circle me-2"></i>

                        {message}

                    </div>

                )}


                {/* ================================= */}
                {/* ERROR */}
                {/* ================================= */}

                {error && (

                    <div className="alert alert-danger">

                        <i className="bi bi-exclamation-triangle me-2"></i>

                        {error}

                    </div>

                )}


                {/* ================================= */}
                {/* EDITOR */}
                {/* ================================= */}

                <div className="card border-0 shadow-sm">


                    <div className="card-header bg-white">

                        <div className="d-flex align-items-center justify-content-between">

                            <div className="d-flex align-items-center">

                                <i className="bi bi-pencil me-2 text-primary"></i>

                                <span className="fw-semibold">

                                    Document

                                </span>

                            </div>


                            {/* MODE */}

                            <small className="text-muted">

                                {permission === "VIEWER"
                                    ? "Read only"
                                    : "Editing enabled"}

                            </small>

                        </div>

                    </div>


                    <div className="card-body">


                        <BlockEditor
                            blocks={blocks}
                            onChange={handleBlocksChange}
                            readOnly={permission === "VIEWER"}
                        />

                    </div>

                </div>

            </main>


            {/* ================================= */}
            {/* PEOPLE MODAL */}
            {/* ================================= */}

            {showPeople && (

                <div
                    className="modal d-block"
                    tabIndex="-1"
                    style={{
                        backgroundColor:
                            "rgba(0,0,0,0.5)"
                    }}
                >

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content">


                            {/* HEADER */}

                            <div className="modal-header">

                                <h5 className="modal-title">

                                    <i className="bi bi-people me-2 text-primary"></i>

                                    Collaborators

                                </h5>


                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        setShowPeople(false)
                                    }
                                ></button>

                            </div>


                            {/* BODY */}

                            <div className="modal-body">


                                {/* LOADING */}

                                {loadingCollaborators ? (

                                    <div className="text-center py-4">

                                        <div
                                            className="spinner-border text-primary"
                                            role="status"
                                        ></div>

                                        <p className="text-muted mt-2 mb-0">

                                            Loading collaborators...

                                        </p>

                                    </div>

                                ) : collaborators.length === 0 ? (

                                    <div className="text-center py-4">

                                        <i className="bi bi-people fs-1 text-muted"></i>

                                        <p className="text-muted mt-2 mb-0">

                                            No collaborators yet.

                                        </p>

                                    </div>

                                ) : (

                                    <div className="list-group">

                                        {collaborators.map(
                                            (collaborator) => {

                                                const collaboratorUser =
                                                    collaborator.user;

                                                return (

                                                    <div
                                                        key={
                                                            collaborator.id
                                                        }
                                                        className="list-group-item"
                                                    >

                                                        <div className="d-flex justify-content-between align-items-center">


                                                            {/* USER */}

                                                            <div>

                                                                <div className="fw-semibold">

                                                                    {
                                                                        collaboratorUser?.name ||
                                                                        collaboratorUser?.email ||
                                                                        `User ${collaboratorUser?.id}`
                                                                    }

                                                                </div>


                                                                <small className="text-muted">

                                                                    {
                                                                        collaboratorUser?.email
                                                                    }

                                                                </small>

                                                            </div>


                                                            {/* ACTIONS */}

                                                            <div className="d-flex align-items-center gap-2">


                                                                {permission === "OWNER" ? (

                                                                    <>


                                                                        {/* PERMISSION */}

                                                                        <select
                                                                            className="form-select form-select-sm"
                                                                            value={
                                                                                collaborator.permission
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handlePermissionChange(
                                                                                    collaboratorUser.id,
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                        >

                                                                            <option value="EDITOR">

                                                                                Editor

                                                                            </option>

                                                                            <option value="VIEWER">

                                                                                Viewer

                                                                            </option>

                                                                        </select>


                                                                        {/* REMOVE */}

                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-outline-danger"
                                                                            onClick={() =>
                                                                                handleRemoveCollaborator(
                                                                                    collaboratorUser.id
                                                                                )
                                                                            }
                                                                            title="Remove"
                                                                        >

                                                                            <i className="bi bi-trash"></i>

                                                                        </button>

                                                                    </>

                                                                ) : (

                                                                    <span
                                                                        className={
                                                                            collaborator.permission ===
                                                                            "VIEWER"
                                                                                ? "badge bg-secondary"
                                                                                : "badge bg-primary"
                                                                        }
                                                                    >

                                                                        {
                                                                            collaborator.permission
                                                                        }

                                                                    </span>

                                                                )}

                                                            </div>

                                                        </div>

                                                    </div>

                                                );

                                            }
                                        )}

                                    </div>

                                )}

                            </div>


                            {/* FOOTER */}

                            <div className="modal-footer">


                                {/* ADD ONLY OWNER */}

                                {permission === "OWNER" && (

                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {

                                            setShowPeople(false);

                                            handleShare();

                                        }}
                                    >

                                        <i className="bi bi-person-plus me-2"></i>

                                        Add Collaborator

                                    </button>

                                )}


                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setShowPeople(false)
                                    }
                                >

                                    Close

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* ================================= */}
            {/* SHARE MODAL */}
            {/* ================================= */}

            {showShare && (

                <div
                    className="modal d-block"
                    tabIndex="-1"
                    style={{
                        backgroundColor:
                            "rgba(0,0,0,0.5)"
                    }}
                >

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content">


                            {/* HEADER */}

                            <div className="modal-header">

                                <h5 className="modal-title">

                                    <i className="bi bi-share me-2 text-primary"></i>

                                    Share Document

                                </h5>


                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        setShowShare(false)
                                    }
                                ></button>

                            </div>


                            {/* BODY */}

                            <div className="modal-body">


                                {error && (

                                    <div className="alert alert-danger">

                                        <i className="bi bi-exclamation-triangle me-2"></i>

                                        {error}

                                    </div>

                                )}


                                <div className="mb-3">

                                    <label className="form-label fw-semibold">

                                        User ID

                                    </label>


                                    <input
                                        type="number"
                                        className="form-control"
                                        value={shareUserId}
                                        onChange={(e) =>
                                            setShareUserId(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter user ID"
                                        min="1"
                                    />


                                    <div className="form-text">

                                        Enter the ID of the user you want to share this document with.

                                    </div>

                                </div>


                                <div className="mb-3">

                                    <label className="form-label fw-semibold">

                                        Permission

                                    </label>


                                    <select
                                        className="form-select"
                                        value={
                                            sharePermission
                                        }
                                        onChange={(e) =>
                                            setSharePermission(
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="EDITOR">

                                            Editor

                                        </option>

                                        <option value="VIEWER">

                                            Viewer

                                        </option>

                                    </select>

                                </div>

                            </div>


                            {/* FOOTER */}

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setShowShare(false)
                                    }
                                >

                                    Cancel

                                </button>


                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={
                                        handleAddCollaborator
                                    }
                                    disabled={sharing}
                                >

                                    {sharing ? (

                                        <>

                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            ></span>

                                            Sharing...

                                        </>

                                    ) : (

                                        <>

                                            <i className="bi bi-share me-2"></i>

                                            Share

                                        </>

                                    )}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default DocumentEditor;