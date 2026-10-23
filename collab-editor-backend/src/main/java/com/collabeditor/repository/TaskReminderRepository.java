package com.collabeditor.repository;

import com.collabeditor.entity.TaskReminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskReminderRepository
        extends JpaRepository<TaskReminder, Long> {

    List<TaskReminder>
    findByReminderAtLessThanEqualAndInAppSentFalse(
            LocalDateTime reminderAt);

    List<TaskReminder>
    findByReminderAtLessThanEqualAndEmailSentFalse(
            LocalDateTime reminderAt);
}