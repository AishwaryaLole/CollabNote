package com.collabeditor.websocket;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.collabeditor.repository.UserRepository;
import com.collabeditor.service.DocumentCollaboratorService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class CollaborationController {

    private final DocumentCollaboratorService collaboratorService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/document")
    public void editDocument(
            WebSocketMessage message,
            SimpMessageHeaderAccessor headerAccessor) {

        String email = headerAccessor.getUser().getName();

        Long userId = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"))
                .getId();

        Long documentId = message.getDocumentId();

        // Check EDITOR permission
        if (!collaboratorService.hasEditPermission(
                documentId,
                userId)) {

            throw new RuntimeException(
                    "User does not have edit permission");
        }

        // Set actual logged-in user
        message.setUserId(userId);

        // Send only to this document's room
        messagingTemplate.convertAndSend(
                "/topic/document/" + documentId,
                message
        );
    }
}