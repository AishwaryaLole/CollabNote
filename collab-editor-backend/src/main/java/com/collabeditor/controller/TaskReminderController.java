
package com.collabeditor.controller;

import com.collabeditor.dto.TaskReminderRequest;
import com.collabeditor.entity.TaskReminder;
import com.collabeditor.entity.User;
import com.collabeditor.repository.UserRepository;
import com.collabeditor.service.TaskReminderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/task-reminders")
@RequiredArgsConstructor
public class TaskReminderController {

    private final TaskReminderService reminderService;
    private final UserRepository userRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskReminder scheduleReminder(
            @Valid @RequestBody TaskReminderRequest request,
            Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required");
        }

        User currentUser = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"));

        // The service must verify that this user can access the task.
        return reminderService.scheduleReminder(
                request.getTaskId(),
                currentUser.getId(),
                request.getRecipientUserId(),
                request.getReminderAt(),
                request.getMessage()
        );
    }
}
