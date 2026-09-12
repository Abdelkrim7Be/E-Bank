package com.bellagnech.account.controllers;

import com.bellagnech.account.dtos.BankAccountDTO;
import com.bellagnech.account.services.AccountService;
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
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Slf4j
public class AccountExportController {

    private final AccountService accountService;

    @GetMapping("/export")
    public ResponseEntity<ByteArrayResource> exportAccountsAsCsv() {
        log.info("Exporting accounts as CSV");

        List<BankAccountDTO> accounts = accountService.bankAccountList();
        String csv = buildCsv(accounts);

        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
        ByteArrayResource resource = new ByteArrayResource(bytes);

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=accounts.csv");
        headers.set(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentLength(bytes.length)
                .body(resource);
    }

    private String buildCsv(List<BankAccountDTO> accounts) {
        String header = "Id,CustomerId,CustomerName,Type,Status,Balance,CreatedAt";

        String rows = accounts.stream()
                .map(a -> String.join(",",
                        escape(a.getId()),
                        escape(a.getCustomerId()),
                        escape(a.getCustomerName()),
                        escape(a.getType()),
                        escape(a.getStatus()),
                        escape(a.getBalance()),
                        escape(a.getCreateDate() != null ? a.getCreateDate() : "")
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

