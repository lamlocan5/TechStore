package com.example.gateway.configuration;

import com.example.gateway.repository.IdentityClient;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.support.WebClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfiguration {

    @Value("${services.identity.url:http://localhost:8080}")
    private String identityServiceUrl;

    @Value("${services.ai-image-search.url:http://localhost:8087}")
    private String aiImageSearchUrl;

    @Value("${services.product.url:http://localhost:8083}")
    private String productServiceUrl;

    @Value("${services.ai-image-search.timeout:30}")
    private int aiServiceTimeout;

    @Value("${services.product.timeout:10}")
    private int productServiceTimeout;

    @Bean
    WebClient webClient() {
        return WebClient.builder()
                .baseUrl(identityServiceUrl + "/identity/")
                .build();
    }

    @Bean(name = "aiImageSearchWebClient")
    WebClient aiImageSearchWebClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, aiServiceTimeout * 1000)
                .responseTimeout(Duration.ofSeconds(aiServiceTimeout))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(aiServiceTimeout, TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(aiServiceTimeout, TimeUnit.SECONDS)));

        return WebClient.builder()
                .baseUrl(aiImageSearchUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB
                .build();
    }

    @Bean(name = "productServiceWebClient")
    WebClient productServiceWebClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, productServiceTimeout * 1000)
                .responseTimeout(Duration.ofSeconds(productServiceTimeout))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(productServiceTimeout, TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(productServiceTimeout, TimeUnit.SECONDS)));

        return WebClient.builder()
                .baseUrl(productServiceUrl + "/product")
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

    @Bean
    CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowedOrigins(List.of("*"));
        corsConfiguration.setAllowedHeaders(List.of("*"));
        corsConfiguration.setAllowedMethods(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);

        return new CorsWebFilter(source);
    }

    @Bean
    IdentityClient identityClient(WebClient webClient) {
        HttpServiceProxyFactory httpServiceProxyFactory = HttpServiceProxyFactory
                .builderFor(WebClientAdapter.create(webClient)).build();
        return httpServiceProxyFactory.createClient(IdentityClient.class);
    }
}
