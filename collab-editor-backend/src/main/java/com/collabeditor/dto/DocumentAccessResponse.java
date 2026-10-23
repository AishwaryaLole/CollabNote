package com.collabeditor.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DocumentAccessResponse {

    private Long id;

    private String title;

    private String content;

    private String permission;

    private Long ownerId;

    private String ownerName;
}