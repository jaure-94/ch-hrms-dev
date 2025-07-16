# Contract Template Variable Mapping

## Database Fields → Template Variables

### Employee Fields
| Database Field | Template Variables | Example Value |
|---|---|---|
| `firstName` | `{{firstName}}`, `{{employeeFirstName}}`, `{{employee_first_name}}` | John |
| `lastName` | `{{lastName}}`, `{{employeeLastName}}`, `{{employee_last_name}}` | Doe |
| `email` | `{{email}}`, `{{employee_email}}` | john.doe@company.com |
| `phone` | `{{phone}}`, `{{employee_phone}}` | (555) 123-4567 |
| `address` | `{{address}}`, `{{employee_address}}`, `{{employeeAddress}}` | 456 Oak Ave, San Francisco |
| `dateOfBirth` | `{{dateOfBirth}}` | 15/05/1990 |
| `nationalInsuranceNumber` | `{{nationalInsuranceNumber}}` | AB123456C |
| `gender` | `{{gender}}` | Male |
| `maritalStatus` | `{{maritalStatus}}` | Single |

### Employment Fields
| Database Field | Template Variables | Example Value |
|---|---|---|
| `jobTitle` | `{{jobTitle}}`, `{{job_title}}` | Senior Software Engineer |
| `department` | `{{department}}` | Engineering |
| `baseSalary` | `{{baseSalary}}`, `{{salary}}`, `{{annual_salary}}`, `{{base_salary}}` | 120000.00 |
| `payFrequency` | `{{payFrequency}}` | Annually |
| `startDate` | `{{startDate}}`, `{{employment_start_date}}` | 15/01/2024 |
| `endDate` | `{{endDate}}`, `{{employment_end_date}}` | 15/01/2025 |
| `location` | `{{location}}` | London |
| `manager` | `{{manager}}` | Jane Smith |
| `employmentStatus` | `{{employmentStatus}}` | Full-time |
| `weeklyHours` | `{{weeklyHours}}` | 40 |
| `paymentMethod` | `{{paymentMethod}}` | Bank Transfer |
| `taxCode` | `{{taxCode}}` | 1257L |
| `benefits` | `{{benefits}}` | Health Insurance, Pension |

### Company Fields
| Database Field | Template Variables | Example Value |
|---|---|---|
| `name` | `{{companyName}}`, `{{company_name}}` | TechCorp Inc. |
| `address` | `{{companyAddress}}`, `{{company_address}}` | 123 Tech Street, San Francisco, CA 94105 |
| `phone` | `{{companyPhone}}` | (555) 123-4567 |
| `email` | `{{companyEmail}}` | info@techcorp.com |
| `website` | `{{companyWebsite}}` | https://techcorp.com |
| `industry` | `{{companyIndustry}}` | Technology |
| `size` | `{{companySize}}` | Medium (50-200 employees) |

### Parsed Address Fields (from single address field)
| Template Variable | Description | Example Value |
|---|---|---|
| `{{companyAddressStreet1}}` | First line of address | 123 Tech Street |
| `{{companyAddressStreet2}}` | Second line of address | (empty) |
| `{{companyAddressCity}}` | City name (parsed or default) | London |
| `{{companyAddressPostcode}}` | Postcode (parsed or default) | SW1A 1AA |
| `{{companyAddressCountry}}` | Country (default) | United Kingdom |
| `{{companyAddressCounty}}` | County (default) | Greater London |

### Common Typos Handled
| Typo | Correct Variable | Value |
|---|---|---|
| `{{comanyAddressCity}}` | `{{companyAddressCity}}` | London |

### Additional System Variables
| Template Variable | Description | Example Value |
|---|---|---|
| `{{currentDate}}` | Today's date | 16/07/2025 |
| `{{currentYear}}` | Current year | 2025 |
| `{{contractDate}}` | Contract creation date | 16/07/2025 |
| `{{noticeWeeks}}` | Notice period in weeks | 4 |
| `{{probationPeriod}}` | Probation period | 6 months |
| `{{fullName}}` | Full employee name | John Doe |

## Template Processing

1. **DOCX Templates**: Uses `docx-templates` library with `{{variableName}}` syntax
2. **Fallback**: Binary string replacement for unsupported templates
3. **Error Handling**: Undefined variables are replaced with empty strings
4. **Address Parsing**: Single address field is split into components for template use

## Notes

- The system handles multiple naming conventions (camelCase, snake_case, etc.)
- Missing database fields are provided with sensible UK defaults
- All monetary values are formatted with £ symbol
- Dates are formatted as DD/MM/YYYY for UK locale