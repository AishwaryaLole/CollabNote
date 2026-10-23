package com.collabeditor.dto;

import com.collabeditor.entity.NotificationType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class NotificationRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    private Long documentId;

    @NotNull(message = "Notification type is required")
    private NotificationType type;

    @NotBlank(message = "Message is required")
    private String message;
}