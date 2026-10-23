package com.collabeditor.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.collabeditor.dto.DocumentRequest;
import com.collabeditor.entity.Document;
import com.collabeditor.entity.User;
import com.collabeditor.repository.DocumentCollaboratorRepository;
import com.collabeditor.repository.DocumentRepository;
import com.collabeditor.repository.UserRepository;
import com.collabeditor.service.DocumentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentCollaboratorRepository collaboratorRepository;
    
    // =========================================================
    // CREATE
    // =========================================================

    @PostMapping
    public ResponseEntity<Document> createDocument(
            Authentication authentication,
            @Valid @RequestBody DocumentRequest request) {

        User user = getCurrentUser(authentication);

        Document document =
                documentService.createDocument(
                        user.getId(),
                        request
                );

        return new ResponseEntity<>(
                document,
                HttpStatus.CREATED
        );
    }


    // =========================================================
    // GET DOCUMENT
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocument(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        Document document =
                documentService.getDocument(
                        id,
                        user.getId()
                );

        return ResponseEntity.ok(document);
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @GetMapping
    public ResponseEntity<List<Document>> getAllDocuments() {

        List<Document> documents =
                documentService.getAllDocuments();

        return ResponseEntity.ok(documents);
    }


    // =========================================================
    // UPDATE DOCUMENT
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<Document> updateDocument(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody DocumentRequest request) {

        User user = getCurrentUser(authentication);

        Document document =
                documentService.updateDocument(
                        id,
                        user.getId(),
                        request
                );

        return ResponseEntity.ok(document);
    }


  
    
 // =========================================================
 // DELETE DOCUMENT
 // =========================================================

 @DeleteMapping("/{id}")
 public ResponseEntity<Void> deleteDocument(
         @PathVariable Long id,
         Authentication authentication) {

     User user = getCurrentUser(authentication);

     documentService.deleteDocument(
             id,
             user.getId()
     );

     return ResponseEntity.noContent().build();
 }


    // =========================================================
    // MY DOCUMENTS
    // =========================================================

    @GetMapping("/my")
    public ResponseEntity<List<Document>> getMyDocuments(
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        List<Document> documents =
                documentService.getMyDocuments(
                        user.getId()
                );

        return ResponseEntity.ok(documents);
    }


    // =========================================================
    // UPDATE CONTENT
    // =========================================================

    @PatchMapping("/{id}/content")
    public ResponseEntity<Document> updateContent(
            @PathVariable Long id,
            Authentication authentication,
            @RequestBody String content) {

        User user = getCurrentUser(authentication);

        Document document =
                documentService.updateContent(
                        id,
                        user.getId(),
                        content
                );

        return ResponseEntity.ok(document);
    }


    // =========================================================
    // CURRENT USER
    // =========================================================

    private User getCurrentUser(
            Authentication authentication) {

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        ));
    }
}