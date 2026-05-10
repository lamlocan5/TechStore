package com.example.gateway.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AISearchResponse {
    @JsonProperty("query_processed")
    Boolean queryProcessed;

    @JsonProperty("total_results")
    Integer totalResults;

    List<ImageSearchResult> results;
}
