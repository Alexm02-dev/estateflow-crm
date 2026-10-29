package com.estatecrm.service;

import com.estatecrm.dto.request.BulkEmployeeStatusRequest;
import com.estatecrm.dto.request.EmployeeCreateRequest;
import com.estatecrm.dto.request.EmployeeUpdateRequest;
import com.estatecrm.dto.response.UserDto;
import com.estatecrm.entity.Role;
import com.estatecrm.entity.User;
import com.estatecrm.exception.BadRequestException;
import com.estatecrm.exception.ConflictException;
import com.estatecrm.exception.ResourceNotFoundException;
import com.estatecrm.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllEmployees() {
        return userRepository.findAll().stream()
                .map(UserDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getActiveSalesEmployees() {
        return userRepository.findByRole(Role.SALES_EMPLOYEE).stream()
                .filter(User::isActive)
                .map(UserDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getEmployeeById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + id));
        return new UserDto(user);
    }

    @Transactional
    public UserDto createEmployee(EmployeeCreateRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email '" + email + "' is already registered");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setRole(request.getRole() != null ? request.getRole() : Role.SALES_EMPLOYEE);
        user.setActive(true);

        User saved = userRepository.save(user);
        return new UserDto(saved);
    }

    @Transactional
    public UserDto updateEmployee(Long id, EmployeeUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + id));

        String email = request.getEmail().trim().toLowerCase();
        if (!user.getEmail().equalsIgnoreCase(email) && userRepository.existsByEmail(email)) {
            throw new ConflictException("Email '" + email + "' is already registered to another user");
        }

        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setRole(request.getRole());

        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        if (StringUtils.hasText(request.getPassword())) {
            if (request.getPassword().length() < 6) {
                throw new BadRequestException("Password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User saved = userRepository.save(user);
        return new UserDto(saved);
    }

    @Transactional
    public int bulkUpdateStatus(BulkEmployeeStatusRequest request) {
        List<User> users = userRepository.findAllById(request.getEmployeeIds());
        int updatedCount = 0;
        for (User user : users) {
            if (!request.getActive() && "admin@estatecrm.com".equalsIgnoreCase(user.getEmail())) {
                continue;
            }
            user.setActive(request.getActive());
            updatedCount++;
        }
        userRepository.saveAll(users);
        return updatedCount;
    }
}
