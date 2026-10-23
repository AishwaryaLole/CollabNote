package com.collabeditor.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.collabeditor.dto.DocumentCollaboratorRequest;
import com.collabeditor.dto.NotificationRequest;
import com.collabeditor.dto.PermissionUpdateRequest;
import com.collabeditor.entity.Document;
import com.collabeditor.entity.DocumentCollaborator;
import com.collabeditor.entity.DocumentPermission;
import com.collabeditor.entity.NotificationType;
import com.collabeditor.entity.User;
import com.collabeditor.repository.DocumentCollaboratorRepository;
import com.collabeditor.repository.DocumentRepository;
import com.collabeditor.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentCollaboratorService {

    private final DocumentCollaboratorRepository collaboratorRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;


    // =========================================================
    // ADD COLLABORATOR
    // =========================================================

    public DocumentCollaborator addCollaborator(
            Long documentId,
            Long currentUserId,
            DocumentCollaboratorRequest request) {

        Document document =
                documentRepository.findById(documentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"));


        // ONLY OWNER CAN ADD COLLABORATOR
        checkOwner(document, currentUserId);


        User user =
                userRepository.findById(request.getUserId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"));


        // OWNER CANNOT ADD THEMSELVES
        if (user.getId().equals(document.getOwner().getId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Document owner cannot be added as collaborator"
            );
        }


        // CHECK IF USER IS ALREADY A COLLABORATOR
        boolean alreadyExists =
                collaboratorRepository
                        .findByDocumentIdAndUserId(
                                documentId,
                                user.getId()
                        )
                        .isPresent();

        if (alreadyExists) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "User is already a collaborator"
            );
        }


        DocumentCollaborator collaborator =
                new DocumentCollaborator();

        collaborator.setDocument(document);
        collaborator.setUser(user);
        collaborator.setPermission(
                request.getPermission()
        );


        DocumentCollaborator saved =
                collaboratorRepository.save(collaborator);


        // =====================================================
        // NOTIFICATION
        // =====================================================

        NotificationRequest notification =
                new NotificationRequest();

        notification.setUserId(user.getId());

        notification.setDocumentId(document.getId());

        notification.setType(
                NotificationType.DOCUMENT_SHARED
        );

        notification.setMessage(
                "You have been given "
                + request.getPermission()
                + " access to document \""
                + document.getTitle()
                + "\"."
        );

        notificationService.createNotification(
                notification
        );


        return saved;
    }


    // =========================================================
    // GET COLLABORATORS
    // =========================================================

    public List<DocumentCollaborator> getCollaborators(
            Long documentId,
            Long currentUserId) {

        Document document =
                documentRepository.findById(documentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"));


        // OWNER CAN VIEW
        if (document.getOwner().getId().equals(currentUserId)) {

            return collaboratorRepository
                    .findByDocumentId(documentId);
        }


        // COLLABORATOR CAN VIEW
        boolean isCollaborator =
                collaboratorRepository
                        .findByDocumentIdAndUserId(
                                documentId,
                                currentUserId
                        )
                        .isPresent();

        if (!isCollaborator) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You do not have access to this document"
            );
        }


        return collaboratorRepository
                .findByDocumentId(documentId);
    }


    // =========================================================
    // UPDATE PERMISSION
    // =========================================================

    public DocumentCollaborator updatePermission(
            Long documentId,
            Long currentUserId,
            Long collaboratorUserId,
            PermissionUpdateRequest request) {

        Document document =
                documentRepository.findById(documentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"));


        // ONLY OWNER CAN CHANGE PERMISSION
        checkOwner(document, currentUserId);


        DocumentCollaborator collaborator =
                collaboratorRepository
                        .findByDocumentIdAndUserId(
                                documentId,
                                collaboratorUserId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Collaborator not found"));


        collaborator.setPermission(
                request.getPermission()
        );


        DocumentCollaborator updated =
                collaboratorRepository.save(
                        collaborator
                );


        // =====================================================
        // NOTIFICATION
        // =====================================================

        NotificationRequest notification =
                new NotificationRequest();

        notification.setUserId(
                collaboratorUserId
        );

        notification.setDocumentId(
                documentId
        );

        notification.setType(
                NotificationType.DOCUMENT_SHARED
        );

        notification.setMessage(
                "Your permission for document \""
                + document.getTitle()
                + "\" was changed to "
                + request.getPermission()
                + "."
        );

        notificationService.createNotification(
                notification
        );


        return updated;
    }


    // =========================================================
    // REMOVE COLLABORATOR
    // =========================================================

    public void deleteCollaborator(
            Long documentId,
            Long currentUserId,
            Long collaboratorUserId) {

        Document document =
                documentRepository.findById(documentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"));


        // ONLY OWNER CAN REMOVE
        checkOwner(document, currentUserId);


        DocumentCollaborator collaborator =
                collaboratorRepository
                        .findByDocumentIdAndUserId(
                                documentId,
                                collaboratorUserId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Collaborator not found"));


        String documentTitle =
                document.getTitle();


        collaboratorRepository.delete(
                collaborator
        );


        // =====================================================
        // NOTIFICATION
        // =====================================================

        NotificationRequest notification =
                new NotificationRequest();

        notification.setUserId(
                collaboratorUserId
        );

        notification.setDocumentId(
                documentId
        );

        notification.setType(
                NotificationType.ACCESS_REMOVED
        );

        notification.setMessage(
                "Your access to document \""
                + documentTitle
                + "\" has been removed."
        );

        notificationService.createNotification(
                notification
        );
    }


    // =========================================================
    // CHECK EDIT PERMISSION
    // =========================================================

    public boolean hasEditPermission(
            Long documentId,
            Long userId) {

        Document document =
                documentRepository.findById(documentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"));


        // OWNER CAN EDIT
        if (document.getOwner().getId().equals(userId)) {
            return true;
        }


        // COLLABORATOR
        DocumentCollaborator collaborator =
                collaboratorRepository
                        .findByDocumentIdAndUserId(
                                documentId,
                                userId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User is not a collaborator"));


        return collaborator.getPermission()
                == DocumentPermission.EDITOR;
    }


    // =========================================================
    // CHECK DOCUMENT ACCESS
    // =========================================================

    public boolean hasAccess(
            Long documentId,
            Long userId) {

        Document document =
                documentRepository.findById(documentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"));


        // OWNER
        if (document.getOwner().getId().equals(userId)) {
            return true;
        }


        // COLLABORATOR
        return collaboratorRepository
                .findByDocumentIdAndUserId(
                        documentId,
                        userId
                )
                .isPresent();
    }


    // =========================================================
    // OWNER CHECK
    // =========================================================

    private void checkOwner(
            Document document,
            Long currentUserId) {

        if (!document.getOwner()
                .getId()
                .equals(currentUserId)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the document owner can perform this action"
            );
        }
    }
}