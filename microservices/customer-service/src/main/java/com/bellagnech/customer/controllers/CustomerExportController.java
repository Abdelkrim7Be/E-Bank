package com.bellagnech.customer.controllers;

import com.bellagnech.customer.dtos.CustomerDTO;
import com.bellagnech.customer.services.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Slf4j
public class CustomerExportController {

    private final CustomerService customerService;

    @GetMapping("/export")
    public ResponseEntity<ByteArrayResource> exportCustomersAsCsv() {
        log.info("Exporting customers as CSV");

        List<CustomerDTO> customers = customerService.listCustomersDTO();
        String csv = buildCsv(customers);

        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
        ByteArrayResource resource = new ByteArrayResource(bytes);

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=customers.csv");
        headers.set(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentLength(bytes.length)
                .body(resource);
    }

    private String buildCsv(List<CustomerDTO> customers) {
        String header = "Id,Username,Name,Email,Phone,Address,Enabled,CreatedAt";

        String rows = customers.stream()
                .map(c -> String.join(",",
                        escape(c.getId()),
                        escape(c.getUsername()),
                        escape(c.getName()),
                        escape(c.getEmail()),
                        escape(c.getPhone()),
                        escape(c.getAddress()),
                        escape(c.isEnabled()),
                        escape(c.getCreatedAt() != null ? c.getCreatedAt() : "")
                ))
                .collect(Collectors.joining("\n"));

        return header + "\n" + rows;
    }

    private String escape(Object value) {
        if (value == null) return "";
        String s = String.valueOf(value);
        String escaped = s.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }
}

