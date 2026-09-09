package com.bellagnech.reporting.messaging;
import org.springframework.context.annotation.*;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.*;
import org.springframework.util.backoff.FixedBackOff;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Configuration
@ConditionalOnProperty(name="app.kafka.enabled", havingValue="true")
public class ProjectionKafkaConfiguration {
    @Bean public CommonErrorHandler projectionErrorHandler(KafkaTemplate<String,String> template) {
        var recoverer = new DeadLetterPublishingRecoverer(template);
        recoverer.setFailIfSendResultIsError(true);
        return new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));
    }
}
