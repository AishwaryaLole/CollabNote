const BASE_URL = "https://collabnote-hjac.onrender.com";


/* ================================
   HELPERS
================================ */

function getAuthHeaders(extra = {}) {

    const token = localStorage.getItem("token");

    return {
        ...extra,
        "Authorization": `Bearer ${token}`
    };
}

// Reads the body as text and safely tries to parse JSON.
// Never throws on an empty or non-JSON body.
async function readResponse(response, fallback = {}) {

    const text = await response.text();

    let result = fallback;

    try {
        result = text ? JSON.parse(text) : fallback;
    } catch {
        result = fallback;
    }

    return { text, result };
}


/* ================================
   AUTH
================================ */

export async function registerUser(data) {

    const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const { text, result } = await readResponse(response);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            "Registration failed"
        );
    }

    return result;
}


export async function loginUser(data) {

    const response = await fetch(
        `${BASE_URL}/api/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    );

    const { result } = await readResponse(response);

    if (!response.ok) {

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            throw new Error(
                "Invalid email or password."
            );
        }

        throw new Error(
            result.message ||
            "Unable to login. Please try again."
        );
    }

    return result;
}


/* ================================
   DOCUMENTS
================================ */

export async function getDocuments() {

    const response = await fetch(`${BASE_URL}/api/documents/my`, {
        method: "GET",
        headers: getAuthHeaders()
    });

    const { text, result } = await readResponse(response, []);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            "Failed to load documents"
        );
    }

    return result;
}


/* CREATE DOCUMENT */

export async function createDocument(data) {

    const response = await fetch(`${BASE_URL}/api/documents`, {
        method: "POST",
        headers: getAuthHeaders({
            "Content-Type": "application/json"
        }),
        body: JSON.stringify(data)
    });

    const text = await response.text();

    if (!response.ok) {
        throw new Error(
            text || `Failed to create document (${response.status})`
        );
    }

    return text ? JSON.parse(text) : null;
}


export async function getDocument(documentId) {

    const response = await fetch(
        `${BASE_URL}/api/documents/${documentId}`,
        {
            method: "GET",
            headers: getAuthHeaders()
        }
    );

    const { text, result } = await readResponse(response);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            `Failed to load document (${response.status})`
        );
    }

    return result;
}


export async function getDocumentPermission(documentId) {

    const response = await fetch(
        `${BASE_URL}/api/documents/${documentId}/permission`,
        {
            method: "GET",
            headers: getAuthHeaders()
        }
    );

    const text = await response.text();

    if (!response.ok) {
        throw new Error(
            text ||
            `Failed to load document permission (${response.status})`
        );
    }

    return text;
}


export async function deleteDocument(documentId) {

    const response = await fetch(
        `${BASE_URL}/api/documents/${documentId}`,
        {
            method: "DELETE",
            headers: getAuthHeaders()
        }
    );

    if (!response.ok) {

        const { text, result } = await readResponse(response);

        throw new Error(
            result.message ||
            text ||
            `Failed to delete document (${response.status})`
        );
    }

    return true;
}


export async function updateDocumentContent(documentId, content) {

    const response = await fetch(
        `${BASE_URL}/api/documents/${documentId}/content`,
        {
            method: "PATCH",
            headers: getAuthHeaders({
                "Content-Type": "text/plain"
            }),
            body: content
        }
    );

    const { text, result } = await readResponse(response);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            `Failed to save document (${response.status})`
        );
    }

    return result;
}


/* ================================
   USERS
================================ */

/* GET USER BY ID */

export async function getUserById(userId) {

    const response = await fetch(
        `${BASE_URL}/api/users/${userId}`,
        {
            method: "GET",
            headers: getAuthHeaders()
        }
    );

    const { text, result } = await readResponse(response);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            "User not found"
        );
    }

    return result;
}


/* GET ALL USERS */

export async function getAllUsers() {

    const response = await fetch(
        `${BASE_URL}/api/users`,
        {
            method: "GET",
            headers: getAuthHeaders()
        }
    );

    const { text, result } = await readResponse(response, []);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            `Failed to load users (${response.status})`
        );
    }

    return result;
}


/* ================================
   COLLABORATORS
================================ */

export async function getCollaborators(documentId) {

    const response = await fetch(
        `${BASE_URL}/api/documents/${documentId}/collaborators`,
        {
            method: "GET",
            headers: getAuthHeaders()
        }
    );

    const { text, result } = await readResponse(response, []);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            "Failed to load collaborators"
        );
    }

    return result;
}


/* ADD COLLABORATOR */

export async function addCollaborator(documentId, data) {

    const response = await fetch(
        `${BASE_URL}/api/documents/${documentId}/collaborators`,
        {
            method: "POST",
            headers: getAuthHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(data)
        }
    );

    const { text, result } = await readResponse(response);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            `Failed to add collaborator (${response.status})`
        );
    }

    return result;
}


/* CHANGE COLLABORATOR PERMISSION */

export async function updateCollaboratorPermission(
    documentId,
    userId,
    permission
) {

    const response = await fetch(
        `${BASE_URL}/api/documents/${documentId}/collaborators/${userId}`,
        {
            method: "PUT",
            headers: getAuthHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({
                permission: permission
            })
        }
    );

    const { text, result } = await readResponse(response);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            `Failed to update permission (${response.status})`
        );
    }

    return result;
}


/* REMOVE COLLABORATOR */

export async function removeCollaborator(documentId, userId) {

    const response = await fetch(
        `${BASE_URL}/api/documents/${documentId}/collaborators/${userId}`,
        {
            method: "DELETE",
            headers: getAuthHeaders()
        }
    );

    const { text, result } = await readResponse(response);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            `Failed to remove collaborator (${response.status})`
        );
    }

    return result;
}


/* ================================
   NOTIFICATIONS
================================ */

/* GET MY NOTIFICATIONS */

export async function getMyNotifications() {

    const response = await fetch(
        `${BASE_URL}/api/notifications`,
        {
            method: "GET",
            headers: getAuthHeaders({
                "Content-Type": "application/json"
            })
        }
    );

    const { text, result } = await readResponse(response, []);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            `Failed to load notifications (${response.status})`
        );
    }

    return result;
}


/* MARK NOTIFICATION AS READ */

export async function markNotificationAsRead(notificationId) {

    const response = await fetch(
        `${BASE_URL}/api/notifications/${notificationId}/read`,
        {
            method: "PUT",
            headers: getAuthHeaders()
        }
    );

    const { text, result } = await readResponse(response);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            `Failed to mark notification as read (${response.status})`
        );
    }

    return result;
}


/* DELETE NOTIFICATION */

export async function deleteNotification(notificationId) {

    const response = await fetch(
        `${BASE_URL}/api/notifications/${notificationId}`,
        {
            method: "DELETE",
            headers: getAuthHeaders()
        }
    );

    if (!response.ok) {

        const text = await response.text();

        throw new Error(
            text ||
            `Failed to delete notification (${response.status})`
        );
    }

    return true;
}

// GET DOCUMENT VERSIONS

export async function getDocumentVersions(documentId) {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `${BASE_URL}/api/documents/${documentId}/versions`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    const text = await response.text();

    let result = [];

    try {
        result = text ? JSON.parse(text) : [];
    } catch {
        result = [];
    }

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            "Failed to load document versions."
        );
    }

    return result;
}


/* ================================
   TASKS
================================ */

export async function getTasks() {
    const response = await fetch(`${BASE_URL}/api/tasks`, {
        method: "GET",
        headers: getAuthHeaders()
    });

    const { text, result } = await readResponse(response, []);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            `Failed to load tasks (${response.status})`
        );
    }

    return Array.isArray(result)
        ? result
        : result?.content ?? [];
}


/* CREATE TASK */

export async function createTask(data) {
    const response = await fetch(`${BASE_URL}/api/tasks`, {
        method: "POST",
        headers: getAuthHeaders({
            "Content-Type": "application/json"
        }),
        body: JSON.stringify(data)
    });

    const { text, result } = await readResponse(response);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            `Failed to create task (${response.status})`
        );
    }

    return result;
}


/* ================================
  TASK REMINDERS
================================ */

export async function createTaskReminder(data) {
    const response = await fetch(
        `${BASE_URL}/api/task-reminders`,
        {
            method: "POST",
            headers: getAuthHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(data)
        }
    );

    const { text, result } = await readResponse(response);

    if (!response.ok) {
        throw new Error(
            result.message ||
            text ||
            `Failed to schedule reminder (${response.status})`
        );
    }

    return result;
}
