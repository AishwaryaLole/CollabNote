package com.collabeditor.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor

@Entity
@Table(name = "documents")

public class Document {
	
    @Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
    @Column(nullable = false, length = 200)
	private String title;
	
    @Lob
    @Column(columnDefinition = "LONGTEXT")
	private String content;
    
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
	private User owner;
	
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
	private DocumentStatus status = DocumentStatus.ACTIVE;
	
    
    @Column(nullable = false)
	 private Integer version = 1;
    
    
    @Column(name = "created_at", nullable = false, updatable = false)
	 private LocalDateTime createdAt;
    
	
     @Column(name = "updated_at", nullable = false)
	 private LocalDateTime updatedAt;

     @PrePersist
     public void onCreate() {
         LocalDateTime now = LocalDateTime.now();
         createdAt = now;
         updatedAt = now;

         if (status == null) {
             status = DocumentStatus.ACTIVE;
         }

         if (version == null) {
             version = 1;
         }
     }

     @PreUpdate
     public void onUpdate() {
         updatedAt = LocalDateTime.now();
     }
	 

}
