package com.collabeditor.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor


@Entity
@Table(name = "users")
public class User {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@Column(nullable = false , length = 100)
	private String name;
	
    @Column(nullable = false, unique = true, length = 150)
	private String email;
	
    @Column(nullable = false, length = 255)
	private String password;
    
    @Column(name = "phone_number", length = 15)
    private String phoneNumber;
    
    @Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;
	
    @Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;
    
    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }
    
    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
   

}
