
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDocuments } from "../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const userIdOf = (u) => u?.id ?? u?.userId ?? u?.user_id;
const userNameOf = (u) =>
  u?.name ?? u?.fullName ?? u?.username ?? u?.email ?? "User";
const taskTitleOf = (t) =>
  t?.title ?? t?.name ?? `Task ${t?.id ?? ""}`;

const localDateTimeMin = () => {
  const d = new Date(Date.now() + 60_000);
  const pad = (n) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function Tasks() {
  const navigate = useNavigate();

  const [taskType, setTaskType] = useState("PERSONAL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  const [reminderType, setReminderType] = useState("PERSONAL");
  const [reminderTaskId, setReminderTaskId] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [showTaskSuggestions, setShowTaskSuggestions] = useState(false);
  const [reminderAt, setReminderAt] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");

  const [currentUserId, setCurrentUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tasksLoadError, setTasksLoadError] = useState("");

  const headers = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const readJson = async (response, fallback) => {
    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `${fallback} (HTTP ${response.status})`);
    }

    if (response.status === 204) return null;

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  };

  // Decode the email claim from the existing JWT.
  // This does not verify the token; the backend still verifies authentication.
  const getEmailFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "";

      const payload = token.split(".")[1];
      if (!payload) return "";

      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(normalized);
      const bytes = Uint8Array.from(decoded, (c) => c.charCodeAt(0));
      const claims = JSON.parse(new TextDecoder().decode(bytes));

      return claims.sub ?? claims.email ?? "";
    } catch {
      return "";
    }
  };

  const loadData = async () => {
    setLoadingData(true);
    setError("");

    try {
      const h = headers();

      const [userRes, taskRes, docResult] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users`, { headers: h }),
        fetch(`${API_BASE_URL}/api/tasks`, { headers: h }),
        getDocuments().catch(() => []),
      ]);

      const userData = await readJson(userRes, "Unable to load users");
      const userList = Array.isArray(userData)
        ? userData
        : userData?.content ?? userData?.users ?? [];

      setUsers(userList);

      const email = getEmailFromToken();
      const currentUser = userList.find(
        (u) => String(u?.email ?? "").toLowerCase() === email.toLowerCase()
      );

      setCurrentUserId(currentUser ? String(userIdOf(currentUser)) : "");

      setDocuments(
        Array.isArray(docResult) ? docResult : docResult?.content ?? []
      );

      if (!taskRes.ok) {
        setTasks([]);

        setTasksLoadError(
          taskRes.status === 404
            ? "The backend does not expose GET /api/tasks."
            : `Could not load tasks (HTTP ${taskRes.status}).`
        );
      } else {
        const taskData = await taskRes.json();

        setTasks(
          Array.isArray(taskData)
            ? taskData
            : taskData?.content ?? taskData?.tasks ?? []
        );

        setTasksLoadError("");
      }
    } catch (e) {
      setError(e.message || "Unable to load page data.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedDocument = useMemo(
    () => documents.find((d) => String(d.id) === String(documentId)),
    [documents, documentId]
  );

  const selectedTask = useMemo(
    () => tasks.find((t) => String(t.id) === String(reminderTaskId)),
    [tasks, reminderTaskId]
  );

  const taskSuggestions = useMemo(() => {
    const query = taskSearch.trim().toLowerCase();

    if (!query) return [];

    return tasks
      .filter((t) =>
        taskTitleOf(t).toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [tasks, taskSearch]);

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Enter a task title.");
      return;
    }

    if (taskType === "DOCUMENT" && !documentId) {
      setError("Select a document by name and ID.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          taskType,
          documentId:
            taskType === "DOCUMENT" ? Number(documentId) : null,
          assignedToId: assignedToId ? Number(assignedToId) : null,
          title: title.trim(),
          description: description.trim(),
          priority,
          dueDate: dueDate || null,
        }),
      });

      const created = await readJson(response, "Task creation failed");

      setSuccess("Task created successfully.");

      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
      setDocumentId("");
      setAssignedToId("");
      setTaskType("PERSONAL");

      await loadData();

      if (created?.id) {
        setReminderTaskId(String(created.id));
        setTaskSearch(taskTitleOf(created));
      }
    } catch (e2) {
      setError(e2.message || "Unable to create task.");
    } finally {
      setSaving(false);
    }
  };

  const handleReminderSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentUserId) {
      setError(
        "Could not identify your logged-in account. Please log out and log in again."
      );
      return;
    }

    if (!reminderAt || new Date(reminderAt) <= new Date()) {
      setError("Choose a future reminder date and time.");
      return;
    }

    if (!reminderMessage.trim()) {
      setError("Enter a reminder message.");
      return;
    }

    if (reminderType === "TASK" && !reminderTaskId) {
      setError("Select a task from the suggestions.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE_URL}/api/task-reminders`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          taskId:
            reminderType === "TASK" ? Number(reminderTaskId) : null,
          recipientUserId:
            reminderType === "PERSONAL"
              ? Number(currentUserId)
              : Number(
                  selectedTask?.assignedTo?.id ??
                    selectedTask?.assignedToId ??
                    selectedTask?.assignee?.id ??
                    currentUserId
                ),
          reminderAt,
          message: reminderMessage.trim(),
        }),
      });

      await readJson(response, "Reminder creation failed");

      setSuccess(
        reminderType === "PERSONAL"
          ? "Personal reminder scheduled."
          : "Task reminder scheduled."
      );

      setReminderAt("");
      setReminderMessage("");
      setReminderTaskId("");
      setTaskSearch("");
      setShowTaskSuggestions(false);
    } catch (e2) {
      setError(e2.message || "Unable to schedule reminder.");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
  setError("");
  setSuccess("");

  try {
    setSaving(true);

    const response = await fetch(
      `${API_BASE_URL}/api/tasks/${taskId}/status?status=COMPLETED`,
      {
        method: "PATCH",
        headers: headers()
      }
    );

    await readJson(response, "Unable to complete task");

    setSuccess("Task marked as completed.");

    await loadData();
  } catch (e) {
    setError(e.message || "Unable to complete task.");
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="container-fluid min-vh-100 bg-light px-3 px-lg-5 py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Tasks &amp; Reminders</h2>
          <p className="text-secondary mb-0">
            Organize work and schedule reminders.
          </p>
        </div>

        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          <i className="bi bi-arrow-left me-2" />
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          <i className="bi bi-check-circle me-2" />
          {success}
        </div>
      )}

      {tasksLoadError && (
        <div className="alert alert-warning" role="alert">
          <div className="fw-semibold mb-1">Task list unavailable</div>
          {tasksLoadError}
        </div>
      )}

      {loadingData && (
        <div className="alert alert-info">
          Loading users, documents, and tasks…
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 px-4 pt-4">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 bg-primary-subtle text-primary p-3">
                  <i className="bi bi-plus-circle fs-4" />
                </div>
                <div>
                  <h4 className="fw-bold mb-1">Create New Task</h4>
                  <p className="text-secondary mb-0">
                    Fill in details to organize work
                  </p>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              <form onSubmit={handleTaskSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">
                      Task type
                    </label>
                    <select
                      className="form-select form-select-lg"
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value)}
                    >
                      <option value="PERSONAL">Personal task</option>
                      <option value="DOCUMENT">Document-linked task</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    {taskType === "DOCUMENT" ? (
                      <>
                        <label className="form-label fw-semibold">
                          Document
                        </label>
                        <select
                          className="form-select form-select-lg"
                          value={documentId}
                          onChange={(e) => setDocumentId(e.target.value)}
                          required
                        >
                          <option value="">Select document</option>
                          {documents.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.title || "Document"} (ID: {d.id})
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <label className="form-label fw-semibold">
                          Assignee
                        </label>
                        <select
                          className="form-select form-select-lg"
                          value={assignedToId}
                          onChange={(e) => setAssignedToId(e.target.value)}
                        >
                          <option value="">Assign to me / default</option>
                          {users.map((u) => (
                            <option key={userIdOf(u)} value={userIdOf(u)}>
                              {userNameOf(u)} (ID: {userIdOf(u)})
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>

                  {taskType === "DOCUMENT" && (
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Assignee
                      </label>
                      <select
                        className="form-select form-select-lg"
                        value={assignedToId}
                        onChange={(e) => setAssignedToId(e.target.value)}
                      >
                        <option value="">Assign to me / default</option>
                        {users.map((u) => (
                          <option key={userIdOf(u)} value={userIdOf(u)}>
                            {userNameOf(u)} (ID: {userIdOf(u)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Task title <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control form-control-lg"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Complete project documentation"
                      required
                      maxLength={150}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add task details, links, or context…"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">
                      Priority level
                    </label>
                    <select
                      className="form-select form-select-lg"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="LOW">🟢 Low</option>
                      <option value="MEDIUM">🟠 Medium</option>
                      <option value="HIGH">🔴 High</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">
                      Due date &amp; time
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control form-control-lg"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  <div className="col-12 d-grid mt-4">
                    <button
                      className="btn btn-primary btn-lg"
                      disabled={saving}
                      type="submit"
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-lg me-2" />
                          Create task
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-5">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 px-4 pt-4">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 bg-warning-subtle text-warning-emphasis p-3">
                  <i className="bi bi-bell fs-4" />
                </div>
                <div>
                  <h4 className="fw-bold mb-1">Schedule Reminder</h4>
                  <p className="text-secondary mb-0">
                    Get a reminder at the right time
                  </p>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              <form onSubmit={handleReminderSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Reminder type
                  </label>
                  <select
                    className="form-select form-select-lg"
                    value={reminderType}
                    onChange={(e) => {
                      setReminderType(e.target.value);
                      setReminderTaskId("");
                      setTaskSearch("");
                      setShowTaskSuggestions(false);
                    }}
                  >
                    <option value="PERSONAL">Personal reminder</option>
                    <option value="TASK">Task reminder</option>
                  </select>
                </div>

                {reminderType === "TASK" && (
                  <div className="mb-3 position-relative">
                    <label className="form-label fw-semibold">
                      Task title
                    </label>
                    <input
                      className="form-control form-control-lg"
                      value={taskSearch}
                      onChange={(e) => {
                        setTaskSearch(e.target.value);
                        setReminderTaskId("");
                        setShowTaskSuggestions(true);
                      }}
                      onFocus={() => setShowTaskSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowTaskSuggestions(false), 150)
                      }
                      placeholder="Start typing a task title..."
                      autoComplete="off"
                      required
                    />

                    {showTaskSuggestions && taskSuggestions.length > 0 && (
                      <div
                        className="list-group position-absolute w-100 shadow"
                        style={{ zIndex: 10, maxHeight: 220, overflowY: "auto" }}
                      >
                        {taskSuggestions.map((t) => (
                          <button
                            type="button"
                            className="list-group-item list-group-item-action"
                            key={t.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setReminderTaskId(String(t.id));
                              setTaskSearch(taskTitleOf(t));
                              setShowTaskSuggestions(false);
                            }}
                          >
                            <span className="fw-semibold">
                              {taskTitleOf(t)}
                            </span>
                            <small className="text-secondary ms-2">
                              ID: {t.id}
                            </small>
                          </button>
                        ))}
                      </div>
                    )}

                    {taskSearch.trim() && taskSuggestions.length === 0 && (
                      <div className="form-text text-warning">
                        No matching tasks found.
                      </div>
                    )}

                    {!tasks.length && (
                      <div className="form-text text-warning">
                        No tasks available. Check that GET /api/tasks returns
                        your task list.
                      </div>
                    )}
                  </div>
                )}

                {reminderType === "PERSONAL" && (
                  <div className="alert alert-light border">
                    <i className="bi bi-person-check me-2" />
                    This reminder will be sent to your registered account.
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Date &amp; time
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control form-control-lg"
                    min={localDateTimeMin()}
                    value={reminderAt}
                    onChange={(e) => setReminderAt(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Reminder message
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    maxLength={250}
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    placeholder="What should you be reminded about?"
                    required
                  />
                  <div className="form-text">Up to 250 characters.</div>
                </div>

                <div className="d-grid mt-4">
                  <button
                    className="btn btn-dark btn-lg"
                    type="submit"
                    disabled={saving || loadingData}
                  >
                    {saving ? (
                      "Scheduling…"
                    ) : (
                      <>
                        <i className="bi bi-calendar-check me-2" />
                        Schedule reminder
                      </>
                    )}
                  </button>
                </div>
                
              </form>
            </div>
          </section>
        </div>

        <div className="row mt-4">
  <div className="col-12">
    <section className="card border-0 shadow-sm">
      <div className="card-header bg-white border-0 px-4 pt-4">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-3 bg-success-subtle text-success p-3">
            <i className="bi bi-list-check fs-4"></i>
          </div>

          <div>
            <h4 className="fw-bold mb-1">My Tasks</h4>
            <p className="text-secondary mb-0">
              View and manage your assigned tasks.
            </p>
          </div>
        </div>
      </div>

      <div className="card-body p-4">

        {tasks.length === 0 ? (
          <div className="text-center text-secondary py-4">
            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
            No tasks available.
          </div>
        ) : (
          <div className="row g-3">

            {tasks.map((task) => (
              <div className="col-12 col-lg-6" key={task.id}>

                <div className="border rounded-3 p-3 h-100">

                  <div className="d-flex justify-content-between align-items-start gap-3">

                    <div>
                      <h5 className="fw-bold mb-1">
                        {taskTitleOf(task)}
                      </h5>

                      <div className="text-secondary small">
                        Task ID: {task.id}
                      </div>
                    </div>

                    <span
                      className={`badge ${
                        task.status === "COMPLETED"
                          ? "bg-success"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {task.status}
                    </span>

                  </div>

                  {task.description && (
                    <p className="text-secondary mt-3 mb-2">
                      {task.description}
                    </p>
                  )}

                  <div className="small mt-3">

                    <div className="mb-2">
                      <strong>Priority:</strong>{" "}
                      {task.priority}
                    </div>

                    <div className="mb-2">
                      <strong>Due:</strong>{" "}
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleString()
                        : "No due date"}
                    </div>

                    {task.document && (
                      <div className="mb-2">
                        <strong>Document:</strong>{" "}
                        {task.document.title || "Document"}{" "}
                        (ID: {task.document.id})
                      </div>
                    )}

                    {task.assignedTo && (
                      <div className="mb-2">
                        <strong>Assigned to:</strong>{" "}
                        {userNameOf(task.assignedTo)}
                      </div>
                    )}

                  </div>

                  {task.status !== "COMPLETED" && (
                    <button
                      type="button"
                      className="btn btn-success mt-3"
                      disabled={saving}
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      <i className="bi bi-check-circle me-2"></i>
                      Complete Task
                    </button>
                  )}

                  {task.status === "COMPLETED" && (
                    <div className="text-success mt-3 fw-semibold">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Task completed
                    </div>
                  )}

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </section>
  </div>
</div>
      </div>
    </div>
  );
}
