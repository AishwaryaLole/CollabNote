package com.collabeditor.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document document;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(nullable = false, length = 255)
    private String message;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();

        if (isRead == null) {
            isRead = false;
        }
    }
}