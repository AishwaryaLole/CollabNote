package com.collabeditor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DocumentRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String content;
}