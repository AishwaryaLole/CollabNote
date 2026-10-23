package com.collabeditor.dto;

import com.collabeditor.entity.DocumentPermission;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PermissionUpdateRequest {

    @NotNull(message = "Permission is required")
    private DocumentPermission permission;
}