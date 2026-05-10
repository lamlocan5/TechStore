package com.example.notification.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.event.dto.NotificationEvent;
import com.example.notification.dto.request.EmailRequest;
import com.example.notification.dto.request.Recipient;
import com.example.notification.dto.request.SendEmailRequest;
import com.example.notification.dto.request.Sender;
import com.example.notification.dto.response.EmailResponse;
import com.example.notification.entity.Notification;
import com.example.notification.exception.AppException;
import com.example.notification.exception.ErrorCode;
import com.example.notification.repository.NotificationRepository;
import com.example.notification.repository.httpclient.EmailClient;

import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmailService {
    EmailClient emailClient;
    NotificationRepository notificationRepository;

    @NonFinal
    @Value("${app.key}")
    String apiKey;

    @NonFinal
    @Value("${app.name}")
    String name;

    @NonFinal
    @Value("${app.email}")
    String email;

    public EmailResponse sendEmail(SendEmailRequest request) {
        return sendEmail(request, "EMAIL", null);
    }

    public EmailResponse sendEmail(SendEmailRequest request, String channel, String templateCode) {
        // Tạo bản ghi thông báo với trạng thái PENDING
        Notification notification = Notification.builder()
                .channel(channel != null ? channel : "EMAIL")
                .recipient(request.getTo().getEmail())
                .subject(request.getSubject())
                .htmlContent(request.getHtmlContent())
                .body(request.getHtmlContent())
                .templateCode(templateCode)
                .status(Notification.NotificationStatus.PENDING)
                .build();

        notification = notificationRepository.save(notification);

        EmailRequest emailRequest = EmailRequest.builder()
                .sender(Sender.builder().name(name).email(email).build())
                .to(List.of(request.getTo()))
                .subject(request.getSubject())
                .htmlContent(request.getHtmlContent())
                .build();

        try {
            EmailResponse response = emailClient.sendEmail(apiKey, emailRequest);

            // Cập nhật thông báo sang trạng thái SENT
            notification.setStatus(Notification.NotificationStatus.SENT);
            notification.setMessageId(response.getMessageId());
            notificationRepository.save(notification);

            return response;
        } catch (FeignException e) {
            // Cập nhật thông báo sang trạng thái FAILED
            notification.setStatus(Notification.NotificationStatus.FAILED);
            notification.setErrorMessage(e.getMessage());
            notificationRepository.save(notification);

            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }
    }

    public EmailResponse sendEmailFromEvent(NotificationEvent event) {
        SendEmailRequest request = SendEmailRequest.builder()
                .to(Recipient.builder().email(event.getRecipient()).build())
                .subject(event.getSubject())
                .htmlContent(event.getBody())
                .build();

        return sendEmail(request, event.getChanel(), event.getTemplateCode());
    }
}
