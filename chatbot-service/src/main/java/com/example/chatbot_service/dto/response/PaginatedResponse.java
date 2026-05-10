package com.example.chatbot_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaginatedResponse<T> {

    private List<T> data;
    private int page;
    private int limit;
    private long totalElements;
    private int totalPages;

    public static <T> PaginatedResponse<T> of(
        List<T> data,
        int page,
        int limit,
        long totalElements
    ) {
        return PaginatedResponse.<T>builder()
            .data(data)
            .page(page)
            .limit(limit)
            .totalElements(totalElements)
            .totalPages((int) Math.ceil((double) totalElements / limit))
            .build();
    }
}
