package com.collabeditor.service;

import com.collabeditor.dto.NotificationRequest;
import com.collabeditor.entity.Document;
import com.collabeditor.entity.DocumentPermission;
import com.collabeditor.entity.NotificationType;
import com.collabeditor.entity.Task;
import com.collabeditor.entity.TaskReminder;
import com.collabeditor.entity.TaskStatus;
import com.collabeditor.entity.User;
import com.collabeditor.repository.DocumentCollaboratorRepository;
import com.collabeditor.repository.TaskReminderRepository;
import com.collabeditor.repository.TaskRepository;
import com.collabeditor.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskReminderService {

    private final TaskReminderRepository reminderRepository;
    private final NotificationService notificationService;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final DocumentCollaboratorRepository collaboratorRepository;
    private final EmailService emailService;

    /*
     * All reminder times are treated as Indian Standard Time.
     * Render servers normally run in UTC, so we must not use
     * LocalDateTime.now() directly for reminder comparison.
     */
    private static final ZoneId INDIA_ZONE =
            ZoneId.of("Asia/Kolkata");

    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void processDueReminders() {

        processInAppReminders();

        processEmailReminders();
    }

    // =========================================================
    // IN-APP REMINDERS
    // =========================================================

    private void processInAppReminders() {

        LocalDateTime now =
                LocalDateTime.now(INDIA_ZONE);

        log.info(
                "CURRENT IST TIME: {}",
                now
        );

        List<TaskReminder> reminders =
                reminderRepository
                        .findByReminderAtLessThanEqualAndInAppSentFalse(
                                now);

        log.info(
                "Due in-app reminders found: {}",
                reminders.size()
        );

        for (TaskReminder reminder : reminders) {

            Task task = reminder.getTask();

            if (task != null &&
                    task.getStatus() == TaskStatus.COMPLETED) {

                reminder.setInAppSent(true);
                reminder.setInAppStatus("SKIPPED");

                continue;
            }

            try {

                NotificationRequest request =
                        new NotificationRequest();

                request.setUserId(
                        reminder.getRecipient().getId());

                if (task != null &&
                        task.getDocument() != null) {

                    request.setDocumentId(
                            task.getDocument().getId());
                }

                request.setType(
                        NotificationType.TASK_REMINDER);

                String prefix = task == null
                        ? "Personal reminder: "
                        : "Task reminder: ";

                String notificationMessage =
                        prefix + reminder.getMessage();

                if (notificationMessage.length() > 255) {

                    notificationMessage =
                            notificationMessage.substring(0, 255);
                }

                request.setMessage(notificationMessage);

                notificationService.createNotification(request);

                reminder.setInAppSent(true);
                reminder.setInAppStatus("SENT");
                reminder.setInAppSentAt(
                        LocalDateTime.now(INDIA_ZONE));

                log.info(
                        "In-app reminder {} sent to user {}",
                        reminder.getId(),
                        reminder.getRecipient().getId()
                );

            } catch (Exception e) {

                reminder.setInAppStatus("FAILED");

                log.error(
                        "In-app reminder {} failed",
                        reminder.getId(),
                        e);
            }
        }

        reminderRepository.saveAll(reminders);
    }

    // =========================================================
    // EMAIL REMINDERS
    // =========================================================

    private void processEmailReminders() {

        LocalDateTime now =
                LocalDateTime.now(INDIA_ZONE);

        log.info(
                "CURRENT IST TIME: {}",
                now
        );

        List<TaskReminder> reminders =
                reminderRepository
                        .findByReminderAtLessThanEqualAndEmailSentFalse(
                                now);

        log.info(
                "Due email reminders found: {}",
                reminders.size());

        for (TaskReminder reminder : reminders) {

            Task task = reminder.getTask();

            // Do not send reminder for completed task
            if (task != null &&
                    task.getStatus() == TaskStatus.COMPLETED) {

                reminder.setEmailStatus("SKIPPED");
                reminder.setEmailSent(true);

                continue;
            }

            User recipient = reminder.getRecipient();

            if (recipient == null) {

                reminder.setEmailStatus("FAILED");

                log.warn(
                        "Email reminder {} failed: recipient missing",
                        reminder.getId());

                continue;
            }

            String email = recipient.getEmail();

            if (email == null || email.isBlank()) {

                reminder.setEmailStatus("FAILED");

                log.warn(
                        "Email reminder {} failed: email missing for user {}",
                        reminder.getId(),
                        recipient.getId());

                continue;
            }

            try {

                boolean taskReminder = task != null;

                emailService.sendReminderEmail(
                        email,
                        recipient.getName(),
                        reminder.getMessage(),
                        taskReminder
                );

                reminder.setEmailSent(true);
                reminder.setEmailStatus("SENT");
                reminder.setEmailSentAt(
                        LocalDateTime.now(INDIA_ZONE));

                log.info(
                        "Email reminder {} sent to {}",
                        reminder.getId(),
                        email);

            } catch (Exception e) {

                reminder.setEmailStatus("FAILED");

                log.error(
                        "Email reminder {} failed",
                        reminder.getId(),
                        e);
            }
        }

        reminderRepository.saveAll(reminders);
    }

    // =========================================================
    // SCHEDULE REMINDER
    // =========================================================

    @Transactional
    public TaskReminder scheduleReminder(
            Long taskId,
            Long requestedByUserId,
            Long recipientUserId,
            LocalDateTime reminderAt,
            String message) {

        LocalDateTime now =
                LocalDateTime.now(INDIA_ZONE);

        if (reminderAt == null ||
                !reminderAt.isAfter(now)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Reminder time must be in the future");
        }

        if (message == null ||
                message.isBlank() ||
                message.length() > 250) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Message must contain 1 to 250 characters");
        }

        User requester =
                userRepository.findById(requestedByUserId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "User not found"));

        User recipient =
                userRepository.findById(recipientUserId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Recipient user not found"));

        // =====================================================
        // PERSONAL REMINDER
        // =====================================================

        if (taskId == null) {

            // Personal reminder always belongs to
            // the logged-in user.

            TaskReminder reminder =
                    new TaskReminder();

            reminder.setTask(null);
            reminder.setRecipient(requester);
            reminder.setReminderAt(reminderAt);
            reminder.setMessage(message);

            reminder.setInAppSent(false);
            reminder.setEmailSent(false);

            reminder.setInAppStatus("PENDING");
            reminder.setEmailStatus("PENDING");

            return reminderRepository.save(reminder);
        }

        // =====================================================
        // TASK REMINDER
        // =====================================================

        Task task =
                taskRepository.findById(taskId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Task not found"));

        boolean isCreator =
                task.getCreatedBy() != null &&
                task.getCreatedBy()
                        .getId()
                        .equals(requestedByUserId);

        boolean isAssignee =
                task.getAssignedTo() != null &&
                task.getAssignedTo()
                        .getId()
                        .equals(requestedByUserId);

        if (!isCreator && !isAssignee) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot schedule a reminder for this task");
        }

        Document document =
                task.getDocument();

        if (document != null) {

            Long documentId =
                    document.getId();

            boolean isOwner =
                    document.getOwner()
                            .getId()
                            .equals(requestedByUserId);

            boolean isEditor =
                    collaboratorRepository
                            .findByDocumentIdAndUserId(
                                    documentId,
                                    requestedByUserId)
                            .map(c ->
                                    c.getPermission() ==
                                            DocumentPermission.EDITOR)
                            .orElse(false);

            if (!isOwner && !isEditor) {

                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Only the document owner or an editor " +
                                "can schedule reminders");
            }
        }

        // Task reminder must target task assignee
        if (task.getAssignedTo() == null ||
                !task.getAssignedTo()
                        .getId()
                        .equals(recipientUserId)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Recipient must be the task assignee");
        }

        // Completed task cannot have reminder
        if (task.getStatus() == TaskStatus.COMPLETED) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot schedule a reminder for a completed task");
        }

        TaskReminder reminder =
                new TaskReminder();

        reminder.setTask(task);
        reminder.setRecipient(recipient);
        reminder.setReminderAt(reminderAt);
        reminder.setMessage(message);

        reminder.setInAppSent(false);
        reminder.setEmailSent(false);

        reminder.setInAppStatus("PENDING");
        reminder.setEmailStatus("PENDING");

        return reminderRepository.save(reminder);
    }
}