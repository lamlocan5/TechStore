package com.example.notification.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.notification.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByRecipient(String recipient);

    List<Notification> findByStatus(Notification.NotificationStatus status);

    List<Notification> findByChannel(String channel);
}
