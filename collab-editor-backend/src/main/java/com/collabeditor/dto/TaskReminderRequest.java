package com.collabeditor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TaskReminderRequest {

    private Long taskId; // Null for personal reminders

    @NotNull
    private Long recipientUserId;

    @NotNull
    private LocalDateTime reminderAt;

    @NotBlank
    @Size(max = 250)
    private String message;
}