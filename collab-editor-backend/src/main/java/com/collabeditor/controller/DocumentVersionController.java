package com.collabeditor.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.collabeditor.entity.DocumentVersion;
import com.collabeditor.service.DocumentVersionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/documents/{documentId}/versions")
@RequiredArgsConstructor
public class DocumentVersionController {

    private final DocumentVersionService versionService;

    @PostMapping
    public ResponseEntity<DocumentVersion> createVersion(
            @PathVariable Long documentId,
            @RequestParam Long userId) {

        DocumentVersion version =
                versionService.createVersion(documentId, userId);

        return new ResponseEntity<>(version, HttpStatus.CREATED);
    }

    @GetMapping
    public List<DocumentVersion> getVersions(
            @PathVariable Long documentId) {

        return versionService.getVersions(documentId);
    }

    @GetMapping("/{versionId}")
    public DocumentVersion getVersion(
            @PathVariable Long documentId,
            @PathVariable Long versionId) {

        return versionService.getVersion(documentId, versionId);
    }

    @DeleteMapping("/{versionId}")
    public ResponseEntity<Void> deleteVersion(
            @PathVariable Long documentId,
            @PathVariable Long versionId) {

        versionService.deleteVersion(documentId, versionId);

        return ResponseEntity.noContent().build();
    }
}