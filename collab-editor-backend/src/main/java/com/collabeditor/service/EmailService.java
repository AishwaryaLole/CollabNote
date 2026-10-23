package com.collabeditor.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private final String apiKey;
    private final String fromEmail;
    private final RestTemplate restTemplate;

    public EmailService(
            @Value("${brevo.api-key}") String apiKey,
            @Value("${brevo.from-email}") String fromEmail) {

        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.restTemplate = new RestTemplate();
    }

    // =========================================================
    // REMINDER EMAIL
    // =========================================================

    public void sendReminderEmail(
            String email,
            String recipientName,
            String message,
            boolean taskReminder) {

        String subject = taskReminder
                ? "CollabNote - Task Reminder"
                : "CollabNote - Personal Reminder";

        String greeting =
                recipientName != null && !recipientName.isBlank()
                        ? "Hello " + recipientName + ","
                        : "Hello,";

        String body =
                greeting + "\n\n" +
                "You have a reminder from CollabNote.\n\n" +
                "Reminder:\n" +
                message + "\n\n" +
                "Please check your CollabNote application for more details.\n\n" +
                "Regards,\n" +
                "CollabNote";

        sendEmail(email, recipientName, subject, body);
    }

    // =========================================================
    // TASK ASSIGNED EMAIL
    // =========================================================

    public void sendTaskAssignedEmail(
            String email,
            String recipientName,
            String taskTitle,
            String assignedByName) {

        String subject = "CollabNote - New Task Assigned";

        String greeting =
                recipientName != null && !recipientName.isBlank()
                        ? "Hello " + recipientName + ","
                        : "Hello,";

        String body =
                greeting + "\n\n" +
                "A new task has been assigned to you in CollabNote.\n\n" +
                "Task: " + taskTitle + "\n" +
                "Assigned by: " + assignedByName + "\n\n" +
                "Please check your CollabNote application for more details.\n\n" +
                "Regards,\n" +
                "CollabNote";

        sendEmail(email, recipientName, subject, body);
    }

    // =========================================================
    // TASK COMPLETED EMAIL
    // =========================================================

    public void sendTaskCompletedEmail(
            String email,
            String recipientName,
            String taskTitle,
            String completedByName) {

        String subject = "CollabNote - Task Completed";

        String greeting =
                recipientName != null && !recipientName.isBlank()
                        ? "Hello " + recipientName + ","
                        : "Hello,";

        String body =
                greeting + "\n\n" +
                "A task assigned by you has been completed in CollabNote.\n\n" +
                "Task: " + taskTitle + "\n" +
                "Completed by: " + completedByName + "\n\n" +
                "Please check your CollabNote application for more details.\n\n" +
                "Regards,\n" +
                "CollabNote";

        sendEmail(email, recipientName, subject, body);
    }

    // =========================================================
    // COMMON EMAIL METHOD
    // =========================================================

    private void sendEmail(
            String toEmail,
            String recipientName,
            String subject,
            String body) {

        try {

            String url = "https://api.brevo.com/v3/smtp/email";

            // Headers
            HttpHeaders headers = new HttpHeaders();

            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            // Sender
            Map<String, String> sender = new HashMap<>();
            sender.put("email", fromEmail);
            sender.put("name", "CollabNote");

            // Recipient
            Map<String, String> recipient = new HashMap<>();
            recipient.put("email", toEmail);

            if (recipientName != null &&
                    !recipientName.isBlank()) {

                recipient.put("name", recipientName);
            }

            // Email body
            Map<String, Object> requestBody = new HashMap<>();

            requestBody.put("sender", sender);
            requestBody.put("to", List.of(recipient));
            requestBody.put("subject", subject);
            requestBody.put("textContent", body);

            // HTTP request
            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(requestBody, headers);

            restTemplate.postForEntity(
                    url,
                    request,
                    String.class
            );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to send email to " + toEmail,
                    e
            );
        }
    }
}