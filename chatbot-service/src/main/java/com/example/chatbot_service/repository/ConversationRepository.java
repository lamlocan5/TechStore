package com.example.chatbot_service.repository;

import com.example.chatbot_service.entity.ConversationEntity;
import com.example.chatbot_service.entity.ConversationEntity.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<ConversationEntity, Long> {

    Optional<ConversationEntity> findBySessionId(String sessionId);

    Page<ConversationEntity> findByUserIdAndStatus(String userId, ConversationStatus status, Pageable pageable);

    Page<ConversationEntity> findByUserId(String userId, Pageable pageable);

    boolean existsBySessionId(String sessionId);
}
