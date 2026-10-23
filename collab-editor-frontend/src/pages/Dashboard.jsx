import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getDocuments,
    getCollaborators,
    getAllUsers,
    createDocument,
    addCollaborator,
    updateCollaboratorPermission,
    removeCollaborator,
    deleteDocument,
    getMyNotifications,
    markNotificationAsRead
} from "../services/api";

import {
    getLoggedInUser,
    logout
} from "../utils/auth";


// =========================================================
// USER HELPERS
// Work with different backend field names
// =========================================================

const getUserId = (u) => u?.id ?? u?.userId ?? u?.user_id;

const getUserName = (u) =>
    u?.name ?? u?.fullName ?? u?.username ?? u?.userName ?? "";

// Text shown in the dropdown: "3 — Rahul Patil (rahul@mail.com)"
const getUserLabel = (u) => {

    const id = getUserId(u);
    const name = getUserName(u);
    const email = u?.email;

    if (name && email) return `${id} — ${name} (${email})`;
    if (name) return `${id} — ${name}`;
    if (email) return `${id} — ${email}`;

    return `${id} — Unknown user`;
};


function Dashboard() {

    const navigate = useNavigate();
    const user = getLoggedInUser();


    // =========================================================
    // ACCOUNT
    // =========================================================

    const [showAccount, setShowAccount] = useState(false);


    // =========================================================
    // DOCUMENTS
    // =========================================================

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // =========================================================
    // DOCUMENT PERMISSIONS
    // =========================================================

    const [documentPermissions, setDocumentPermissions] = useState({});
    const [loadingPermissionId, setLoadingPermissionId] = useState(null);


    // =========================================================
    // COLLABORATORS
    // =========================================================

    const [collaborators, setCollaborators] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [loadingCollaborators, setLoadingCollaborators] = useState(false);


    // =========================================================
    // NEW DOCUMENT
    // =========================================================

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [creatingDocument, setCreatingDocument] = useState(false);
    const [createError, setCreateError] = useState("");
    const [showNewDocumentModal, setShowNewDocumentModal] = useState(false);


    // =========================================================
    // ADD COLLABORATOR
    // =========================================================

    const [showAddCollaboratorModal, setShowAddCollaboratorModal] =
        useState(false);

    const [collaboratorUserId, setCollaboratorUserId] = useState("");

    const [collaboratorPermission, setCollaboratorPermission] =
        useState("EDITOR");

    const [addingCollaborator, setAddingCollaborator] = useState(false);

    const [collaboratorError, setCollaboratorError] = useState("");

    // Users shown in the dropdown
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);


    // =========================================================
    // PERMISSION / REMOVE
    // =========================================================

    const [updatingPermissionId, setUpdatingPermissionId] = useState(null);
    const [removingCollaboratorId, setRemovingCollaboratorId] = useState(null);


    // =========================================================
    // MENU / MESSAGE
    // =========================================================

    const [openMenuId, setOpenMenuId] = useState(null);
    const [message, setMessage] = useState("");


    // =========================================================
    // NOTIFICATIONS
    // =========================================================

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState("");


    // =========================================================
    // UNREAD NOTIFICATIONS
    // =========================================================

    const unreadNotifications = useMemo(() => {

        return notifications.filter(
            (notification) => notification.isRead === false
        );

    }, [notifications]);


    // =========================================================
    // LOGIN CHECK + LOAD DOCUMENTS
    // =========================================================

    useEffect(() => {

        const token = localStorage.getItem("token");

        if (!token) {

            navigate("/login", { replace: true });

            return;
        }

        loadDocuments();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);


    // =========================================================
    // LOAD DOCUMENTS
    // =========================================================

    const loadDocuments = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await getDocuments();

            setDocuments(response || []);

        } catch (err) {

            console.error("Failed to load documents:", err);

            setError(
                err.message ||
                "Unable to load documents."
            );

        } finally {

            setLoading(false);
        }
    };


    // =========================================================
    // LOAD NOTIFICATIONS (poll every 3 seconds)
    // =========================================================

    useEffect(() => {

        if (!user?.userId) {
            return;
        }

        const loadNotifications = async (isFirstLoad = false) => {

            try {

                // Only show the spinner on the first load,
                // otherwise it flickers on every poll
                if (isFirstLoad) {
                    setLoadingNotifications(true);
                }

                setNotificationError("");

                const response = await getMyNotifications();

                setNotifications(
                    Array.isArray(response) ? response : []
                );

            } catch (err) {

                console.error("Failed to load notifications:", err);

                setNotificationError(
                    err.message ||
                    "Failed to load notifications."
                );

            } finally {

                if (isFirstLoad) {
                    setLoadingNotifications(false);
                }
            }
        };

        // Load immediately
        loadNotifications(true);

        // Poll every 3 seconds
        const intervalId = setInterval(
            () => loadNotifications(false),
            3000
        );

        return () => {
            clearInterval(intervalId);
        };

    }, [user?.userId]);


    // =========================================================
    // CHECK OWNER
    // =========================================================

    const isOwner = (document) => {

        const ownerId =
            document?.owner?.id ??
            document?.ownerId;

        return (
            Number(ownerId) ===
            Number(user?.userId)
        );
    };


    // =========================================================
    // GET DOCUMENT PERMISSION
    // =========================================================

    const getDocumentPermission = async (document) => {

        if (!document?.id) {
            return "VIEWER";
        }

        // OWNER
        if (isOwner(document)) {

            setDocumentPermissions((current) => ({
                ...current,
                [document.id]: "OWNER"
            }));

            return "OWNER";
        }

        // Already loaded
        if (documentPermissions[document.id]) {
            return documentPermissions[document.id];
        }

        try {

            setLoadingPermissionId(document.id);

            const result = await getCollaborators(document.id);

            const currentUser = result.find(
                (item) =>
                    Number(item?.user?.id) ===
                    Number(user?.userId)
            );

            const permission = currentUser?.permission || "VIEWER";

            setDocumentPermissions((current) => ({
                ...current,
                [document.id]: permission
            }));

            return permission;

        } catch (err) {

            console.error("Failed to load document permission:", err);

            return "VIEWER";

        } finally {

            setLoadingPermissionId(null);
        }
    };


    // =========================================================
    // OPEN DOCUMENT
    // =========================================================

    const handleOpenDocument = async (document) => {

        setOpenMenuId(null);

        const permission = await getDocumentPermission(document);

        navigate(
            `/documents/${document.id}`,
            {
                state: {
                    permission,
                    isOwner: permission === "OWNER"
                }
            }
        );
    };


    // =========================================================
    // LOAD COLLABORATORS
    // =========================================================

    const handleCollaborators = async (document) => {

        setSelectedDocument(document);
        setCollaborators([]);
        setLoadingCollaborators(true);
        setMessage("");

        try {

            const result = await getCollaborators(document.id);

            setCollaborators(result || []);

            const currentUser = (result || []).find(
                (item) =>
                    Number(item?.user?.id) ===
                    Number(user?.userId)
            );

            if (!isOwner(document) && currentUser) {

                setDocumentPermissions((current) => ({
                    ...current,
                    [document.id]: currentUser.permission
                }));
            }

        } catch (err) {

            console.error(err);

            setCollaborators([]);

            setMessage(
                err.message ||
                "Failed to load collaborators."
            );

        } finally {

            setLoadingCollaborators(false);
        }
    };


    // =========================================================
    // LOAD USERS FOR DROPDOWN
    // Hides the owner and users who already have access
    // =========================================================

    const loadAvailableUsers = async () => {

        if (!selectedDocument) {
            return;
        }

        try {

            setLoadingUsers(true);

            const [data, currentCollaborators] = await Promise.all([
                getAllUsers(),
                getCollaborators(selectedDocument.id)
            ]);

            console.log("Users from API:", data);

            // Handle plain array or wrapped response
            const list = Array.isArray(data)
                ? data
                : data?.content ?? data?.users ?? [];

            setCollaborators(currentCollaborators || []);

            const alreadyHasAccess = new Set(
                (currentCollaborators || []).map(
                    (c) => Number(c.user?.id)
                )
            );

            // Hide the logged-in user and the document owner
            alreadyHasAccess.add(Number(user?.userId));

            const ownerId =
                selectedDocument?.owner?.id ??
                selectedDocument?.ownerId;

            if (ownerId !== null && ownerId !== undefined) {
                alreadyHasAccess.add(Number(ownerId));
            }

            setAvailableUsers(
                list.filter(
                    (u) => !alreadyHasAccess.has(Number(getUserId(u)))
                )
            );

        } catch (err) {

            console.error(err);

            setCollaboratorError(
                err.message ||
                "Unable to load users."
            );

        } finally {

            setLoadingUsers(false);
        }
    };


    // =========================================================
    // OPEN ADD COLLABORATOR
    // =========================================================

    const handleOpenAddCollaborator = async () => {

        setCollaboratorUserId("");
        setCollaboratorPermission("EDITOR");
        setCollaboratorError("");
        setAvailableUsers([]);

        setShowAddCollaboratorModal(true);

        await loadAvailableUsers();
    };


    // =========================================================
    // ADD COLLABORATOR
    // =========================================================

    const handleAddCollaborator = async (e) => {

        e.preventDefault();

        setCollaboratorError("");

        if (!String(collaboratorUserId).trim()) {

            setCollaboratorError("Please select a user.");

            return;
        }

        const userId = Number(collaboratorUserId);

        if (Number.isNaN(userId) || userId <= 0) {

            setCollaboratorError("Please select a valid user.");

            return;
        }

        if (!selectedDocument) {

            setCollaboratorError("No document selected.");

            return;
        }

        setAddingCollaborator(true);

        try {

            await addCollaborator(
                selectedDocument.id,
                {
                    userId,
                    permission: collaboratorPermission
                }
            );

            const result = await getCollaborators(selectedDocument.id);

            setCollaborators(result || []);

            setShowAddCollaboratorModal(false);
            setCollaboratorUserId("");
            setCollaboratorPermission("EDITOR");

            setMessage("Collaborator added successfully.");

        } catch (err) {

            console.error(err);

            setCollaboratorError(
                err.message ||
                "Failed to add collaborator."
            );

        } finally {

            setAddingCollaborator(false);
        }
    };


    // =========================================================
    // CHANGE PERMISSION
    // =========================================================

    const handlePermissionChange = async (
        collaborator,
        newPermission
    ) => {

        if (!selectedDocument || !collaborator?.user?.id) {
            return;
        }

        const userId = collaborator.user.id;

        setUpdatingPermissionId(userId);

        try {

            const updated = await updateCollaboratorPermission(
                selectedDocument.id,
                userId,
                newPermission
            );

            setCollaborators((current) =>
                current.map((item) =>
                    Number(item.user?.id) === Number(userId)
                        ? {
                            ...item,
                            permission:
                                updated?.permission ||
                                newPermission
                        }
                        : item
                )
            );

            if (Number(userId) === Number(user?.userId)) {

                setDocumentPermissions((current) => ({
                    ...current,
                    [selectedDocument.id]: newPermission
                }));
            }

            setMessage("Permission updated successfully.");

        } catch (err) {

            console.error(err);

            setMessage(
                err.message ||
                "Failed to update permission."
            );

        } finally {

            setUpdatingPermissionId(null);
        }
    };


    // =========================================================
    // REMOVE COLLABORATOR
    // =========================================================

    const handleRemoveCollaborator = async (collaborator) => {

        if (!selectedDocument || !collaborator?.user?.id) {
            return;
        }

        const userId = collaborator.user.id;

        if (
            !window.confirm(
                "Are you sure you want to remove this collaborator?"
            )
        ) {
            return;
        }

        setRemovingCollaboratorId(userId);

        try {

            await removeCollaborator(selectedDocument.id, userId);

            setCollaborators((current) =>
                current.filter(
                    (item) =>
                        Number(item.user?.id) !== Number(userId)
                )
            );

            if (Number(userId) === Number(user?.userId)) {

                setDocumentPermissions((current) => {

                    const copy = { ...current };

                    delete copy[selectedDocument.id];

                    return copy;
                });
            }

            setMessage("Collaborator removed successfully.");

        } catch (err) {

            console.error(err);

            setMessage(
                err.message ||
                "Failed to remove collaborator."
            );

        } finally {

            setRemovingCollaboratorId(null);
        }
    };


    // =========================================================
    // NEW DOCUMENT
    // =========================================================

    const handleNewDocumentClick = () => {

        setTitle("");
        setContent("");
        setCreateError("");

        setShowNewDocumentModal(true);
    };


    // =========================================================
    // CREATE DOCUMENT
    // =========================================================

    const handleCreateDocument = async (e) => {

        e.preventDefault();

        setCreateError("");

        if (!title.trim()) {

            setCreateError("Please enter a document title.");

            return;
        }

        setCreatingDocument(true);

        try {

            await createDocument({
                title: title.trim(),
                content
            });

            setTitle("");
            setContent("");

            setShowNewDocumentModal(false);

            await loadDocuments();

            setMessage("Document created successfully.");

        } catch (err) {

            console.error(err);

            setCreateError(
                err.message ||
                "Failed to create document."
            );

        } finally {

            setCreatingDocument(false);
        }
    };


    // =========================================================
    // MENU
    // =========================================================

    const handleMenuClick = (documentId) => {

        setOpenMenuId((current) =>
            current === documentId ? null : documentId
        );
    };


    // =========================================================
    // DELETE DOCUMENT
    // =========================================================

    const handleDeleteDocument = async (document) => {

        setOpenMenuId(null);

        if (!isOwner(document)) {

            setMessage(
                "Only the document owner can delete this document."
            );

            return;
        }

        if (
            !window.confirm(
                `Are you sure you want to delete "${document.title}"?`
            )
        ) {
            return;
        }

        try {

            await deleteDocument(document.id);

            setDocuments((current) =>
                current.filter((item) => item.id !== document.id)
            );

            setMessage(
                `"${document.title}" was deleted successfully.`
            );

        } catch (err) {

            console.error(err);

            setMessage(
                err.message ||
                "Failed to delete document."
            );
        }
    };


    // =========================================================
    // NOTIFICATION CLICK
    // =========================================================

    const handleNotificationClick = async (notification) => {

        try {

            if (!notification.isRead) {

                const updated = await markNotificationAsRead(
                    notification.id
                );

                setNotifications((current) =>
                    current.map((item) =>
                        item.id === notification.id
                            ? updated
                            : item
                    )
                );
            }

            if (notification.document?.id) {

                setShowNotifications(false);

                navigate(`/documents/${notification.document.id}`);
            }

        } catch (err) {

            console.error("Failed to process notification:", err);
        }
    };


    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = () => {

        logout();
    };


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div
            className="container-fluid min-vh-100 bg-light p-0"
            onClick={() => {

                setOpenMenuId(null);
                setShowAccount(false);
                setShowNotifications(false);
            }}
        >


            {/* =================================================
                NAVBAR
            ================================================= */}

            <nav className="navbar bg-white border-bottom shadow-sm px-4 py-2">

                <div className="container-fluid">

                    {/* LOGO */}

                    <span className="navbar-brand fw-bold fs-5 mb-0">
                        <i className="bi bi-file-earmark-text text-primary me-2"></i>
                        CollabNote
                    </span>


                    {/* RIGHT SIDE */}

                    <div
                        className="d-flex align-items-center gap-3 position-relative"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* NOTIFICATION BELL */}

                        <div className="position-relative">

                            <button
                                type="button"
                                className="btn btn-light btn-sm position-relative"
                                title="Notifications"
                                onClick={() => {

                                    setShowNotifications((current) => !current);
                                    setShowAccount(false);
                                    setNotificationError("");
                                }}
                            >

                                <i className="bi bi-bell"></i>

                                {unreadNotifications.length > 0 && (
                                    <span
                                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                        style={{ fontSize: "10px" }}
                                    >
                                        {unreadNotifications.length}
                                    </span>
                                )}

                            </button>


                            {/* NOTIFICATION DROPDOWN */}

                            {showNotifications && (

                                <div
                                    className="dropdown-menu dropdown-menu-end show"
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        top: "100%",
                                        zIndex: 1050,
                                        width: "350px",
                                        maxHeight: "400px",
                                        overflowY: "auto"
                                    }}
                                >

                                    <h6 className="dropdown-header">
                                        <i className="bi bi-bell me-2"></i>
                                        Notifications
                                    </h6>

                                    {/* ERROR */}

                                    {notificationError && (
                                        <div className="px-3 py-2">
                                            <div className="alert alert-danger py-2 mb-0">
                                                <small>
                                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                                    {notificationError}
                                                </small>
                                            </div>
                                        </div>
                                    )}

                                    {/* LOADING */}

                                    {loadingNotifications ? (

                                        <div className="text-center p-4">
                                            <div
                                                className="spinner-border spinner-border-sm text-primary"
                                                role="status"
                                            ></div>
                                            <div className="small text-muted mt-2">
                                                Loading notifications...
                                            </div>
                                        </div>

                                    ) : notifications.length === 0 ? (

                                        <div className="text-center text-muted p-4">
                                            <i className="bi bi-bell-slash fs-3 d-block mb-2"></i>
                                            <small>No notifications</small>
                                        </div>

                                    ) : (

                                        notifications.map((notification) => (

                                            <button
                                                key={notification.id}
                                                type="button"
                                                className={`dropdown-item text-wrap py-3 ${
                                                    !notification.isRead
                                                        ? "bg-light"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        notification
                                                    )
                                                }
                                            >

                                                <div className="d-flex">

                                                    <i
                                                        className={`bi ${
                                                            notification.type === "DOCUMENT_UPDATED"
                                                                ? "bi-file-earmark-text"
                                                                : notification.type === "ACCESS_REMOVED"
                                                                    ? "bi-person-x"
                                                                    : "bi-bell"
                                                        } text-primary me-2`}
                                                    ></i>

                                                    <div className="flex-grow-1">

                                                        <div className="fw-semibold">
                                                            {notification.message}
                                                        </div>

                                                        {notification.document && (
                                                            <small className="text-muted">
                                                                {notification.document.title}
                                                            </small>
                                                        )}

                                                        {!notification.isRead && (
                                                            <div>
                                                                <small className="text-primary">
                                                                    New
                                                                </small>
                                                            </div>
                                                        )}

                                                    </div>

                                                </div>

                                            </button>

                                        ))

                                    )}

                                </div>

                            )}

                        </div>

                        


                        {/* TASKS & REMINDERS */}

                        <button
                            type="button"
                            className="btn btn-light btn-sm"
                            title="Tasks and Reminders"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowNotifications(false);
                                setShowAccount(false);
                                navigate("/tasks");
                            }}
                        >
                            <i className="bi bi-calendar-check me-1"></i>
                            Tasks & Reminders
                        </button>


                        {/* CONNECTED */}

                        <span className="small">
                            <i className="bi bi-circle-fill text-success me-1"></i>
                            Connected
                        </span>


                        {/* ACCOUNT */}

                        <div className="position-relative">

                            <button
                                type="button"
                                className="btn btn-light btn-sm"
                                onClick={() => {

                                    setShowAccount((current) => !current);
                                    setShowNotifications(false);
                                }}
                            >
                                <i className="bi bi-person-circle me-1"></i>
                                Account
                                <i className="bi bi-chevron-down ms-1"></i>
                            </button>

                            {showAccount && (

                                <div
                                    className="dropdown-menu dropdown-menu-end show"
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        top: "100%",
                                        zIndex: 1050,
                                        minWidth: "250px"
                                    }}
                                >

                                    <h6 className="dropdown-header">
                                        <i className="bi bi-person-circle me-2"></i>
                                        My Account
                                    </h6>

                                    <div className="px-3 py-2">
                                        <div className="small text-muted">Email</div>
                                        <div className="fw-semibold text-break">
                                            {user?.email || "Not available"}
                                        </div>
                                    </div>

                                    <div className="px-3 py-2">
                                        <div className="small text-muted">User ID</div>
                                        <div className="fw-semibold">
                                            {user?.userId || "Not available"}
                                        </div>
                                    </div>

                                    <div className="dropdown-divider"></div>

                                    <button
                                        type="button"
                                        className="dropdown-item text-danger"
                                        onClick={handleLogout}
                                    >
                                        <i className="bi bi-box-arrow-right me-2"></i>
                                        Logout
                                    </button>

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            </nav>


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="container py-4">

                {/* HEADER */}

                <div className="d-flex justify-content-between align-items-center mb-4">

                    <div>
                        <h3 className="fw-bold mb-1">
                            My Documents
                        </h3>
                        <p className="text-muted mb-0">
                            Recent documents and collaboration
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={(e) => {

                            e.stopPropagation();

                            handleNewDocumentClick();
                        }}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        New Document
                    </button>

                </div>


                {/* MESSAGE */}

                {message && !selectedDocument && (

                    <div className="alert alert-info d-flex justify-content-between align-items-center">

                        <span>
                            <i className="bi bi-info-circle me-2"></i>
                            {message}
                        </span>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setMessage("")}
                        ></button>

                    </div>

                )}


                {/* LOADING DOCUMENTS */}

                {loading && (
                    <div className="text-center py-5">
                        <div
                            className="spinner-border text-primary"
                            role="status"
                        ></div>
                        <p className="text-muted mt-3 mb-0">
                            Loading documents...
                        </p>
                    </div>
                )}


                {/* DOCUMENT ERROR */}

                {!loading && error && (
                    <div className="alert alert-danger">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                )}


                {/* NO DOCUMENTS */}

                {!loading && !error && documents.length === 0 && (

                    <div className="card border-0 shadow-sm">

                        <div className="card-body text-center py-5">

                            <i
                                className="bi bi-file-earmark-text text-primary"
                                style={{ fontSize: "3rem" }}
                            ></i>

                            <h5 className="fw-semibold mt-3">
                                No documents yet
                            </h5>

                            <p className="text-muted">
                                Your documents will appear here.
                            </p>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleNewDocumentClick}
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                New Document
                            </button>

                        </div>

                    </div>

                )}


                {/* DOCUMENT LIST */}

                {!loading && !error && documents.length > 0 && (

                    <div className="row g-3">

                        {documents.map((document) => {

                            const owner = isOwner(document);

                            const permission = owner
                                ? "OWNER"
                                : documentPermissions[document.id];

                            return (

                                <div className="col-12" key={document.id}>

                                    <div className="card border-0 shadow-sm">

                                        <div className="card-body py-3">

                                            <div className="d-flex align-items-center justify-content-between">

                                                {/* DOCUMENT INFO */}

                                                <div className="d-flex align-items-center">

                                                    <div className="bg-primary-subtle rounded p-3 me-3">
                                                        <i className="bi bi-file-earmark-text text-primary fs-4"></i>
                                                    </div>

                                                    <div>

                                                        <div className="d-flex align-items-center gap-2 flex-wrap">

                                                            <h5 className="mb-1 fw-semibold">
                                                                {document.title}
                                                            </h5>

                                                            {owner ? (
                                                                <span className="badge text-bg-primary">
                                                                    Owner
                                                                </span>
                                                            ) : (
                                                                <span className="badge text-bg-info">
                                                                    Shared
                                                                </span>
                                                            )}

                                                            {!owner && permission && (
                                                                <span
                                                                    className={`badge ${
                                                                        permission === "EDITOR"
                                                                            ? "text-bg-success"
                                                                            : "text-bg-secondary"
                                                                    }`}
                                                                >
                                                                    {permission}
                                                                </span>
                                                            )}

                                                        </div>

                                                        <small className="text-muted">
                                                            Document #{document.id}
                                                        </small>

                                                    </div>

                                                </div>


                                                {/* ACTIONS */}

                                                <div
                                                    className="d-flex align-items-center gap-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >

                                                    {/* PEOPLE */}

                                                    <button
                                                        type="button"
                                                        className="btn btn-light btn-sm"
                                                        title="Collaborators"
                                                        onClick={() =>
                                                            handleCollaborators(document)
                                                        }
                                                    >
                                                        <i className="bi bi-people"></i>
                                                    </button>

                                                    {/* OPEN */}

                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-sm"
                                                        disabled={
                                                            loadingPermissionId === document.id
                                                        }
                                                        onClick={() =>
                                                            handleOpenDocument(document)
                                                        }
                                                    >
                                                        {loadingPermissionId === document.id ? (
                                                            <span
                                                                className="spinner-border spinner-border-sm"
                                                                role="status"
                                                            ></span>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-folder2-open me-1"></i>
                                                                Open
                                                            </>
                                                        )}
                                                    </button>

                                                    {/* MORE */}

                                                    <div className="position-relative">

                                                        <button
                                                            type="button"
                                                            className="btn btn-light btn-sm"
                                                            title="More"
                                                            onClick={() =>
                                                                handleMenuClick(document.id)
                                                            }
                                                        >
                                                            <i className="bi bi-three-dots-vertical"></i>
                                                        </button>

                                                        {openMenuId === document.id && (

                                                            <div
                                                                className="dropdown-menu show"
                                                                style={{
                                                                    position: "absolute",
                                                                    right: 0,
                                                                    top: "100%",
                                                                    zIndex: 1000
                                                                }}
                                                            >

                                                                <button
                                                                    type="button"
                                                                    className="dropdown-item"
                                                                    onClick={() =>
                                                                        handleOpenDocument(document)
                                                                    }
                                                                >
                                                                    <i className="bi bi-folder2-open me-2"></i>
                                                                    Open
                                                                </button>

                                                                {owner && (
                                                                    <button
                                                                        type="button"
                                                                        className="dropdown-item text-danger"
                                                                        onClick={() =>
                                                                            handleDeleteDocument(document)
                                                                        }
                                                                    >
                                                                        <i className="bi bi-trash me-2"></i>
                                                                        Delete
                                                                    </button>
                                                                )}

                                                            </div>

                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                            <hr className="my-3" />

                                            <div className="d-flex justify-content-between align-items-center">

                                                <small className="text-muted">
                                                    <i className="bi bi-file-text me-1"></i>
                                                    Document
                                                </small>

                                                <small className="text-muted">
                                                    <i className="bi bi-people me-1"></i>
                                                    {document.collaboratorCount ??
                                                        "Shared document"}
                                                </small>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            );

                        })}

                    </div>

                )}

            </main>


            {/* =================================================
                NEW DOCUMENT MODAL
            ================================================= */}

            {showNewDocumentModal && (

                <div
                    className="modal fade show"
                    style={{
                        display: "block",
                        backgroundColor: "rgba(0,0,0,0.5)"
                    }}
                    tabIndex="-1"
                    aria-modal="true"
                    role="dialog"
                >

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content">

                            <div className="modal-header">

                                <h5 className="modal-title">
                                    <i className="bi bi-file-earmark-plus me-2"></i>
                                    New Document
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Close"
                                    onClick={() => setShowNewDocumentModal(false)}
                                ></button>

                            </div>

                            <form onSubmit={handleCreateDocument}>

                                <div className="modal-body">

                                    {createError && (
                                        <div className="alert alert-danger">
                                            <i className="bi bi-exclamation-triangle me-2"></i>
                                            {createError}
                                        </div>
                                    )}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Document Title
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter document title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />

                                    </div>

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Content
                                        </label>

                                        <textarea
                                            className="form-control"
                                            rows="6"
                                            placeholder="Start writing your document..."
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        ></textarea>

                                    </div>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowNewDocumentModal(false)}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={creatingDocument}
                                    >
                                        {creatingDocument ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                ></span>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-plus-lg me-2"></i>
                                                Create Document
                                            </>
                                        )}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                DOCUMENT MEMBERS MODAL
            ================================================= */}

            {selectedDocument && (

                <div
                    className="modal fade show"
                    style={{
                        display: "block",
                        backgroundColor: "rgba(0,0,0,0.5)"
                    }}
                    tabIndex="-1"
                    aria-modal="true"
                    role="dialog"
                >

                    <div className="modal-dialog modal-dialog-centered modal-lg">

                        <div className="modal-content">

                            <div className="modal-header">

                                <h5 className="modal-title">
                                    <i className="bi bi-people me-2"></i>
                                    Document Members
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Close"
                                    onClick={() => setSelectedDocument(null)}
                                ></button>

                            </div>

                            <div className="modal-body">

                                <div className="mb-3">
                                    <small className="text-muted">Document</small>
                                    <div className="fw-semibold">
                                        {selectedDocument.title}
                                    </div>
                                </div>

                                {message && (
                                    <div className="alert alert-info">
                                        <i className="bi bi-info-circle me-2"></i>
                                        {message}
                                    </div>
                                )}

                                {/* OWNER */}

                                {isOwner(selectedDocument) && (
                                    <div className="d-flex justify-content-end mb-3">
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={handleOpenAddCollaborator}
                                        >
                                            <i className="bi bi-person-plus me-2"></i>
                                            Add Collaborator
                                        </button>
                                    </div>
                                )}

                                {/* COLLABORATOR */}

                                {!isOwner(selectedDocument) && (
                                    <div className="alert alert-info py-2">
                                        <i className="bi bi-info-circle me-2"></i>
                                        You are a collaborator on this document.
                                    </div>
                                )}

                                {/* LOADING */}

                                {loadingCollaborators && (
                                    <div className="text-center py-4">
                                        <div
                                            className="spinner-border text-primary"
                                            role="status"
                                        ></div>
                                        <div className="text-muted mt-2">
                                            Loading members...
                                        </div>
                                    </div>
                                )}

                                {/* EMPTY */}

                                {!loadingCollaborators && collaborators.length === 0 && (
                                    <div className="text-center text-muted py-4">
                                        <i className="bi bi-people fs-2"></i>
                                        <p className="mt-2 mb-0">
                                            No collaborators found.
                                        </p>
                                    </div>
                                )}

                                {/* MEMBERS */}

                                {!loadingCollaborators && collaborators.length > 0 && (

                                    <div className="list-group">

                                        {collaborators.map((collaborator, index) => {

                                            const member = collaborator.user;

                                            const isCurrentUser =
                                                Number(member?.id) ===
                                                Number(user?.userId);

                                            return (

                                                <div
                                                    className="list-group-item"
                                                    key={collaborator.id || index}
                                                >

                                                    <div className="d-flex align-items-center">

                                                        <div className="bg-primary-subtle rounded-circle p-2 me-3">
                                                            <i className="bi bi-person text-primary"></i>
                                                        </div>

                                                        <div className="flex-grow-1">

                                                            <div className="fw-semibold">

                                                                {member?.name ||
                                                                    member?.email ||
                                                                    "User"}

                                                                {isCurrentUser && (
                                                                    <span className="badge text-bg-light ms-2">
                                                                        You
                                                                    </span>
                                                                )}

                                                            </div>

                                                            <small className="text-muted">
                                                                {member?.email || ""}
                                                            </small>

                                                        </div>

                                                        <div className="d-flex align-items-center gap-2">

                                                            {/* OWNER CAN CHANGE */}

                                                            {isOwner(selectedDocument) ? (

                                                                updatingPermissionId === member?.id ? (

                                                                    <span
                                                                        className="spinner-border spinner-border-sm text-primary"
                                                                        role="status"
                                                                    ></span>

                                                                ) : (

                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={collaborator.permission}
                                                                        onChange={(e) =>
                                                                            handlePermissionChange(
                                                                                collaborator,
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    >
                                                                        <option value="EDITOR">
                                                                            EDITOR
                                                                        </option>
                                                                        <option value="VIEWER">
                                                                            VIEWER
                                                                        </option>
                                                                    </select>

                                                                )

                                                            ) : (

                                                                <span
                                                                    className={`badge ${
                                                                        collaborator.permission === "EDITOR"
                                                                            ? "text-bg-success"
                                                                            : "text-bg-secondary"
                                                                    }`}
                                                                >
                                                                    {collaborator.permission}
                                                                </span>

                                                            )}

                                                            {/* REMOVE */}

                                                            {isOwner(selectedDocument) && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-danger btn-sm"
                                                                    title="Remove collaborator"
                                                                    disabled={
                                                                        removingCollaboratorId === member?.id
                                                                    }
                                                                    onClick={() =>
                                                                        handleRemoveCollaborator(collaborator)
                                                                    }
                                                                >
                                                                    {removingCollaboratorId === member?.id ? (
                                                                        <span
                                                                            className="spinner-border spinner-border-sm"
                                                                            role="status"
                                                                        ></span>
                                                                    ) : (
                                                                        <i className="bi bi-trash"></i>
                                                                    )}
                                                                </button>
                                                            )}

                                                        </div>

                                                    </div>

                                                </div>

                                            );

                                        })}

                                    </div>

                                )}

                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedDocument(null)}
                                >
                                    Close
                                </button>
                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                ADD COLLABORATOR MODAL
            ================================================= */}

            {showAddCollaboratorModal && (

                <div
                    className="modal fade show"
                    style={{
                        display: "block",
                        backgroundColor: "rgba(0,0,0,0.6)",
                        zIndex: 1060
                    }}
                    tabIndex="-1"
                    aria-modal="true"
                    role="dialog"
                >

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content">

                            <div className="modal-header">

                                <h5 className="modal-title">
                                    <i className="bi bi-person-plus me-2"></i>
                                    Add Collaborator
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Close"
                                    onClick={() => setShowAddCollaboratorModal(false)}
                                ></button>

                            </div>

                            <form onSubmit={handleAddCollaborator}>

                                <div className="modal-body">

                                    {collaboratorError && (
                                        <div className="alert alert-danger">
                                            <i className="bi bi-exclamation-triangle me-2"></i>
                                            {collaboratorError}
                                        </div>
                                    )}

                                    {/* USER DROPDOWN (ID + NAME + EMAIL) */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            User
                                        </label>

                                        <select
                                            className="form-select"
                                            value={collaboratorUserId}
                                            onChange={(e) =>
                                                setCollaboratorUserId(e.target.value)
                                            }
                                            disabled={loadingUsers}
                                            required
                                        >

                                            <option value="">
                                                {loadingUsers
                                                    ? "Loading users..."
                                                    : "Select a user"}
                                            </option>

                                            {availableUsers.map((u) => (
                                                <option
                                                    key={getUserId(u)}
                                                    value={getUserId(u)}
                                                >
                                                    {getUserLabel(u)}
                                                </option>
                                            ))}

                                        </select>

                                        {!loadingUsers && availableUsers.length === 0 ? (
                                            <small className="text-warning">
                                                No users available to add.
                                            </small>
                                        ) : (
                                            <small className="text-muted">
                                                Select the user you want to add as a collaborator.
                                            </small>
                                        )}

                                    </div>

                                    {/* PERMISSION */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Permission
                                        </label>

                                        <select
                                            className="form-select"
                                            value={collaboratorPermission}
                                            onChange={(e) =>
                                                setCollaboratorPermission(e.target.value)
                                            }
                                        >
                                            <option value="EDITOR">
                                                EDITOR
                                            </option>
                                            <option value="VIEWER">
                                                VIEWER
                                            </option>
                                        </select>

                                    </div>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowAddCollaboratorModal(false)}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={addingCollaborator}
                                    >
                                        {addingCollaborator ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                ></span>
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-person-plus me-2"></i>
                                                Add Collaborator
                                            </>
                                        )}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );
}


export default Dashboard;
