package com.collabeditor.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.collabeditor.dto.DocumentCollaboratorRequest;
import com.collabeditor.dto.PermissionUpdateRequest;
import com.collabeditor.entity.DocumentCollaborator;
import com.collabeditor.entity.User;
import com.collabeditor.repository.UserRepository;
import com.collabeditor.service.DocumentCollaboratorService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/documents/{documentId}/collaborators")
@RequiredArgsConstructor
public class DocumentCollaboratorController {

    private final DocumentCollaboratorService collaboratorService;
    private final UserRepository userRepository;


    // ADD COLLABORATOR
    @PostMapping
    public ResponseEntity<DocumentCollaborator> addCollaborator(
            @PathVariable Long documentId,
            Authentication authentication,
            @Valid @RequestBody DocumentCollaboratorRequest request) {

        User currentUser = getCurrentUser(authentication);

        DocumentCollaborator collaborator =
                collaboratorService.addCollaborator(
                        documentId,
                        currentUser.getId(),
                        request
                );

        return new ResponseEntity<>(
                collaborator,
                HttpStatus.CREATED
        );
    }


    // GET COLLABORATORS
    @GetMapping
    public ResponseEntity<List<DocumentCollaborator>> getCollaborators(
            @PathVariable Long documentId,
            Authentication authentication) {

        User currentUser = getCurrentUser(authentication);

        List<DocumentCollaborator> collaborators =
                collaboratorService.getCollaborators(
                        documentId,
                        currentUser.getId()
                );

        return ResponseEntity.ok(collaborators);
    }


    // UPDATE PERMISSION
    @PutMapping("/{userId}")
    public ResponseEntity<DocumentCollaborator> updatePermission(
            @PathVariable Long documentId,
            @PathVariable Long userId,
            Authentication authentication,
            @Valid @RequestBody PermissionUpdateRequest request) {

        User currentUser = getCurrentUser(authentication);

        DocumentCollaborator collaborator =
                collaboratorService.updatePermission(
                        documentId,
                        currentUser.getId(),
                        userId,
                        request
                );

        return ResponseEntity.ok(collaborator);
    }


    // REMOVE COLLABORATOR
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteCollaborator(
            @PathVariable Long documentId,
            @PathVariable Long userId,
            Authentication authentication) {

        User currentUser = getCurrentUser(authentication);

        collaboratorService.deleteCollaborator(
                documentId,
                currentUser.getId(),
                userId
        );

        return ResponseEntity.noContent().build();
    }


    // GET LOGGED-IN USER
    private User getCurrentUser(Authentication authentication) {

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }
}