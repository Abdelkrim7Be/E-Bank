package com.bellagnech.customer.controllers;

import com.bellagnech.customer.dtos.CustomerDTO;
import com.bellagnech.customer.exceptions.CustomerNotFoundException;
import com.bellagnech.customer.services.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<List<CustomerDTO>> getAllCustomers() {
        log.info("Retrieving all customers");
        List<CustomerDTO> customers = customerService.listCustomersDTO();
        return ResponseEntity.ok(customers);
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN') or @customerOwnership.canReadAll(#ids, authentication.name)")
    @GetMapping("/by-ids")
    public ResponseEntity<List<CustomerDTO>> getCustomersByIds(@RequestParam List<Long> ids) {
        if (ids.size() > 500) throw new IllegalArgumentException("Too many ids in one batch request");
        return ResponseEntity.ok(customerService.listCustomersByIds(ids));
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN') or @customerOwnership.canRead(#id, authentication.name)")
    @GetMapping("/{id}")
    public ResponseEntity<CustomerDTO> getCustomer(@PathVariable Long id) throws CustomerNotFoundException {
        log.info("Retrieving customer with ID: {}", id);
        CustomerDTO customer = customerService.getCustomer(id);
        return ResponseEntity.ok(customer);
    }

    @PostMapping
    public ResponseEntity<CustomerDTO> createCustomer(@Valid @RequestBody CustomerDTO customerDTO) {
        log.info("Creating new customer: {}", customerDTO.getName());
        CustomerDTO savedCustomer = customerService.saveCustomer(customerDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCustomer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerDTO> updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerDTO customerDTO) throws CustomerNotFoundException {
        log.info("Updating customer with ID: {}", id);
        customerDTO.setId(id);
        CustomerDTO updatedCustomer = customerService.updateCustomer(customerDTO);
        return ResponseEntity.ok(updatedCustomer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) throws CustomerNotFoundException {
        log.info("Deleting customer with ID: {}", id);
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CustomerDTO> updateCustomerStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest request) throws CustomerNotFoundException {
        log.info("Updating status for customer ID: {} to enabled={}", id, request.enabled());
        CustomerDTO updated = customerService.updateCustomerStatus(id, request.enabled());
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/bulk/status")
    public ResponseEntity<List<CustomerDTO>> bulkUpdateStatus(@RequestBody BulkStatusUpdateRequest request) {
        log.info("Bulk updating status for {} customers to enabled={}",
                request.customerIds() != null ? request.customerIds().size() : 0,
                request.enabled());
        List<CustomerDTO> updated = customerService.bulkUpdateCustomerStatus(request.customerIds(), request.enabled());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody BulkDeleteRequest request) {
        log.info("Bulk deleting {} customers",
                request.customerIds() != null ? request.customerIds().size() : 0);
        customerService.bulkDeleteCustomers(request.customerIds());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/page")
    public ResponseEntity<Page<CustomerDTO>> getCustomersPage(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.info("Retrieving customers page {} with size {}", page, size);
        Page<CustomerDTO> customersPage = customerService.getCustomersPageable(page, size);
        return ResponseEntity.ok(customersPage);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<CustomerDTO>> searchCustomers(
            @RequestParam(name = "keyword") String keyword,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.info("Searching for customers with keyword: {} (page: {}, size: {})", keyword, page, size);
        Page<CustomerDTO> customersPage = customerService.searchCustomers(keyword, page, size);
        return ResponseEntity.ok(customersPage);
    }

    @GetMapping("/stats")
    public ResponseEntity<CustomerService.CustomerStats> getStats() {
        log.info("Retrieving customer statistics");
        return ResponseEntity.ok(customerService.getCustomerStats());
    }

    public record StatusUpdateRequest(boolean enabled) {}

    public record BulkStatusUpdateRequest(List<Long> customerIds, boolean enabled) {}

    public record BulkDeleteRequest(List<Long> customerIds) {}
}

