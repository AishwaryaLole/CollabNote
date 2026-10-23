package com.collabeditor.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.collabeditor.entity.Document;
import com.collabeditor.entity.DocumentVersion;
import com.collabeditor.entity.User;
import com.collabeditor.repository.DocumentRepository;
import com.collabeditor.repository.DocumentVersionRepository;
import com.collabeditor.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentVersionService {
	
	 private final DocumentVersionRepository versionRepository;
	 private final DocumentRepository documentRepository;
	 private final UserRepository userRepository;
	 
	 public DocumentVersion createVersion(Long documentId, Long userId) {

		    Document document = documentRepository.findById(documentId)
		            .orElseThrow(() -> new RuntimeException("Document not found"));

		    User user = userRepository.findById(userId)
		            .orElseThrow(() -> new RuntimeException("User not found"));

		    int nextVersion = versionRepository
		            .findTopByDocumentIdOrderByVersionNumberDesc(documentId)
		            .map(version -> version.getVersionNumber() + 1)
		            .orElse(1);

		    DocumentVersion version = new DocumentVersion();

		    version.setDocument(document);
		    version.setContent(document.getContent());
		    version.setCreatedBy(user);
		    version.setVersionNumber(nextVersion);

		    return versionRepository.save(version);
		}
	 
	 public List<DocumentVersion> getVersions(Long documentId) {

		    documentRepository.findById(documentId)
		            .orElseThrow(() -> new RuntimeException("Document not found"));

		    return versionRepository
		            .findByDocumentIdOrderByVersionNumberAsc(documentId);
		}
	 
	 public DocumentVersion getVersion(Long documentId, Long versionId) {

		    return versionRepository
		            .findByIdAndDocumentId(versionId, documentId)
		            .orElseThrow(() -> new RuntimeException("Version not found"));
		}
	 
	 public void deleteVersion(Long documentId, Long versionId) {

		    DocumentVersion version = versionRepository
		            .findByIdAndDocumentId(versionId, documentId)
		            .orElseThrow(() -> new RuntimeException("Version not found"));

		    versionRepository.delete(version);
		}
	 
}
