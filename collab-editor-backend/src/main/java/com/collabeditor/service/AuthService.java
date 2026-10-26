package com.collabeditor.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.collabeditor.dto.LoginRequest;
import com.collabeditor.dto.LoginResponse;
import com.collabeditor.dto.RegisterRequest;
import com.collabeditor.entity.User;
import com.collabeditor.repository.UserRepository;
import com.collabeditor.service.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
	
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	
	
	
	public User register(RegisterRequest request) {

	    if (userRepository.findByEmail(request.getEmail()).isPresent()) {
	        throw new RuntimeException("Email already registered");
	    }

	    User user = new User();

	    user.setName(request.getName());
	    user.setEmail(request.getEmail());
	    user.setPassword(passwordEncoder.encode(request.getPassword()));
	   
	    return userRepository.save(user);
	}
	
	
	
	public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new RuntimeException("Invalid email or password");
        }
        
        String token = jwtService.generateToken(user.getId(), user.getEmail());

        return new LoginResponse(
                token,
                "Login successful"
        );

    }
}
