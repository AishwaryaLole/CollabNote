package com.collabeditor.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.collabeditor.entity.Document;

public interface DocumentRepository extends JpaRepository<Document, Long> {

	  List<Document> findByOwnerId(Long ownerId);

	  


}