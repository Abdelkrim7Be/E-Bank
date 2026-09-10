package com.bellagnech.customer.config;

import com.bellagnech.customer.entities.Customer;
import com.bellagnech.customer.entities.User;
import com.bellagnech.customer.enums.Role;
import com.bellagnech.customer.events.CustomerCreatedEvent;
import com.bellagnech.customer.messaging.CustomerEventProducer;
import com.bellagnech.customer.repositories.CustomerRepository;
import com.bellagnech.customer.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Seeds demo users (admin + customers) with password "password". */
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name="app.demo.enabled", havingValue="true")
@Component
@RequiredArgsConstructor
@Slf4j
public class DemoDataLoader implements ApplicationRunner {

    private static final String DEMO_PASSWORD = "password";

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomerEventProducer eventProducer;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String encodedPassword = passwordEncoder.encode(DEMO_PASSWORD);
        ensureUser("admin", "admin@banque.fr", "Admin", "Système", Role.ADMIN, encodedPassword, null);
        ensureUser("marie.dupont", "marie.dupont@email.fr", "Marie", "Dupont", Role.CUSTOMER, encodedPassword, "Marie Dupont");
        ensureUser("jean.martin", "jean.martin@email.fr", "Jean", "Martin", Role.CUSTOMER, encodedPassword, "Jean Martin");
        ensureUser("sophie.bernard", "sophie.bernard@email.fr", "Sophie", "Bernard", Role.CUSTOMER, encodedPassword, "Sophie Bernard");
        ensureUser("nadia.chakir", "nadia.chakir@email.fr", "Nadia", "Chakir", Role.CUSTOMER, encodedPassword, "Nadia Chakir");
        String[][] extraCustomers = new String[][]{
                {"pierre.dupuis", "Pierre", "Dupuis"},
                {"amelie.leroy", "Amélie", "Leroy"},
                {"lucas.moreau", "Lucas", "Moreau"},
                {"claire.roux", "Claire", "Roux"},
                {"thomas.brun", "Thomas", "Brun"},
                {"emma.robert", "Emma", "Robert"},
                {"nicolas.petit", "Nicolas", "Petit"},
                {"julie.mercier", "Julie", "Mercier"},
                {"antoine.renard", "Antoine", "Renard"},
                {"camille.noel", "Camille", "Noël"},
                {"hugo.durand", "Hugo", "Durand"},
                {"lea.colin", "Léa", "Colin"},
                {"paul.fournier", "Paul", "Fournier"},
                {"ines.garnier", "Inès", "Garnier"},
                {"maxime.benoit", "Maxime", "Benoît"},
                {"manon.dupuy", "Manon", "Dupuy"},
                {"alexandre.gerard", "Alexandre", "Gérard"},
                {"chloe.morin", "Chloé", "Morin"},
                {"quentin.lucas", "Quentin", "Lucas"},
                {"salome.charles", "Salomé", "Charles"},
                {"youssef.benali", "Youssef", "Benali"},
                {"fatima.elhassan", "Fatima", "El Hassan"},
                {"rachid.boumediene", "Rachid", "Boumediene"},
                {"amina.belaid", "Amina", "Belaid"},
                {"karim.lamrani", "Karim", "Lamrani"},
                {"sara.ait", "Sara", "Aït"},
                {"mehdi.bouras", "Mehdi", "Bouras"},
                {"julien.perrin", "Julien", "Perrin"},
                {"anais.guillot", "Anaïs", "Guillot"},
                {"renaud.dupont", "Renaud", "Dupont"},
                {"celine.martinez", "Céline", "Martinez"},
                {"gael.roche", "Gaël", "Roche"},
                {"laura.pires", "Laura", "Pires"},
                {"bruno.schmitt", "Bruno", "Schmitt"},
                {"isabelle.morel", "Isabelle", "Morel"},
                {"kevin.marchand", "Kévin", "Marchand"},
                {"amel.benammar", "Amel", "Ben Ammar"},
                {"samir.ouali", "Samir", "Ouali"},
                {"nadine.valois", "Nadine", "Valois"},
                {"tarek.bellamine", "Tarek", "Bellamine"},
                {"aicha.benali", "Aïcha", "Benali"},
                {"zakaria.haddad", "Zakaria", "Haddad"},
                {"ines.belkacem", "Inès", "Belkacem"},
                {"nora.kerrouche", "Nora", "Kerrouche"},
                {"yassin.mansour", "Yassin", "Mansour"},
                {"salma.boukhalfa", "Salma", "Boukhalfa"}
        };

        for (String[] c : extraCustomers) {
            String username = c[0];
            String firstName = c[1];
            String lastName = c[2];
            String email = username + "@email.fr";
            String fullName = firstName + " " + lastName;
            ensureUser(username, email, firstName, lastName, Role.CUSTOMER, encodedPassword, fullName);
        }

        long totalCustomers = customerRepository.count();
        long totalUsers = userRepository.count();
        log.info("Demo users ready ({} customers, {} users). Example login: admin/password, marie.dupont/password", totalCustomers, totalUsers);
    }

    private void ensureUser(String username, String email, String firstName, String lastName,
                           Role role, String encodedPassword, String customerName) {
        userRepository.findByUsername(username).ifPresentOrElse(
                user -> {
                    user.setPassword(encodedPassword);
                    userRepository.save(user);
                    customerRepository.findByUser(user).ifPresent(customer -> {
                        if (customer.getPhone() == null || customer.getPhone().isBlank()) {
                            customer.setPhone("+33 6 12 34 56 78");
                        }
                        if (customer.getAddress() == null || customer.getAddress().isBlank()) {
                            customer.setAddress("123 Rue Example, Paris");
                        }
                        customerRepository.save(customer);
                        // Republish current demo state when upgrading retained volumes from
                        // the legacy event format; reporting upserts these versioned snapshots.
                        eventProducer.publishCustomerCreated(CustomerCreatedEvent.builder()
                                .eventType(CustomerCreatedEvent.EVENT_TYPE)
                                .customerId(customer.getId()).name(customer.getName())
                                .email(customer.getEmail()).username(user.getUsername()).build());
                    });
                    log.debug("Updated password for demo user: {}", username);
                },
                () -> {
                    User user = new User();
                    user.setUsername(username);
                    user.setEmail(email);
                    user.setFirstName(firstName);
                    user.setLastName(lastName);
                    user.setRole(role);
                    user.setPassword(encodedPassword);
                    user.setEnabled(true);
                    user.setAccountNonExpired(true);
                    user.setAccountNonLocked(true);
                    user.setCredentialsNonExpired(true);
                    User saved = userRepository.save(user);
                    if (role == Role.CUSTOMER && customerName != null) {
                        Customer customer = new Customer();
                        customer.setName(customerName);
                        customer.setEmail(email);
                        customer.setPhone("+33 6 12 34 56 78");
                        customer.setAddress("123 Rue Example, Paris");
                        customer.setUser(saved);
                        Customer savedCustomer = customerRepository.save(customer);
                        eventProducer.publishCustomerCreated(CustomerCreatedEvent.builder()
                                .eventType(CustomerCreatedEvent.EVENT_TYPE)
                                .customerId(savedCustomer.getId())
                                .name(savedCustomer.getName())
                                .email(savedCustomer.getEmail())
                                .username(saved.getUsername())
                                .build());
                    }
                    log.debug("Created demo user: {}", username);
                }
        );
    }
}
