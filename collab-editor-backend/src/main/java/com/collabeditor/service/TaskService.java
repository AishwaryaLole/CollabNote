package com.collabeditor.service;

import com.collabeditor.dto.NotificationRequest;
import com.collabeditor.entity.Document;
import com.collabeditor.entity.NotificationType;
import com.collabeditor.entity.Task;
import com.collabeditor.entity.TaskPriority;
import com.collabeditor.entity.TaskStatus;
import com.collabeditor.entity.User;
import com.collabeditor.repository.TaskRepository;
import com.collabeditor.repository.DocumentRepository;
import com.collabeditor.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public Task createTask(
            Long documentId,
            Long createdById,
            Long assignedToId,
            String title,
            String description,
            TaskPriority priority,
            java.time.LocalDateTime dueDate) {

        User creator = userRepository.findById(createdById)
                .orElseThrow(() ->
                        new RuntimeException("Creator not found"));

        // For a personal task, assign it to the creator by default.
        Long finalAssigneeId =
                assignedToId != null ? assignedToId : createdById;

        User assignee = userRepository.findById(finalAssigneeId)
                .orElseThrow(() ->
                        new RuntimeException("Assigned user not found"));

        Task task = new Task();

        task.setCreatedBy(creator);
        task.setAssignedTo(assignee);
        task.setTitle(title);
        task.setDescription(description);
        task.setPriority(
                priority != null ? priority : TaskPriority.MEDIUM);
        task.setDueDate(dueDate);
        task.setStatus(TaskStatus.PENDING);

        // A null documentId means this is a personal task.
        if (documentId != null) {

            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() ->
                            new RuntimeException("Document not found"));

            task.setDocument(document);
        }

        Task savedTask = taskRepository.save(task);

        // Existing in-app notification
        notificationService.createNotification(
                createTaskNotification(savedTask)
        );

        // Email to assigned user's registered email
        emailService.sendTaskAssignedEmail(
                assignee.getEmail(),
                assignee.getName(),
                savedTask.getTitle(),
                creator.getName()
        );

        return savedTask;
    }

    @Transactional(readOnly = true)
    public List<Task> getTasksByDocument(Long documentId) {
        return taskRepository.findByDocumentId(documentId);
    }

    @Transactional(readOnly = true)
    public List<Task> getTasksAssignedToUser(Long userId) {
        return taskRepository.findByAssignedToId(userId);
    }

    @Transactional
    public Task updateTaskStatus(
            Long taskId,
            TaskStatus status,
            Long completedByUserId) {

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException("Task not found"));

        task.setStatus(status);

        Task updatedTask = taskRepository.save(task);

        if (status == TaskStatus.COMPLETED) {

            // Existing in-app notification
            notificationService.notifyTaskCompleted(
                    taskId,
                    completedByUserId
            );

            // Email to the user who created/assigned the task
            User creator = task.getCreatedBy();

            if (creator != null &&
                    creator.getEmail() != null &&
                    !creator.getEmail().isBlank()) {

                emailService.sendTaskCompletedEmail(
                        creator.getEmail(),
                        creator.getName(),
                        task.getTitle(),
                        task.getAssignedTo() != null
                                ? task.getAssignedTo().getName()
                                : "the assigned user"
                );
            }
        }

        return updatedTask;
    }

    @Transactional
    public Task updateTaskPriority(
            Long taskId,
            TaskPriority priority) {

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException("Task not found"));

        task.setPriority(priority);

        return taskRepository.save(task);
    }

    @Transactional
    public void deleteTask(Long taskId) {

        if (!taskRepository.existsById(taskId)) {
            throw new RuntimeException("Task not found");
        }

        taskRepository.deleteById(taskId);
    }

    private NotificationRequest createTaskNotification(Task task) {

        NotificationRequest request = new NotificationRequest();

        // Notification goes to the user assigned to the task
        request.setUserId(task.getAssignedTo().getId());

        // Document can be null for personal tasks
        if (task.getDocument() != null) {
            request.setDocumentId(task.getDocument().getId());
        }

        request.setType(NotificationType.TASK_REMINDER);

        request.setMessage(
                "A new task \"" +
                task.getTitle() +
                "\" was assigned to you."
        );

        return request;
    }
}