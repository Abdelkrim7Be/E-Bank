package com.bellagnech.transaction.config;
import org.springframework.context.annotation.*;
import org.springframework.web.context.request.*;
@Configuration
public class FeignIdentityConfiguration {
    @Bean public feign.RequestInterceptor forwardAuthorization() {
        return template -> {
            if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
                String value = attributes.getRequest().getHeader("Authorization");
                if (value != null) template.header("Authorization", value);
            }
        };
    }
}
