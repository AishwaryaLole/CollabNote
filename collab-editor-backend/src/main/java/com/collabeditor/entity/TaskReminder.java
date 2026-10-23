package com.collabeditor.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_reminders")
@Getter
@Setter
@NoArgsConstructor
public class TaskReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "task_id", nullable = true)
    private Task task;

    @Column(nullable = false)
    private LocalDateTime reminderAt;

    // In-app notification tracking
    @Column(nullable = false)
    private boolean inAppSent = false;

    @Column(length = 20)
    private String inAppStatus = "PENDING";

    private LocalDateTime inAppSentAt;

    // Email tracking
    @Column(nullable = false)
    private boolean emailSent = false;

    @Column(length = 20)
    private String emailStatus = "PENDING";

    private LocalDateTime emailSentAt;

    @Column(nullable = false, length = 250)
    private String message;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}