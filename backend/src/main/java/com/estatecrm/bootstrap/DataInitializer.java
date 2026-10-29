package com.estatecrm.bootstrap;

import com.estatecrm.entity.Role;
import com.estatecrm.entity.User;
import com.estatecrm.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        logger.info("Verifying seed user credentials with BCrypt encoder...");

        seedOrUpdateUser("admin@estatecrm.com", "Alex Morgan (Admin)", "admin123", "+1 555-0100", Role.ADMIN);
        seedOrUpdateUser("john.sales@estatecrm.com", "John Miller", "sales123", "+1 555-0101", Role.SALES_EMPLOYEE);
        seedOrUpdateUser("sarah.sales@estatecrm.com", "Sarah Connor", "sales123", "+1 555-0102", Role.SALES_EMPLOYEE);

        logger.info("Demo user credentials successfully verified.");
    }

    private void seedOrUpdateUser(String email, String name, String rawPassword, String phone, Role role) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User user = existing.get();
            // Re-encode password with the current runtime passwordEncoder to guarantee exact hash match
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setActive(true);
            userRepository.save(user);
        } else {
            User user = new User(name, email, passwordEncoder.encode(rawPassword), phone, role);
            userRepository.save(user);
        }
    }
}
