package com.bellagnech.customer.services;

import com.bellagnech.customer.dtos.CustomerDTO;
import com.bellagnech.customer.entities.Customer;
import com.bellagnech.customer.entities.User;
import com.bellagnech.customer.events.CustomerCreatedEvent;
import com.bellagnech.customer.events.CustomerDeletedEvent;
import com.bellagnech.customer.events.CustomerUpdatedEvent;
import com.bellagnech.customer.exceptions.CustomerNotFoundException;
import com.bellagnech.customer.messaging.CustomerEventProducer;
import com.bellagnech.customer.repositories.CustomerRepository;
import com.bellagnech.customer.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final CustomerEventProducer eventProducer;

    public record CustomerStats(
            long totalCustomers,
            long activeCustomers,
            long inactiveCustomers,
            long suspendedCustomers,
            long newCustomersThisMonth
    ) {}

    @Transactional
    public CustomerDTO saveCustomer(CustomerDTO customerDTO) {
        log.info("Saving customer: {}", customerDTO.getName());
        Customer customer = toEntity(customerDTO);
        Customer saved = customerRepository.save(customer);
        publishCustomerCreated(saved, null);
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> listCustomersDTO() {
        log.info("Retrieving all customers");
        return customerRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerDTO getCustomer(Long customerId) throws CustomerNotFoundException {
        log.info("Retrieving customer with ID: {}", customerId);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with ID: " + customerId));
        return toDTO(customer);
    }

    @Transactional
    public CustomerDTO updateCustomer(CustomerDTO customerDTO) throws CustomerNotFoundException {
        log.info("Updating customer with ID: {}", customerDTO.getId());
        Customer existing = customerRepository.findById(customerDTO.getId())
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with ID: " + customerDTO.getId()));

        existing.setName(customerDTO.getName());
        existing.setEmail(customerDTO.getEmail());
        existing.setPhone(customerDTO.getPhone());
        existing.setAddress(customerDTO.getAddress());

        User user = existing.getUser();
        if (user != null) {
            if (customerDTO.getUsername() != null && !customerDTO.getUsername().isBlank()) {
                user.setUsername(customerDTO.getUsername().trim());
            }
            if (customerDTO.getFirstName() != null) {
                user.setFirstName(customerDTO.getFirstName());
            }
            if (customerDTO.getLastName() != null) {
                user.setLastName(customerDTO.getLastName());
            }
            userRepository.save(user);
        }

        Customer updated = customerRepository.save(existing);

        // Publish Kafka event
        try {
            CustomerUpdatedEvent event = CustomerUpdatedEvent.builder()
                    .eventId(java.util.UUID.randomUUID().toString())
                    .eventType(CustomerUpdatedEvent.EVENT_TYPE)
                    .timestamp(java.time.Instant.now())
                    .customerId(updated.getId())
                    .name(updated.getName())
                    .email(updated.getEmail())
                    .phone(updated.getPhone())
                    .address(updated.getAddress())
                    .username(user != null ? user.getUsername() : null)
                    .build();
            eventProducer.publishCustomerUpdated(event);
        } catch (Exception e) {
            throw new IllegalStateException("Could not persist domain event", e);
        }

        return toDTO(updated);
    }

    @Transactional
    public void deleteCustomer(Long customerId) throws CustomerNotFoundException {
        log.info("Deleting customer with ID: {}", customerId);
        if (!customerRepository.existsById(customerId)) {
            throw new CustomerNotFoundException("Customer not found with ID: " + customerId);
        }
        customerRepository.deleteById(customerId);

        // Publish Kafka event
        try {
            CustomerDeletedEvent event = CustomerDeletedEvent.builder()
                    .eventId(java.util.UUID.randomUUID().toString())
                    .eventType(CustomerDeletedEvent.EVENT_TYPE)
                    .timestamp(java.time.Instant.now())
                    .customerId(customerId)
                    .build();
            eventProducer.publishCustomerDeleted(event);
        } catch (Exception e) {
            throw new IllegalStateException("Could not persist domain event", e);
        }
    }

    @Transactional(readOnly = true)
    public Page<CustomerDTO> getCustomersPageable(int page, int size) {
        log.info("Retrieving customers page {} with size {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        return customerRepository.findAll(pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<CustomerDTO> searchCustomers(String keyword, int page, int size) {
        log.info("Searching customers with keyword: {}", keyword);
        Pageable pageable = PageRequest.of(page, size);
        return customerRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(keyword, keyword, pageable)
                .map(this::toDTO);
    }

    @Transactional
    public CustomerDTO updateCustomerStatus(Long customerId, boolean enabled) throws CustomerNotFoundException {
        log.info("Updating customer status for ID: {} to enabled={}", customerId, enabled);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with ID: " + customerId));

        User user = customer.getUser();

        if (user == null) {
            log.warn("Customer ID {} has no linked user. Trying to resolve by email {}", customerId, customer.getEmail());
            if (customer.getEmail() != null) {
                user = userRepository.findByEmail(customer.getEmail()).orElse(null);
            }
        }

        if (user != null) {
            user.setEnabled(enabled);
            user.setAccountNonLocked(enabled);
            userRepository.save(user);
        } else {
            log.warn("No user entity found for customer ID {}. Status toggle will not affect login.", customerId);
        }

        return toDTO(customer);
    }

    @Transactional
    public List<CustomerDTO> bulkUpdateCustomerStatus(List<Long> customerIds, boolean enabled) {
        log.info("Bulk updating customer status for {} customers to enabled={}", customerIds.size(), enabled);
        return customerIds.stream()
                .map(id -> {
                    try {
                        return updateCustomerStatus(id, enabled);
                    } catch (CustomerNotFoundException e) {
                        log.warn("Customer not found during bulk status update: {}", id);
                        return null;
                    }
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }

    @Transactional
    public void bulkDeleteCustomers(List<Long> customerIds) {
        log.info("Bulk deleting {} customers", customerIds.size());
        customerIds.forEach(id -> {
            if (customerRepository.existsById(id)) {
                customerRepository.deleteById(id);
            } else {
                log.warn("Customer not found during bulk delete: {}", id);
            }
        });
    }

    @Transactional(readOnly = true)
    public CustomerStats getCustomerStats() {
        long total = customerRepository.count();
        long active = userRepository.countByEnabledTrue();
        long inactive = userRepository.countByEnabledFalse();
        // For now, treat locked accounts as suspended
        long suspended = userRepository.countByAccountNonLockedFalse();

        // Simple approximation for "new this month" using createdDate
        long newThisMonth = userRepository.countCreatedThisMonth();

        return new CustomerStats(
                total,
                active,
                inactive,
                suspended,
                newThisMonth
        );
    }

    private CustomerDTO toDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setName(customer.getName());
        dto.setEmail(customer.getEmail());
        dto.setPhone(customer.getPhone());
        dto.setAddress(customer.getAddress());
        boolean enabled = true;
        User user = customer.getUser();
        if (user != null) {
            enabled = user.isEnabled();
            dto.setUsername(user.getUsername());
            dto.setFirstName(user.getFirstName());
            dto.setLastName(user.getLastName());
            dto.setRole(user.getRole() != null ? user.getRole().name() : null);
            dto.setCreatedAt(user.getCreatedDate());
        }
        dto.setEnabled(enabled);
        return dto;
    }

    private Customer toEntity(CustomerDTO dto) {
        Customer customer = new Customer();
        if (dto.getId() != null) {
            customer.setId(dto.getId());
        }
        customer.setName(dto.getName());
        customer.setEmail(dto.getEmail());
        customer.setPhone(dto.getPhone());
        customer.setAddress(dto.getAddress());
        return customer;
    }

    private void publishCustomerCreated(Customer saved, String username) {
        CustomerCreatedEvent event = CustomerCreatedEvent.builder()
                .customerId(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .username(username != null ? username : (saved.getUser() != null ? saved.getUser().getUsername() : null))
                .build();
        eventProducer.publishCustomerCreated(event);
    }
}

