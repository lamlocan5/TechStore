package com.example.identity_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "username", unique = true, columnDefinition = "VARCHAR(255) COLLATE utf8mb4_unicode_ci")
    String username;

    String password;
    String firstName;
    String lastName;

    @ManyToMany
    Set<Role> roles;

    @Builder.Default
    @Column(name = "total_spent", nullable = false)
    Long totalSpent = 0L;

    @Enumerated(EnumType.STRING)
    @Column(name = "`rank`", nullable = false, length = 20)
    @Builder.Default
    Rank rank = Rank.BRONZE;
}
