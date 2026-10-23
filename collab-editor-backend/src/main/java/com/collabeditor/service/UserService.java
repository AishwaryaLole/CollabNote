package com.collabeditor.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.collabeditor.entity.User;
import com.collabeditor.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll() ;
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    
    public User updatePhoneNumber(Long id, String phoneNumber) {
        User user = getUser(id);
        user.setPhoneNumber(phoneNumber);
        return userRepository.save(user);
    }
}