package com.collabeditor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class CollabEditorBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(CollabEditorBackendApplication.class, args);
	}

}
