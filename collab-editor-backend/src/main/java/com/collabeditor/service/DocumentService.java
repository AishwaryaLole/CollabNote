package com.collabeditor.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.collabeditor.dto.DocumentRequest;
import com.collabeditor.dto.NotificationRequest;
import com.collabeditor.entity.Document;
import com.collabeditor.entity.DocumentCollaborator;
import com.collabeditor.entity.DocumentPermission;
import com.collabeditor.entity.NotificationType;
import com.collabeditor.entity.User;
import com.collabeditor.repository.DocumentCollaboratorRepository;
import com.collabeditor.repository.DocumentRepository;
import com.collabeditor.repository.DocumentVersionRepository;
import com.collabeditor.repository.NotificationRepository;
import com.collabeditor.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final DocumentCollaboratorRepository collaboratorRepository;
    private final DocumentVersionService documentVersionService;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final DocumentVersionRepository documentVersionRepository;

    // =========================================================
    // CREATE DOCUMENT
    // =========================================================

    public Document createDocument(
            Long userId,
            DocumentRequest request) {

        User owner = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("Owner not found"));

        Document document = new Document();

        document.setTitle(request.getTitle());
        document.setContent(request.getContent());
        document.setOwner(owner);

        return documentRepository.save(document);
    }


    // =========================================================
    // GET DOCUMENT
    // =========================================================

    public Document getDocument(
            Long id,
            Long currentUserId) {

        Document document = documentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Document not found"));


        // OWNER CAN ACCESS
        if (document.getOwner()
                .getId()
                .equals(currentUserId)) {

            return document;
        }


        // CHECK COLLABORATOR ACCESS
        boolean hasAccess =
                collaboratorRepository
                        .findByDocumentIdAndUserId(
                                id,
                                currentUserId)
                        .isPresent();


        if (!hasAccess) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You do not have access to this document"
            );
        }


        return document;
    }


    // =========================================================
    // GET ALL DOCUMENTS
    // =========================================================

    public List<Document> getAllDocuments() {

        return documentRepository.findAll();
    }


    // =========================================================
    // GET MY DOCUMENTS
    // =========================================================

    public List<Document> getMyDocuments(
            Long userId) {

        List<Document> ownedDocuments =
                documentRepository.findByOwnerId(userId);

        List<Document> sharedDocuments =
                collaboratorRepository
                        .findDocumentsByUserId(userId);

        ownedDocuments.addAll(sharedDocuments);

        return ownedDocuments;
    }


    // =========================================================
    // UPDATE DOCUMENT
    // =========================================================

    public Document updateDocument(
            Long id,
            Long userId,
            DocumentRequest request) {

        Document document =
                documentRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"));


        // =====================================================
        // OWNER
        // =====================================================

        if (document.getOwner()
                .getId()
                .equals(userId)) {

            documentVersionService.createVersion(
                    id,
                    userId
            );

            document.setTitle(
                    request.getTitle()
            );

            document.setContent(
                    request.getContent()
            );

            Document updatedDocument =
                    documentRepository.save(document);

            notificationService.notifyDocumentUpdated(
                    id,
                    userId
            );

            return updatedDocument;
        }


        // =====================================================
        // COLLABORATOR
        // =====================================================

        DocumentCollaborator collaborator =
                collaboratorRepository
                        .findByDocumentIdAndUserId(
                                id,
                                userId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "You do not have access to this document"
                                ));


        // VIEWER CANNOT EDIT
        if (collaborator.getPermission()
                != DocumentPermission.EDITOR) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You have view-only access to this document"
            );
        }


        documentVersionService.createVersion(
                id,
                userId
        );

        document.setTitle(
                request.getTitle()
        );

        document.setContent(
                request.getContent()
        );

        Document updatedDocument =
                documentRepository.save(document);

        notificationService.notifyDocumentUpdated(
                id,
                userId
        );

        return updatedDocument;
    }


    // =========================================================
    // DELETE DOCUMENT
    // =========================================================
    @Transactional
    public void deleteDocument(Long id, Long userId) {

        Document document =
                documentRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException("Document not found"));

        // ONLY OWNER CAN DELETE
        if (!document.getOwner()
                .getId()
                .equals(userId)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the document owner can delete this document"
            );
        }

        String title = document.getTitle();

        // ---------------------------------------------------------
        // 1. Get collaborators BEFORE deleting them
        // ---------------------------------------------------------

        List<DocumentCollaborator> collaborators =
                collaboratorRepository.findByDocumentId(id);

        // ---------------------------------------------------------
        // 2. Notify shared users
        // ---------------------------------------------------------

        for (DocumentCollaborator collaborator : collaborators) {

            NotificationRequest notification =
                    new NotificationRequest();

            notification.setUserId(
                    collaborator.getUser().getId()
            );

            notification.setDocumentId(null);

            notification.setType(
                    NotificationType.DOCUMENT_DELETED
            );

            notification.setMessage(
                    "Document \"" + title +
                    "\" has been deleted by the owner."
            );

            notificationService.createNotification(notification);
        }

        // ---------------------------------------------------------
        // 3. Delete collaborators explicitly
        // ---------------------------------------------------------

        collaboratorRepository.deleteAll(collaborators);

        // Force Hibernate to execute collaborator deletes now
        collaboratorRepository.flush();

        // ---------------------------------------------------------
        // 4. Remove document reference from old notifications
        // ---------------------------------------------------------

        notificationRepository.clearDocumentReference(id);

        notificationRepository.flush();

        // ---------------------------------------------------------
        // 5. Delete document versions
        // ---------------------------------------------------------

        documentVersionRepository.deleteByDocumentId(id);

        documentVersionRepository.flush();

        // ---------------------------------------------------------
        // 6. Finally delete the document
        // ---------------------------------------------------------

        documentRepository.delete(document);

        documentRepository.flush();
    }

    // =========================================================
    // UPDATE CONTENT
    // =========================================================

    public Document updateContent(Long documentId, Long userId, String content) {

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (document.getOwner().getId().equals(userId)) {

            documentVersionService.createVersion(documentId, userId);

            document.setContent(content);

            Document updatedDocument =
                    documentRepository.save(document);

            notificationService.notifyDocumentUpdated(
                    documentId,
                    userId
            );

            return updatedDocument;
        }

        DocumentCollaborator collaborator =
                collaboratorRepository
                        .findByDocumentIdAndUserId(documentId, userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User is not a collaborator"
                                ));

        if (collaborator.getPermission() != DocumentPermission.EDITOR) {
            throw new RuntimeException(
                    "User does not have edit permission"
            );
        }

        documentVersionService.createVersion(
                documentId,
                userId
        );

        document.setContent(content);

        Document updatedDocument =
                documentRepository.save(document);

        notificationService.notifyDocumentUpdated(
                documentId,
                userId
        );

        return updatedDocument;
    }
}