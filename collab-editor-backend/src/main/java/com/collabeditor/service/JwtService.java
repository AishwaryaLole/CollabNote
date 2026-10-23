package com.collabeditor.service;

import java.util.Date;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Service
public class JwtService {
	
	private final String secretKey = "mySimpleSecretKeyForCollaborativeEditorProject123456";

	public String generateToken(Long userId, String email) {

	    return Jwts.builder()
	            .setSubject(email)
	            .claim("userId", userId)
	            .setIssuedAt(new Date())
	            .setExpiration(new Date(System.currentTimeMillis() + 86400000))
	            .signWith(SignatureAlgorithm.HS256, secretKey)
	            .compact();
	}

	public String extractEmail(String token) {
		
		return Jwts.parser()
                .setSigningKey(secretKey)
                .parseClaimsJws(token)
                .getBody()
                .getSubject(); 
	}
	
	public Long extractUserId(String token) {

	    return Jwts.parser()
	            .setSigningKey(secretKey)
	            .parseClaimsJws(token)
	            .getBody()
	            .get("userId", Long.class);
	}
}
