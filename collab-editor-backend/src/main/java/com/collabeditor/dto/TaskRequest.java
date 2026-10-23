
package com.collabeditor.dto;

import com.collabeditor.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TaskRequest {

    private Long documentId;

    private Long assignedToId;

    @NotBlank
    @Size(max = 200)
    private String title;

    private String description;

    private TaskPriority priority;

    private LocalDateTime dueDate;
}
