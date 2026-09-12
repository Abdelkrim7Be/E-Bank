package com.bellagnech.gateway.filter;

import com.bellagnech.gateway.events.AuditEvent;
import com.bellagnech.gateway.messaging.AuditEventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLoggingFilter implements GlobalFilter, Ordered {

    private final AuditEventProducer auditEventProducer;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        ServerHttpRequest request = exchange.getRequest();

        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            try {
                ServerHttpResponse response = exchange.getResponse();
                long duration = System.currentTimeMillis() - startTime;

                AuditEvent event = AuditEvent.builder()
                        .eventId(UUID.randomUUID().toString())
                        .eventType("API_ACCESS")
                        .timestamp(Instant.now())
                        .method(request.getMethod() != null ? request.getMethod().name() : "UNKNOWN")
                        .path(request.getURI().getPath())
                        .statusCode(response.getStatusCode() != null ? response.getStatusCode().value() : 0)
                        .durationMs(duration)
                        .clientIp(request.getRemoteAddress() != null ? request.getRemoteAddress().getAddress().getHostAddress() : "unknown")
                        .userAgent(request.getHeaders().getFirst("User-Agent"))
                        .build();

                auditEventProducer.publishAuditEvent(event);
            } catch (Exception e) {
                log.debug("Failed to publish audit event: {}", e.getMessage());
            }
        }));
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
