package com.collabeditor.websocket;

import java.util.Collections;
import java.util.Map;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import com.collabeditor.repository.UserRepository;
import com.collabeditor.service.DocumentCollaboratorService;
import com.collabeditor.service.JwtService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final DocumentCollaboratorService collaboratorService;

    @Override
    public Message<?> preSend(
            Message<?> message,
            MessageChannel channel) {

        StompHeaderAccessor accessor =
                StompHeaderAccessor.wrap(message);

        // =====================================================
        // CONNECT
        // =====================================================

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            System.out.println("===== WEBSOCKET CONNECT =====");

            String authorization =
                    accessor.getFirstNativeHeader("Authorization");

            System.out.println(
                    "Authorization header present: "
                            + (authorization != null)
            );

            if (authorization == null ||
                    !authorization.startsWith("Bearer ")) {

                throw new IllegalArgumentException(
                        "Missing JWT token"
                );
            }

            String token =
                    authorization.substring(7);

            String email =
                    jwtService.extractEmail(token);

            System.out.println(
                    "WebSocket user email: " + email
            );

            if (email == null) {

                throw new IllegalArgumentException(
                        "Invalid JWT token"
                );
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            Collections.emptyList()
                    );

            // Set user for CONNECT
            accessor.setUser(authentication);

            // Store email in STOMP session
            Map<String, Object> sessionAttributes =
                    accessor.getSessionAttributes();

            if (sessionAttributes != null) {
                sessionAttributes.put(
                        "wsUserEmail",
                        email
                );
            }

            System.out.println(
                    "WebSocket authentication successful"
            );

            return MessageBuilder.createMessage(
                    message.getPayload(),
                    accessor.getMessageHeaders()
            );
        }

        // =====================================================
        // SUBSCRIBE / SEND
        // =====================================================

        Map<String, Object> sessionAttributes =
                accessor.getSessionAttributes();

        if (sessionAttributes != null) {

            String email =
                    (String) sessionAttributes.get(
                            "wsUserEmail"
                    );

            if (email != null) {

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                Collections.emptyList()
                        );

                accessor.setUser(authentication);

                System.out.println(
                        "Restored WebSocket user: "
                                + email
                );
            }
        }

        // =====================================================
        // SUBSCRIBE
        // =====================================================

        if (StompCommand.SUBSCRIBE.equals(
                accessor.getCommand())) {

            System.out.println(
                    "===== WEBSOCKET SUBSCRIBE ====="
            );

            String destination =
                    accessor.getDestination();

            System.out.println(
                    "SUBSCRIBE destination: "
                            + destination
            );

            if (destination != null &&
                    destination.startsWith(
                            "/topic/document/")) {

                String documentIdText =
                        destination.substring(
                                "/topic/document/".length()
                        );

                Long documentId;

                try {

                    documentId =
                            Long.parseLong(
                                    documentIdText
                            );

                } catch (NumberFormatException e) {

                    throw new IllegalArgumentException(
                            "Invalid document ID"
                    );
                }

                System.out.println(
                        "Document ID: "
                                + documentId
                );

                System.out.println(
                        "WebSocket user: "
                                + accessor.getUser()
                );

                if (accessor.getUser() == null) {

                    throw new IllegalArgumentException(
                            "User is not authenticated"
                    );
                }

                String email =
                        accessor.getUser().getName();

                System.out.println(
                        "Authenticated email: "
                                + email
                );

                Long userId =
                        userRepository.findByEmail(email)
                                .orElseThrow(() ->
                                        new RuntimeException(
                                                "User not found"
                                        ))
                                .getId();

                System.out.println(
                        "Authenticated user ID: "
                                + userId
                );

                boolean hasAccess =
                        collaboratorService.hasAccess(
                                documentId,
                                userId
                        );

                System.out.println(
                        "HAS ACCESS = "
                                + hasAccess
                );

                if (!hasAccess) {

                    throw new IllegalArgumentException(
                            "User does not have access "
                                    + "to this document"
                    );
                }

                System.out.println(
                        "SUBSCRIBE ACCESS GRANTED"
                );
            }
        }

        // Return message with restored user
        return MessageBuilder.createMessage(
                message.getPayload(),
                accessor.getMessageHeaders()
        );
    }
}