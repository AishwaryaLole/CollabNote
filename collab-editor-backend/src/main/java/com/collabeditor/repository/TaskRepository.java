
package com.collabeditor.repository;

import com.collabeditor.entity.Task;
import com.collabeditor.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByDocumentId(Long documentId);

    List<Task> findByAssignedToId(Long userId);

    List<Task> findByDocumentIdAndStatus(
            Long documentId,
            TaskStatus status
    );

    List<Task> findByAssignedToIdAndStatus(
            Long userId,
            TaskStatus status
    );
}
