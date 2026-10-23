package com.collabeditor.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DocumentUpdateMessage {
	
	private Long documentId;
	private Long userId;
	private String content;

}
