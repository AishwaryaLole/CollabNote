
package com.collabeditor.controller;

import com.collabeditor.dto.TaskRequest;
import com.collabeditor.entity.Task;
import com.collabeditor.entity.TaskStatus;
import com.collabeditor.entity.User;
import com.collabeditor.repository.UserRepository;
import com.collabeditor.service.TaskService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null ||
                !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found"
                ));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Task createTask(
            @Valid @RequestBody TaskRequest request,
            Authentication authentication) {

        User creator = getAuthenticatedUser(authentication);

        return taskService.createTask(
                request.getDocumentId(),
                creator.getId(),
                request.getAssignedToId(),
                request.getTitle(),
                request.getDescription(),
                request.getPriority(),
                request.getDueDate()
        );
    }

    @GetMapping("/document/{documentId}")
    public List<Task> getTasksByDocument(
            @PathVariable Long documentId,
            Authentication authentication) {

        getAuthenticatedUser(authentication);
        return taskService.getTasksByDocument(documentId);
    }
    
    @GetMapping
    public List<Task> getMyTasks(Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        return taskService.getTasksAssignedToUser(currentUser.getId());
    }

    @GetMapping("/assigned/{userId}")
    public List<Task> getTasksAssignedToUser(
            @PathVariable Long userId,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);

        if (!currentUser.getId().equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only view your assigned tasks"
            );
        }

        return taskService.getTasksAssignedToUser(userId);
    }

    @PatchMapping("/{taskId}/status")
    public Task updateTaskStatus(
            @PathVariable Long taskId,
            @RequestParam TaskStatus status,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);

        return taskService.updateTaskStatus(
                taskId,
                status,
                currentUser.getId()
        );
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(
            @PathVariable Long taskId,
            Authentication authentication) {

        getAuthenticatedUser(authentication);
        taskService.deleteTask(taskId);
    }
}
