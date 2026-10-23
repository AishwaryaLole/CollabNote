package com.collabeditor.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.collabeditor.dto.NotificationRequest;
import com.collabeditor.entity.Document;
import com.collabeditor.entity.DocumentCollaborator;
import com.collabeditor.entity.DocumentPermission;
import com.collabeditor.entity.Notification;
import com.collabeditor.entity.NotificationType;
import com.collabeditor.entity.Task;
import com.collabeditor.entity.User;
import com.collabeditor.repository.DocumentCollaboratorRepository;
import com.collabeditor.repository.DocumentRepository;
import com.collabeditor.repository.NotificationRepository;
import com.collabeditor.repository.TaskRepository;
import com.collabeditor.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentCollaboratorRepository collaboratorRepository;
    private final TaskRepository taskRepository;

    // ================================
    // CREATE
    // ================================

    public Notification createNotification(
            NotificationRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Document document = null;

        if (request.getDocumentId() != null) {

            document = documentRepository
                    .findById(request.getDocumentId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Document not found"));
        }

        Notification notification = new Notification();

        notification.setUser(user);
        notification.setDocument(document);
        notification.setType(request.getType());
        notification.setMessage(request.getMessage());

        return notificationRepository.save(notification);
    }


    // ================================
    // GET USER NOTIFICATIONS
    // ================================

    public List<Notification> getUserNotifications(
            Long userId) {

        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId);
    }


    // ================================
    // MARK AS READ
    // ================================

    public Notification markAsRead(Long id) {

        Notification notification =
                notificationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"));

        notification.setIsRead(true);

        return notificationRepository.save(notification);
    }


    // ================================
    // DELETE
    // ================================

    public void deleteNotification(Long id) {

        Notification notification =
                notificationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"));

        notificationRepository.delete(notification);
    }


    // ================================
    // DOCUMENT SHARED
    // ================================

    public void notifyDocumentShared(
            Long documentId,
            Long userId,
            DocumentPermission permission) {

        Document document =
                documentRepository.findById(documentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"));

        NotificationRequest request =
                new NotificationRequest();

        request.setUserId(userId);
        request.setDocumentId(documentId);
        request.setType(NotificationType.DOCUMENT_SHARED);

        request.setMessage(
                "The document \""
                + document.getTitle()
                + "\" was shared with you with "
                + permission
                + " permission."
        );

        createNotification(request);
    }


    // ================================
    // PERMISSION UPDATED
    // ================================

    public void notifyPermissionUpdated(
            Long documentId,
            Long userId,
            DocumentPermission permission) {

        Document document =
                documentRepository.findById(documentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"));

        NotificationRequest request =
                new NotificationRequest();

        request.setUserId(userId);
        request.setDocumentId(documentId);

        // Using existing notification type
        request.setType(NotificationType.DOCUMENT_SHARED);

        request.setMessage(
                "Your permission for \""
                + document.getTitle()
                + "\" was changed to "
                + permission
                + "."
        );

        createNotification(request);
    }


    // ================================
    // ACCESS REMOVED
    // ================================

    public void notifyAccessRemoved(
            Long documentId,
            Long userId) {

        Document document =
                documentRepository.findById(documentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"));

        NotificationRequest request =
                new NotificationRequest();

        request.setUserId(userId);
        request.setDocumentId(documentId);
        request.setType(NotificationType.ACCESS_REMOVED);

        request.setMessage(
                "Your access to \""
                + document.getTitle()
                + "\" was removed."
        );

        createNotification(request);
    }


    // ================================
    // DOCUMENT UPDATED
    // ================================

    public void notifyDocumentUpdated(
            Long documentId,
            Long updatedByUserId) {

        Document document =
                documentRepository.findById(documentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"));


        // =========================================================
        // NOTIFY OWNER
        // =========================================================

        Long ownerId =
                document.getOwner().getId();

        if (!ownerId.equals(updatedByUserId)) {

            NotificationRequest notification =
                    new NotificationRequest();

            notification.setUserId(ownerId);

            notification.setDocumentId(documentId);

            notification.setType(
                    NotificationType.DOCUMENT_UPDATED
            );

            notification.setMessage(
                    "Document \""
                    + document.getTitle()
                    + "\" was updated."
            );

            createNotification(notification);
        }


        // =========================================================
        // NOTIFY COLLABORATORS
        // =========================================================

        List<DocumentCollaborator> collaborators =
                collaboratorRepository
                        .findByDocumentId(documentId);


        for (DocumentCollaborator collaborator :
                collaborators) {

            Long collaboratorUserId =
                    collaborator.getUser().getId();


            // Do not notify the person who made the update
            if (collaboratorUserId.equals(updatedByUserId)) {
                continue;
            }


            // Avoid duplicate notification if owner
            if (collaboratorUserId.equals(ownerId)) {
                continue;
            }


            NotificationRequest notification =
                    new NotificationRequest();

            notification.setUserId(
                    collaboratorUserId
            );

            notification.setDocumentId(
                    documentId
            );

            notification.setType(
                    NotificationType.DOCUMENT_UPDATED
            );

            notification.setMessage(
                    "Document \""
                    + document.getTitle()
                    + "\" was updated."
            );

            createNotification(notification);
        }
    }
 // ================================
 // TASK COMPLETED
 // ================================

 public void notifyTaskCompleted(
         Long taskId,
         Long completedByUserId) {

     Task task = taskRepository.findById(taskId)
             .orElseThrow(() ->
                     new RuntimeException("Task not found"));

     // User who created/assigned the task
     Long taskCreatorId = task.getCreatedBy().getId();

     // Do not notify if the creator completed their own task
     if (taskCreatorId.equals(completedByUserId)) {
         return;
     }

     NotificationRequest request = new NotificationRequest();

     // Notification goes to the task creator
     request.setUserId(taskCreatorId);

     if (task.getDocument() != null) {
         request.setDocumentId(
                 task.getDocument().getId()
         );
     }

     request.setType(NotificationType.TASK_COMPLETED);

     request.setMessage(
             "Task \"" + task.getTitle() + "\" has been completed."
     );

     createNotification(request);
 }
}