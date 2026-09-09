# E-Bank UI action inventory

Generated from templates. Route smoke tests do not establish action coverage. Each unchecked row requires a behavior assertion and test reference. Conditional controls require browser exploration.

| ID | Source | Control | Binding or identifier | Behavior tested |
|---|---|---|---|---|
| UI-001 | `frontend/src/app/admin/components/accounts/account-details.component.html:11` | button | /admin/accounts | [ ] |
| UI-002 | `frontend/src/app/admin/components/accounts/account-details.component.html:18` | button | editAccount() | [ ] |
| UI-003 | `frontend/src/app/admin/components/accounts/account-details.component.html:22` | button | toggleDropdown() | [ ] |
| UI-004 | `frontend/src/app/admin/components/accounts/account-details.component.html:37` | button | 
                        updateAccountStatus('ACTIVATED'); dropdownOpen = false
                       | [ ] |
| UI-005 | `frontend/src/app/admin/components/accounts/account-details.component.html:49` | button | 
                        updateAccountStatus('SUSPENDED'); dropdownOpen = false
                       | [ ] |
| UI-006 | `frontend/src/app/admin/components/accounts/account-details.component.html:61` | button | closeAccount(); dropdownOpen = false | [ ] |
| UI-007 | `frontend/src/app/admin/components/accounts/account-details.component.html:72` | button | deleteAccount(); dropdownOpen = false | [ ] |
| UI-008 | `frontend/src/app/admin/components/accounts/account-details.component.html:94` | button | error = null | [ ] |
| UI-009 | `frontend/src/app/admin/components/accounts/account-details.component.html:191` | button | /admin/transactions | [ ] |
| UI-010 | `frontend/src/app/admin/components/accounts/account-details.component.html:201` | button | /admin/transactions | [ ] |
| UI-011 | `frontend/src/app/admin/components/accounts/account-details.component.html:211` | button | /admin/transfer | [ ] |
| UI-012 | `frontend/src/app/admin/components/accounts/account-details.component.html:219` | button | /admin/transactions | [ ] |
| UI-013 | `frontend/src/app/admin/components/accounts/account-details.component.html:228` | button | [
                        '/admin/customers',
                        account.customerDTO.id
                      ] | [ ] |
| UI-014 | `frontend/src/app/admin/components/accounts/account-form.component.html:12` | a | /admin/accounts | [ ] |
| UI-015 | `frontend/src/app/admin/components/accounts/account-form.component.html:28` | button | error = null | [ ] |
| UI-016 | `frontend/src/app/admin/components/accounts/account-form.component.html:43` | button | success = null | [ ] |
| UI-017 | `frontend/src/app/admin/components/accounts/account-form.component.html:68` | select | customerId; customerId | [ ] |
| UI-018 | `frontend/src/app/admin/components/accounts/account-form.component.html:102` | select | accountType; accountType | [ ] |
| UI-019 | `frontend/src/app/admin/components/accounts/account-form.component.html:133` | input | initialBalance; initialBalance | [ ] |
| UI-020 | `frontend/src/app/admin/components/accounts/account-form.component.html:176` | input | overdraft; overdraft | [ ] |
| UI-021 | `frontend/src/app/admin/components/accounts/account-form.component.html:200` | input | interestRate; interestRate | [ ] |
| UI-022 | `frontend/src/app/admin/components/accounts/account-form.component.html:223` | textarea | description; description | [ ] |
| UI-023 | `frontend/src/app/admin/components/accounts/account-form.component.html:234` | button | /admin/accounts | [ ] |
| UI-024 | `frontend/src/app/admin/components/accounts/account-form.component.html:241` | button |  | [ ] |
| UI-025 | `frontend/src/app/admin/components/accounts/account-list.component.html:9` | button | /admin/accounts/new | [ ] |
| UI-026 | `frontend/src/app/admin/components/accounts/account-list.component.html:26` | input |  | [ ] |
| UI-027 | `frontend/src/app/admin/components/accounts/account-list.component.html:37` | select |  | [ ] |
| UI-028 | `frontend/src/app/admin/components/accounts/account-list.component.html:51` | select |  | [ ] |
| UI-029 | `frontend/src/app/admin/components/accounts/account-list.component.html:63` | button | refreshAccounts() | [ ] |
| UI-030 | `frontend/src/app/admin/components/accounts/account-list.component.html:164` | button | ['/admin/accounts', account.id] | [ ] |
| UI-031 | `frontend/src/app/admin/components/accounts/account-list.component.html:172` | button | 
                                  updateAccountStatus(account, 'ACTIVATED')
                                 | [ ] |
| UI-032 | `frontend/src/app/admin/components/accounts/account-list.component.html:183` | button | 
                                  updateAccountStatus(account, 'SUSPENDED')
                                 | [ ] |
| UI-033 | `frontend/src/app/admin/components/accounts/account-list.component.html:194` | button | closeAccount(account) | [ ] |
| UI-034 | `frontend/src/app/admin/components/accounts/account-list.component.html:203` | button | deleteAccount(account) | [ ] |
| UI-035 | `frontend/src/app/admin/components/accounts/account-list.component.html:226` | button | goToPage(currentPage - 1) | [ ] |
| UI-036 | `frontend/src/app/admin/components/accounts/account-list.component.html:240` | button | goToPage(page) | [ ] |
| UI-037 | `frontend/src/app/admin/components/accounts/account-list.component.html:250` | button | goToPage(currentPage + 1) | [ ] |
| UI-038 | `frontend/src/app/admin/components/accounts/account-list.component.html:272` | button | exportAccounts() | [ ] |
| UI-039 | `frontend/src/app/admin/components/customers/customer-details.component.html:13` | button | /admin/customers | [ ] |
| UI-040 | `frontend/src/app/admin/components/customers/customer-details.component.html:20` | button | ['/admin/customers', customer.id, 'edit'] | [ ] |
| UI-041 | `frontend/src/app/admin/components/customers/customer-details.component.html:26` | button | toggleCustomerStatus() | [ ] |
| UI-042 | `frontend/src/app/admin/components/customers/customer-details.component.html:39` | button | deleteCustomer() | [ ] |
| UI-043 | `frontend/src/app/admin/components/customers/customer-details.component.html:53` | button | error = null | [ ] |
| UI-044 | `frontend/src/app/admin/components/customers/customer-details.component.html:162` | button | /admin/accounts | [ ] |
| UI-045 | `frontend/src/app/admin/components/customers/customer-details.component.html:169` | button | /admin/transactions | [ ] |
| UI-046 | `frontend/src/app/admin/components/customers/customer-details.component.html:192` | button | /admin/accounts/new | [ ] |
| UI-047 | `frontend/src/app/admin/components/customers/customer-details.component.html:240` | button | [
                                      '/admin/accounts',
                                      account.id,
                                    ] | [ ] |
| UI-048 | `frontend/src/app/admin/components/customers/customer-details.component.html:250` | button | editAccount(account) | [ ] |
| UI-049 | `frontend/src/app/admin/components/customers/customer-details.component.html:272` | button | /admin/accounts/new | [ ] |
| UI-050 | `frontend/src/app/admin/components/customers/customer-form.component.html:10` | a | /admin/customers | [ ] |
| UI-051 | `frontend/src/app/admin/components/customers/customer-form.component.html:30` | button | error = null | [ ] |
| UI-052 | `frontend/src/app/admin/components/customers/customer-form.component.html:45` | button | success = null | [ ] |
| UI-053 | `frontend/src/app/admin/components/customers/customer-form.component.html:71` | input | username; username | [ ] |
| UI-054 | `frontend/src/app/admin/components/customers/customer-form.component.html:104` | input | email; email | [ ] |
| UI-055 | `frontend/src/app/admin/components/customers/customer-form.component.html:139` | input | firstName; firstName | [ ] |
| UI-056 | `frontend/src/app/admin/components/customers/customer-form.component.html:151` | input | lastName; lastName | [ ] |
| UI-057 | `frontend/src/app/admin/components/customers/customer-form.component.html:165` | input | name; name | [ ] |
| UI-058 | `frontend/src/app/admin/components/customers/customer-form.component.html:177` | input | phone; phone | [ ] |
| UI-059 | `frontend/src/app/admin/components/customers/customer-form.component.html:194` | input | password; password | [ ] |
| UI-060 | `frontend/src/app/admin/components/customers/customer-form.component.html:231` | textarea | address; address | [ ] |
| UI-061 | `frontend/src/app/admin/components/customers/customer-form.component.html:242` | button | /admin/customers | [ ] |
| UI-062 | `frontend/src/app/admin/components/customers/customer-form.component.html:249` | button |  | [ ] |
| UI-063 | `frontend/src/app/admin/components/customers/customer-list.component.html:11` | button | exportCustomers() | [ ] |
| UI-064 | `frontend/src/app/admin/components/customers/customer-list.component.html:14` | button | /admin/customers/new | [ ] |
| UI-065 | `frontend/src/app/admin/components/customers/customer-list.component.html:30` | input |  | [ ] |
| UI-066 | `frontend/src/app/admin/components/customers/customer-list.component.html:41` | select |  | [ ] |
| UI-067 | `frontend/src/app/admin/components/customers/customer-list.component.html:54` | select |  | [ ] |
| UI-068 | `frontend/src/app/admin/components/customers/customer-list.component.html:67` | select |  | [ ] |
| UI-069 | `frontend/src/app/admin/components/customers/customer-list.component.html:89` | button | refreshCustomers() | [ ] |
| UI-070 | `frontend/src/app/admin/components/customers/customer-list.component.html:156` | button | ['/admin/customers', customer.id] | [ ] |
| UI-071 | `frontend/src/app/admin/components/customers/customer-list.component.html:163` | button | ['/admin/customers', customer.id, 'edit'] | [ ] |
| UI-072 | `frontend/src/app/admin/components/customers/customer-list.component.html:170` | button | toggleCustomerStatus(customer) | [ ] |
| UI-073 | `frontend/src/app/admin/components/customers/customer-list.component.html:193` | button | deleteCustomer(customer) | [ ] |
| UI-074 | `frontend/src/app/admin/components/customers/customer-list.component.html:213` | button | goToPage(currentPage - 1) | [ ] |
| UI-075 | `frontend/src/app/admin/components/customers/customer-list.component.html:222` | button | goToPage(page) | [ ] |
| UI-076 | `frontend/src/app/admin/components/customers/customer-list.component.html:230` | button | goToPage(currentPage + 1) | [ ] |
| UI-077 | `frontend/src/app/admin/components/dashboard/admin-dashboard.component.html:12` | button | exportReport() | [ ] |
| UI-078 | `frontend/src/app/admin/components/dashboard/admin-dashboard.component.html:24` | button | /admin/customers/new | [ ] |
| UI-079 | `frontend/src/app/admin/components/dashboard/admin-dashboard.component.html:130` | a | /admin/transactions | [ ] |
| UI-080 | `frontend/src/app/admin/components/dashboard/admin-dashboard.component.html:197` | button | /admin/customers/new | [ ] |
| UI-081 | `frontend/src/app/admin/components/dashboard/admin-dashboard.component.html:203` | button | /admin/accounts/new | [ ] |
| UI-082 | `frontend/src/app/admin/components/dashboard/admin-dashboard.component.html:209` | button | /admin/transactions | [ ] |
| UI-083 | `frontend/src/app/admin/components/dashboard/admin-dashboard.component.html:215` | button | /admin/reports | [ ] |
| UI-084 | `frontend/src/app/admin/components/reports/reports.component.html:8` | select | report-type | [ ] |
| UI-085 | `frontend/src/app/admin/components/reports/reports.component.html:14` | select | report-period | [ ] |
| UI-086 | `frontend/src/app/admin/components/reports/reports.component.html:18` | button |  | [ ] |
| UI-087 | `frontend/src/app/admin/components/reports/reports.component.html:25` | button | download() | [ ] |
| UI-088 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:11` | button | openOperationModal('credit') | [ ] |
| UI-089 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:19` | button | openOperationModal('debit') | [ ] |
| UI-090 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:27` | button | /admin/transfer | [ ] |
| UI-091 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:45` | button | successMessage = ''; Close | [ ] |
| UI-092 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:59` | button | errorMessage = ''; Close | [ ] |
| UI-093 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:77` | button | refreshTransactions() | [ ] |
| UI-094 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:95` | input |  | [ ] |
| UI-095 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:106` | select |  | [ ] |
| UI-096 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:120` | select |  | [ ] |
| UI-097 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:148` | button | loadTransactionsWithoutFilters() | [ ] |
| UI-098 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:155` | button | showBackendTroubleshooting() | [ ] |
| UI-099 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:257` | button | goToPage(0) | [ ] |
| UI-100 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:272` | button | goToPage(pagedResponse.number - 1) | [ ] |
| UI-101 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:288` | button | goToPage(+page - 1) | [ ] |
| UI-102 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:303` | button | goToPage(pagedResponse.number + 1) | [ ] |
| UI-103 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:315` | button | goToPage(pagedResponse.totalPages - 1) | [ ] |
| UI-104 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:334` | select |  | [ ] |
| UI-105 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:353` | input |  | [ ] |
| UI-106 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:362` | button | jumpToPage($event) | [ ] |
| UI-107 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:392` | button | closeModal(); Close | [ ] |
| UI-108 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:409` | select | accountId; accountId | [ ] |
| UI-109 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:440` | input | amount; amount | [ ] |
| UI-110 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:463` | input | description; description | [ ] |
| UI-111 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:482` | button | closeModal() | [ ] |
| UI-112 | `frontend/src/app/admin/components/transactions/admin-transactions.component.html:489` | button |  | [ ] |
| UI-113 | `frontend/src/app/app.component.html:2` | a |  | [ ] |
| UI-114 | `frontend/src/app/auth/components/login/login.component.html:5` | a | /auth/login | [ ] |
| UI-115 | `frontend/src/app/auth/components/login/login.component.html:34` | button | Dismiss message; errorMessage = '' | [ ] |
| UI-116 | `frontend/src/app/auth/components/login/login.component.html:48` | button | Dismiss message; successMessage = '' | [ ] |
| UI-117 | `frontend/src/app/auth/components/login/login.component.html:68` | input | username; username | [ ] |
| UI-118 | `frontend/src/app/auth/components/login/login.component.html:102` | input | password; password | [ ] |
| UI-119 | `frontend/src/app/auth/components/login/login.component.html:114` | button | togglePasswordVisibility() | [ ] |
| UI-120 | `frontend/src/app/auth/components/login/login.component.html:145` | input | rememberMe; rememberMe | [ ] |
| UI-121 | `frontend/src/app/auth/components/login/login.component.html:158` | button |  | [ ] |
| UI-122 | `frontend/src/app/auth/components/login/login.component.html:175` | a | /auth/register | [ ] |
| UI-123 | `frontend/src/app/auth/components/login/login.component.html:189` | button | loginAsAdmin() | [ ] |
| UI-124 | `frontend/src/app/auth/components/login/login.component.html:198` | button | loginAsCustomer() | [ ] |
| UI-125 | `frontend/src/app/auth/components/register/register.component.html:5` | a | /auth/login | [ ] |
| UI-126 | `frontend/src/app/auth/components/register/register.component.html:34` | button | Dismiss message; errorMessage = '' | [ ] |
| UI-127 | `frontend/src/app/auth/components/register/register.component.html:48` | button | Dismiss message; successMessage = '' | [ ] |
| UI-128 | `frontend/src/app/auth/components/register/register.component.html:66` | input | firstName; firstName | [ ] |
| UI-129 | `frontend/src/app/auth/components/register/register.component.html:94` | input | lastName; lastName | [ ] |
| UI-130 | `frontend/src/app/auth/components/register/register.component.html:127` | input | username; username | [ ] |
| UI-131 | `frontend/src/app/auth/components/register/register.component.html:164` | input | email; email | [ ] |
| UI-132 | `frontend/src/app/auth/components/register/register.component.html:193` | input | phone; phone | [ ] |
| UI-133 | `frontend/src/app/auth/components/register/register.component.html:211` | input | password; password | [ ] |
| UI-134 | `frontend/src/app/auth/components/register/register.component.html:223` | button | togglePasswordVisibility() | [ ] |
| UI-135 | `frontend/src/app/auth/components/register/register.component.html:351` | input | confirmPassword; confirmPassword | [ ] |
| UI-136 | `frontend/src/app/auth/components/register/register.component.html:382` | input | acceptTerms; acceptTerms | [ ] |
| UI-137 | `frontend/src/app/auth/components/register/register.component.html:394` | a |  | [ ] |
| UI-138 | `frontend/src/app/auth/components/register/register.component.html:395` | a |  | [ ] |
| UI-139 | `frontend/src/app/auth/components/register/register.component.html:422` | button |  | [ ] |
| UI-140 | `frontend/src/app/auth/components/register/register.component.html:451` | a | /auth/login | [ ] |
| UI-141 | `frontend/src/app/core/not-found/not-found.component.html:17` | a | / | [ ] |
| UI-142 | `frontend/src/app/core/not-found/not-found.component.html:20` | a | /dashboard | [ ] |
| UI-143 | `frontend/src/app/customer/components/accounts/customer-account-details.component.html:4` | button | /customer/accounts | [ ] |
| UI-144 | `frontend/src/app/customer/components/accounts/customer-account-details.component.html:24` | button | loadAccountDetails() | [ ] |
| UI-145 | `frontend/src/app/customer/components/accounts/customer-account-details.component.html:104` | button | ['/customer/deposit', account.id] | [ ] |
| UI-146 | `frontend/src/app/customer/components/accounts/customer-account-details.component.html:111` | button | ['/customer/debit', account.id] | [ ] |
| UI-147 | `frontend/src/app/customer/components/accounts/customer-account-details.component.html:118` | button | ['/customer/transfer'] | [ ] |
| UI-148 | `frontend/src/app/customer/components/accounts/customer-account-details.component.html:140` | button | /customer/transaction-history | [ ] |
| UI-149 | `frontend/src/app/customer/components/accounts/customer-account-details.component.html:152` | select |  | [ ] |
| UI-150 | `frontend/src/app/customer/components/accounts/customer-account-details.component.html:164` | input |  | [ ] |
| UI-151 | `frontend/src/app/customer/components/accounts/customer-account-details.component.html:173` | input |  | [ ] |
| UI-152 | `frontend/src/app/customer/components/accounts/customer-account-form.component.html:8` | button | goBack() | [ ] |
| UI-153 | `frontend/src/app/customer/components/accounts/customer-account-form.component.html:42` | select | accountType; accountType | [ ] |
| UI-154 | `frontend/src/app/customer/components/accounts/customer-account-form.component.html:69` | input | initialBalance; initialBalance | [ ] |
| UI-155 | `frontend/src/app/customer/components/accounts/customer-account-form.component.html:103` | input | overdraft; overdraft | [ ] |
| UI-156 | `frontend/src/app/customer/components/accounts/customer-account-form.component.html:135` | input | interestRate; interestRate | [ ] |
| UI-157 | `frontend/src/app/customer/components/accounts/customer-account-form.component.html:199` | button | goBack() | [ ] |
| UI-158 | `frontend/src/app/customer/components/accounts/customer-account-form.component.html:206` | button |  | [ ] |
| UI-159 | `frontend/src/app/customer/components/accounts/customer-accounts.component.html:8` | button | /customer/accounts/new | [ ] |
| UI-160 | `frontend/src/app/customer/components/accounts/customer-accounts.component.html:26` | button | loadAccounts() | [ ] |
| UI-161 | `frontend/src/app/customer/components/accounts/customer-accounts.component.html:90` | button | ['/customer/deposit', account.id] | [ ] |
| UI-162 | `frontend/src/app/customer/components/accounts/customer-accounts.component.html:100` | button | ['/customer/debit', account.id] | [ ] |
| UI-163 | `frontend/src/app/customer/components/accounts/customer-accounts.component.html:110` | button | ['/customer/transfer'] | [ ] |
| UI-164 | `frontend/src/app/customer/components/accounts/customer-accounts.component.html:120` | button | ['/customer/accounts', account.id] | [ ] |
| UI-165 | `frontend/src/app/customer/components/accounts/customer-accounts.component.html:143` | button | /customer/accounts/new | [ ] |
| UI-166 | `frontend/src/app/customer/components/dashboard/customer-dashboard.component.html:15` | button | /customer/deposit | [ ] |
| UI-167 | `frontend/src/app/customer/components/dashboard/customer-dashboard.component.html:21` | button | /customer/debit | [ ] |
| UI-168 | `frontend/src/app/customer/components/dashboard/customer-dashboard.component.html:27` | button | /customer/transfer | [ ] |
| UI-169 | `frontend/src/app/customer/components/dashboard/customer-dashboard.component.html:70` | button | ['/customer/accounts', account.id] | [ ] |
| UI-170 | `frontend/src/app/customer/components/dashboard/customer-dashboard.component.html:112` | button | /customer/accounts | [ ] |
| UI-171 | `frontend/src/app/customer/components/dashboard/customer-dashboard.component.html:142` | a | /customer/transaction-history | [ ] |
| UI-172 | `frontend/src/app/customer/components/dashboard/customer-dashboard.component.html:203` | button | /customer/deposit | [ ] |
| UI-173 | `frontend/src/app/customer/components/dashboard/customer-dashboard.component.html:212` | button | /customer/debit | [ ] |
| UI-174 | `frontend/src/app/customer/components/dashboard/customer-dashboard.component.html:221` | button | /customer/transfer | [ ] |
| UI-175 | `frontend/src/app/customer/components/dashboard/customer-dashboard.component.html:232` | button | /customer/transaction-history | [ ] |
| UI-176 | `frontend/src/app/customer/components/shared/customer-layout.component.html:22` | a |  | [ ] |
| UI-177 | `frontend/src/app/customer/components/shared/customer-layout.component.html:26` | a |  | [ ] |
| UI-178 | `frontend/src/app/customer/components/shared/customer-layout.component.html:30` | a |  | [ ] |
| UI-179 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:4` | a | /customer/dashboard | [ ] |
| UI-180 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:10` | button | Toggle navigation | [ ] |
| UI-181 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:26` | a | /customer/dashboard | [ ] |
| UI-182 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:37` | a | /customer/accounts | [ ] |
| UI-183 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:47` | a | /customer/transaction-history | [ ] |
| UI-184 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:57` | a | transactionDropdown | [ ] |
| UI-185 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:70` | a | /customer/deposit | [ ] |
| UI-186 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:76` | a | /customer/debit | [ ] |
| UI-187 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:82` | a | /customer/transfer | [ ] |
| UI-188 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:94` | a | userDropdown | [ ] |
| UI-189 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:121` | a | /profile | [ ] |
| UI-190 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:127` | a | changePassword($event) | [ ] |
| UI-191 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:137` | a | viewAccountStatement($event) | [ ] |
| UI-192 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:148` | a | logout($event) | [ ] |
| UI-193 | `frontend/src/app/customer/components/shared/customer-navigation.component.html:169` | a | /customer/dashboard | [ ] |
| UI-194 | `frontend/src/app/customer/components/transactions/customer-debit.component.html:8` | button | goBack() | [ ] |
| UI-195 | `frontend/src/app/customer/components/transactions/customer-debit.component.html:50` | select | accountId; accountId | [ ] |
| UI-196 | `frontend/src/app/customer/components/transactions/customer-debit.component.html:79` | input | amount; amount | [ ] |
| UI-197 | `frontend/src/app/customer/components/transactions/customer-debit.component.html:116` | textarea | description; description | [ ] |
| UI-198 | `frontend/src/app/customer/components/transactions/customer-debit.component.html:175` | button | goBack() | [ ] |
| UI-199 | `frontend/src/app/customer/components/transactions/customer-debit.component.html:182` | button |  | [ ] |
| UI-200 | `frontend/src/app/customer/components/transactions/customer-deposit.component.html:8` | button | goBack() | [ ] |
| UI-201 | `frontend/src/app/customer/components/transactions/customer-deposit.component.html:50` | select | accountId; accountId | [ ] |
| UI-202 | `frontend/src/app/customer/components/transactions/customer-deposit.component.html:79` | input | amount; amount | [ ] |
| UI-203 | `frontend/src/app/customer/components/transactions/customer-deposit.component.html:108` | textarea | description; description | [ ] |
| UI-204 | `frontend/src/app/customer/components/transactions/customer-deposit.component.html:164` | button | goBack() | [ ] |
| UI-205 | `frontend/src/app/customer/components/transactions/customer-deposit.component.html:171` | button |  | [ ] |
| UI-206 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:9` | button | exportTransactions() | [ ] |
| UI-207 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:15` | button | /customer/transfer | [ ] |
| UI-208 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:32` | select |  | [ ] |
| UI-209 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:48` | select |  | [ ] |
| UI-210 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:61` | input |  | [ ] |
| UI-211 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:70` | input |  | [ ] |
| UI-212 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:80` | button | clearFilters() | [ ] |
| UI-213 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:86` | button | applyFilters() | [ ] |
| UI-214 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:106` | button | loadTransactions() | [ ] |
| UI-215 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:121` | button | successMessage = '' | [ ] |
| UI-216 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:141` | select |  | [ ] |
| UI-217 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:151` | button | toggleSortDirection() | [ ] |
| UI-218 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:229` | button | viewTransactionDetails(transaction) | [ ] |
| UI-219 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:253` | button | clearFilters() | [ ] |
| UI-220 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:283` | button | goToPage(0) | [ ] |
| UI-221 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:295` | button | goToPage(pagedResponse.number - 1) | [ ] |
| UI-222 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:311` | button | goToPage(+page - 1) | [ ] |
| UI-223 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:326` | button | goToPage(pagedResponse.number + 1) | [ ] |
| UI-224 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:338` | button | goToPage(pagedResponse.totalPages - 1) | [ ] |
| UI-225 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:357` | select |  | [ ] |
| UI-226 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:376` | input |  | [ ] |
| UI-227 | `frontend/src/app/customer/components/transactions/customer-transactions.component.html:385` | button | jumpToPage($event) | [ ] |
| UI-228 | `frontend/src/app/customer/components/transactions/customer-transfer.component.html:8` | button | goBack() | [ ] |
| UI-229 | `frontend/src/app/customer/components/transactions/customer-transfer.component.html:50` | select | fromAccountId; fromAccountId | [ ] |
| UI-230 | `frontend/src/app/customer/components/transactions/customer-transfer.component.html:79` | input | toAccountId; toAccountId | [ ] |
| UI-231 | `frontend/src/app/customer/components/transactions/customer-transfer.component.html:110` | input | amount; amount | [ ] |
| UI-232 | `frontend/src/app/customer/components/transactions/customer-transfer.component.html:147` | textarea | description; description | [ ] |
| UI-233 | `frontend/src/app/customer/components/transactions/customer-transfer.component.html:214` | button | goBack() | [ ] |
| UI-234 | `frontend/src/app/customer/components/transactions/customer-transfer.component.html:221` | button |  | [ ] |
| UI-235 | `frontend/src/app/debug/auth-diagnostic.component.html:53` | button | runDiagnostic() | [ ] |
| UI-236 | `frontend/src/app/debug/auth-diagnostic.component.html:56` | button | clearStorage() | [ ] |
| UI-237 | `frontend/src/app/debug/auth-diagnostic.component.html:59` | button | goToLogin() | [ ] |
| UI-238 | `frontend/src/app/debug/auth-diagnostic.component.html:62` | button | testDirectAPI() | [ ] |
| UI-239 | `frontend/src/app/shared/components/alert/alert.component.html:2` | a | removeAlert(alert) | [ ] |
| UI-240 | `frontend/src/app/shared/components/error/unauthorized.component.html:35` | button | goToDashboard() | [ ] |
| UI-241 | `frontend/src/app/shared/components/error/unauthorized.component.html:43` | button | goBack() | [ ] |
| UI-242 | `frontend/src/app/shared/components/error/unauthorized.component.html:50` | button | logout() | [ ] |
| UI-243 | `frontend/src/app/shared/components/error/unauthorized.component.html:67` | a |  | [ ] |
| UI-244 | `frontend/src/app/shared/components/inline-alert/inline-alert.component.html:21` | button | onDismiss() | [ ] |
| UI-245 | `frontend/src/app/shared/components/navigation/navigation.component.html:3` | a | isAdmin ? '/admin/dashboard' : '/customer/dashboard'; E-Bank home | [ ] |
| UI-246 | `frontend/src/app/shared/components/navigation/navigation.component.html:8` | a | /profile | [ ] |
| UI-247 | `frontend/src/app/shared/components/navigation/navigation.component.html:9` | button | logout($event); Log out | [ ] |
| UI-248 | `frontend/src/app/shared/components/navigation/navigation.component.html:11` | button | toggleMobileMenu(); Toggle navigation | [ ] |
| UI-249 | `frontend/src/app/shared/components/navigation/navigation.component.html:15` | a | /admin/dashboard | [ ] |
| UI-250 | `frontend/src/app/shared/components/navigation/navigation.component.html:16` | a | /admin/customers | [ ] |
| UI-251 | `frontend/src/app/shared/components/navigation/navigation.component.html:17` | a | /admin/accounts | [ ] |
| UI-252 | `frontend/src/app/shared/components/navigation/navigation.component.html:18` | a | /admin/transactions | [ ] |
| UI-253 | `frontend/src/app/shared/components/navigation/navigation.component.html:19` | a | /admin/transfer | [ ] |
| UI-254 | `frontend/src/app/shared/components/navigation/navigation.component.html:20` | a | /admin/reports | [ ] |
| UI-255 | `frontend/src/app/shared/components/navigation/navigation.component.html:23` | a | /customer/dashboard | [ ] |
| UI-256 | `frontend/src/app/shared/components/navigation/navigation.component.html:24` | a | /customer/accounts | [ ] |
| UI-257 | `frontend/src/app/shared/components/navigation/navigation.component.html:25` | a | /customer/transaction-history | [ ] |
| UI-258 | `frontend/src/app/shared/components/navigation/navigation.component.html:26` | a | /customer/transfer | [ ] |
| UI-259 | `frontend/src/app/shared/components/navigation/navigation.component.html:27` | a | /customer/deposit | [ ] |
| UI-260 | `frontend/src/app/shared/components/navigation/navigation.component.html:28` | a | /customer/debit | [ ] |
| UI-261 | `frontend/src/app/shared/components/notifications/notifications.component.html:22` | button | dismiss(notification.id) | [ ] |
| UI-262 | `frontend/src/app/shared/components/profile/profile.component.html:39` | input | firstName; firstName | [ ] |
| UI-263 | `frontend/src/app/shared/components/profile/profile.component.html:54` | input | lastName; lastName | [ ] |
| UI-264 | `frontend/src/app/shared/components/profile/profile.component.html:70` | input | email; email | [ ] |
| UI-265 | `frontend/src/app/shared/components/profile/profile.component.html:85` | input | username | [ ] |
| UI-266 | `frontend/src/app/shared/components/profile/profile.component.html:97` | button | resetProfileForm() | [ ] |
| UI-267 | `frontend/src/app/shared/components/profile/profile.component.html:104` | button |  | [ ] |
| UI-268 | `frontend/src/app/shared/components/profile/profile.component.html:136` | input | currentPassword; currentPassword | [ ] |
| UI-269 | `frontend/src/app/shared/components/profile/profile.component.html:143` | button | toggleCurrentPasswordVisibility() | [ ] |
| UI-270 | `frontend/src/app/shared/components/profile/profile.component.html:159` | input | newPassword; newPassword | [ ] |
| UI-271 | `frontend/src/app/shared/components/profile/profile.component.html:166` | button | toggleNewPasswordVisibility() | [ ] |
| UI-272 | `frontend/src/app/shared/components/profile/profile.component.html:183` | input | confirmPassword; confirmPassword | [ ] |
| UI-273 | `frontend/src/app/shared/components/profile/profile.component.html:197` | button | resetPasswordForm() | [ ] |
| UI-274 | `frontend/src/app/shared/components/profile/profile.component.html:204` | button |  | [ ] |
| UI-275 | `frontend/src/app/transfer/transfer.component.html:8` | a | /dashboard | [ ] |
| UI-276 | `frontend/src/app/transfer/transfer.component.html:11` | a | /accounts | [ ] |
| UI-277 | `frontend/src/app/transfer/transfer.component.html:61` | select | fromAccount; fromAccountId | [ ] |
| UI-278 | `frontend/src/app/transfer/transfer.component.html:103` | select | toAccount; toAccountId | [ ] |
| UI-279 | `frontend/src/app/transfer/transfer.component.html:146` | input | amount; amount | [ ] |
| UI-280 | `frontend/src/app/transfer/transfer.component.html:189` | input | description; description | [ ] |
| UI-281 | `frontend/src/app/transfer/transfer.component.html:221` | input | reference; reference | [ ] |
| UI-282 | `frontend/src/app/transfer/transfer.component.html:260` | button | goBack() | [ ] |
| UI-283 | `frontend/src/app/transfer/transfer.component.html:268` | button |  | [ ] |
