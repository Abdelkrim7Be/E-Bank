package com.bellagnech.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Slf4j
public class RateLimitingFilter extends AbstractGatewayFilterFactory<RateLimitingFilter.Config> {

    private static final int DEFAULT_RATE_LIMIT = 500; // requests per minute (increased for admin list + detail flows)
    private final Map<String, RateLimitInfo> rateLimitMap = new ConcurrentHashMap<>();

    public RateLimitingFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String clientId = getClientId(exchange);
            int rateLimit = config.getRateLimit() > 0 ? config.getRateLimit() : DEFAULT_RATE_LIMIT;

            RateLimitInfo rateLimitInfo = rateLimitMap.computeIfAbsent(
                clientId, 
                k -> new RateLimitInfo(rateLimit)
            );

            if (rateLimitInfo.isAllowed()) {
                log.debug("Rate limit check passed for client: {}", clientId);
                return chain.filter(exchange);
            } else {
                log.warn("Rate limit exceeded for client: {}", clientId);
                return onError(exchange, "Rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
            }
        };
    }

    private String getClientId(ServerWebExchange exchange) {
        String clientIp = exchange.getRequest().getRemoteAddress() != null 
            ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
            : "unknown";
        
        String username = exchange.getRequest().getHeaders().getFirst("X-User-Name");
        return username != null ? username : clientIp;
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");
        DataBuffer buffer = response.bufferFactory().wrap(
            String.format("{\"error\":\"%s\"}", message).getBytes()
        );
        return response.writeWith(Mono.just(buffer));
    }

    private static class RateLimitInfo {
        private final AtomicInteger requestCount = new AtomicInteger(0);
        private final int limit;
        private long windowStart;

        RateLimitInfo(int limit) {
            this.limit = limit;
            this.windowStart = System.currentTimeMillis();
        }

        boolean isAllowed() {
            long now = System.currentTimeMillis();
            if (now - windowStart > 60000) {
                requestCount.set(0);
                windowStart = now;
            }
            return requestCount.incrementAndGet() <= limit;
        }
    }

    public static class Config {
        private int rateLimit = DEFAULT_RATE_LIMIT;

        public int getRateLimit() {
            return rateLimit;
        }

        public void setRateLimit(int rateLimit) {
            this.rateLimit = rateLimit;
        }
    }
}

