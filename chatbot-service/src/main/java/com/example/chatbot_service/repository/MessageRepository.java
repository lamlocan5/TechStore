package com.example.chatbot_service.repository;

import com.example.chatbot_service.entity.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    List<MessageEntity> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    @Query("SELECT m FROM MessageEntity m WHERE m.conversation.id = :conversationId " +
           "ORDER BY m.createdAt DESC")
    List<MessageEntity> findLatestMessagesByConversationId(
        @Param("conversationId") Long conversationId,
        org.springframework.data.domain.Pageable pageable
    );

    long countByConversationId(Long conversationId);
}
