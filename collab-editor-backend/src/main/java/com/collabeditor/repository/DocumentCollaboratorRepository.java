package com.collabeditor.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaRepository;

import com.collabeditor.entity.Document;
import com.collabeditor.entity.DocumentCollaborator;

public interface DocumentCollaboratorRepository
        extends JpaRepository<DocumentCollaborator, Long> {

	List<DocumentCollaborator> findByUserId(Long userId);
	
    List<DocumentCollaborator> findByDocumentId(Long documentId);

    Optional<DocumentCollaborator> findByDocumentIdAndUserId(
            Long documentId,
            Long userId);
    
    @Query("""
    	       SELECT dc.document
    	       FROM DocumentCollaborator dc
    	       WHERE dc.user.id = :userId
    	       """)
    	List<Document> findDocumentsByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM DocumentCollaborator dc WHERE dc.document.id = :documentId")
    void deleteByDocumentId(@Param("documentId") Long documentId);
}