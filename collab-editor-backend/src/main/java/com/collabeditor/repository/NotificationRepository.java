package com.collabeditor.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.collabeditor.entity.Notification;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Modifying
    @Query("""
        UPDATE Notification n
        SET n.document = NULL
        WHERE n.document.id = :documentId
    """)
    void clearDocumentReference(
            @Param("documentId") Long documentId);
    
    
    
    
    
    
    
}