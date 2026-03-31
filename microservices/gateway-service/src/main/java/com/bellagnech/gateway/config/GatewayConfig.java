package com.bellagnech.gateway.config;

import com.bellagnech.gateway.filter.JwtAuthenticationFilter;
import com.bellagnech.gateway.filter.RateLimitingFilter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Gateway route and rate-limit config. */
@Configuration
public class GatewayConfig {

    /** Higher rate limit for admin list+detail flows. */
    private static RateLimitingFilter.Config adminHighLimitConfig() {
        RateLimitingFilter.Config c = new RateLimitingFilter.Config();
        c.setRateLimit(500);
        return c;
    }

    @Bean
    public RouteLocator customRouteLocator(
            RouteLocatorBuilder builder,
            JwtAuthenticationFilter jwtFilter,
            RateLimitingFilter rateLimitingFilter) {
        return builder.routes()
            .route("auth-service", r -> r
                .path("/api/auth/**")
                .filters(f -> f.filter(rateLimitingFilter.apply(new RateLimitingFilter.Config())))
                .uri("lb://customer-service")
            )
            .route("admin-customer-accounts", r -> r
                .path("/api/admin/customers/*/accounts")
                .filters(f -> f
                    .rewritePath("/api/admin/customers/(?<id>[^/]+)/accounts", "/api/accounts/customer/${id}")
                    .filter(rateLimitingFilter.apply(adminHighLimitConfig()))
                    .filter(jwtFilter.apply(new JwtAuthenticationFilter.Config()))
                )
                .uri("lb://account-service")
            )
            .route("admin-customers", r -> r
                .path("/api/admin/customers/**")
                .filters(f -> f
                    .rewritePath("/api/admin/customers(?<segment>.*)", "/api/customers${segment}")
                    .filter(rateLimitingFilter.apply(adminHighLimitConfig()))
                    .filter(jwtFilter.apply(new JwtAuthenticationFilter.Config()))
                )
                .uri("lb://customer-service")
            )
            .route("admin-accounts", r -> r
                .path("/api/admin/accounts/**")
                .filters(f -> f 
                    .rewritePath("/api/admin/accounts(?<segment>.*)", "/api/accounts${segment}")
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtFilter.apply(new JwtAuthenticationFilter.Config()))
                )
                .uri("lb://account-service")
            )
            .route("admin-transactions", r -> r
                .path("/api/admin/transactions", "/api/admin/transactions/**")
                .filters(f -> f
                    .rewritePath("/api/admin/transactions(?<segment>.*)", "/api/transactions${segment}")
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtFilter.apply(new JwtAuthenticationFilter.Config()))
                )
                .uri("lb://transaction-service")
            )
            .route("admin-dashboard", r -> r
                .path("/api/admin/dashboard/**")
                .filters(f -> f
                    .rewritePath("/api/admin/dashboard(/stats)?(?<segment>.*)", "/api/reports/dashboard${segment}")
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtFilter.apply(new JwtAuthenticationFilter.Config()))
                )
                .uri("lb://reporting-service")
            )
            .route("admin-users", r -> r
                .path("/api/admin/users/**")
                .filters(f -> f
                    .rewritePath("/api/admin/users(?<segment>.*)", "/api/users${segment}")
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtFilter.apply(new JwtAuthenticationFilter.Config()))
                )
                .uri("lb://customer-service")
            )
            .route("customer-service", r -> r
                .path("/api/customers/**")
                .filters(f -> f
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtFilter.apply(new JwtAuthenticationFilter.Config()))
                )
                .uri("lb://customer-service")
            )
            .route("customer-portal", r -> r
                .path("/api/customer/**")
                .filters(f -> f
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtFilter.apply(new JwtAuthenticationFilter.Config()))
                )
                .uri("lb://customer-service")
            )
            .route("account-service", r -> r
                .path("/api/accounts/**")
                .filters(f -> f
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtFilter.apply(new JwtAuthenticationFilter.Config()))
                )
                .uri("lb://account-service")
            )
            .route("transaction-service", r -> r
                .path("/api/transactions/**")
                .filters(f -> f
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtFilter.apply(new JwtAuthenticationFilter.Config()))
                )
                .uri("lb://transaction-service")
            )
            .route("reporting-service", r -> r
                .path("/api/reports/**")
                .filters(f -> f
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtFilter.apply(new JwtAuthenticationFilter.Config()))
                )
                .uri("lb://reporting-service")
            )
            .build();
    }
}

