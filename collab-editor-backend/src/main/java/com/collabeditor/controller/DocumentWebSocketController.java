package com.collabeditor.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import com.collabeditor.dto.DocumentUpdateMessage;
import com.collabeditor.service.DocumentService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class DocumentWebSocketController {

    private final DocumentService documentService;

    @MessageMapping("/document/{documentId}")
    @SendTo("/topic/document/{documentId}")
    public DocumentUpdateMessage updateDocument(
            DocumentUpdateMessage message) {

        documentService.updateContent(
                message.getDocumentId(),
                message.getUserId(),
                message.getContent()
        );

        return message;
    }
}