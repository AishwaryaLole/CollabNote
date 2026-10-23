package com.collabeditor.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.collabeditor.entity.Document;
import com.collabeditor.entity.DocumentVersion;

public interface DocumentVersionRepository
        extends JpaRepository<DocumentVersion, Long> {
	
	Optional<DocumentVersion> findTopByDocumentIdOrderByVersionNumberDesc(Long documentId);

	List<DocumentVersion> findByDocumentIdOrderByVersionNumberAsc(Long documentId);
	
	Optional<DocumentVersion> findByIdAndDocumentId(
	        Long versionId, Long documentId);
	
	
	@Modifying
	@Query("""
	    DELETE FROM DocumentVersion v
	    WHERE v.document.id = :documentId
	""")
	void deleteByDocumentId(@Param("documentId") Long documentId);
	
	
	
	
}