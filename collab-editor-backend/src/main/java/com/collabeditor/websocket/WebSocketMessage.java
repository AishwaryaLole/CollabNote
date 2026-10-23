package com.collabeditor.websocket;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WebSocketMessage {
	
	private Long documentId;
	private Long userId;
	private String content;

}
