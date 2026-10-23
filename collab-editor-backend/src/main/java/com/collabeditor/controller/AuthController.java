package com.collabeditor.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.collabeditor.dto.LoginRequest;
import com.collabeditor.dto.LoginResponse;
import com.collabeditor.dto.RegisterRequest;
import com.collabeditor.entity.User;
import com.collabeditor.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;






@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
	
	private final AuthService authService;
	
	@PostMapping("/register")
	public ResponseEntity<User> register(@Valid @RequestBody RegisterRequest request){
		
		User user = authService.register(request);
		
		return new ResponseEntity<>(user, HttpStatus.CREATED);
	}
	
	@PostMapping("/login")
	public ResponseEntity<LoginResponse> login( @Valid @RequestBody LoginRequest request){
		
		LoginResponse response = authService.login(request);
		
		return ResponseEntity.ok(response);
	}

}
