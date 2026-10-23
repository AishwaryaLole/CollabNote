package com.collabeditor.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.*;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "document_collaborators")
public class DocumentCollaborator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DocumentPermission permission;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    public void onCreate() {
        joinedAt = LocalDateTime.now();
    }
}