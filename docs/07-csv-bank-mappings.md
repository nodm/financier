# CSV Bank Field Mappings

**STATUS: DRAFT** - This document requires adjustments during implementation phase.

## Overview

This document maps CSV fields from each supported bank to the application's unified transaction schema.

## Target Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountId` | String | Yes | Internal account UUID (from hash lookup) |
| `counterpartyAccountId` | String | No | For internal transfers |
| `date` | DateTime | Yes | Transaction date |
| `amount` | Decimal | Yes | Amount in account currency |
| `currency` | String | Yes | Account currency (ISO 4217) |
| `originalAmount` | Decimal | No | Original amount if converted |
| `originalCurrency` | String | No | Original currency if converted |
| `merchant` | String | No | Merchant/payee name |
| `description` | String | Yes | Transaction description |
| `category` | String | No | Transaction category |
| `type` | String | Yes | "debit", "credit", "transfer" |
| `balance` | Decimal | No | Account balance after transaction |
| `externalId` | String | No | Bank's transaction ID |
| `source` | String | Yes | Bank identifier |

## Bank CSV Mappings

### Revolut (LT-REVOLUT-EN.csv)

**File Structure**:
- Delimiter: `,` (comma)
- Encoding: UTF-8
- Header Row: Yes (line 1)
- Account Detection: Single account per file

**CSV Headers**:
```
Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
```

**Field Mapping**:

| Target Field | CSV Source | Transformation | Notes |
|--------------|------------|----------------|-------|
| `accountId` | `Product` | Hash of "REVOLUT-{Product}" | Product = "Current" |
| `counterpartyAccountId` | - | NULL | Not available |
| `date` | `Completed Date` | Parse datetime | Format: `2025-11-02 16:44:00` |
| `amount` | `Amount` | Direct | Already signed (negative=debit) |
| `currency` | `Currency` | Direct | ISO 4217 code |
| `originalAmount` | - | NULL | Not provided separately |
| `originalCurrency` | - | NULL | Not provided |
| `merchant` | `Description` | Direct | e.g., "Claude.ai" |
| `description` | `Description` | Direct | Full description |
| `category` | `Type` | Direct | "Card Payment", "Transfer", "Topup" |
| `type` | `Amount` | Derived from sign | amount < 0 = "debit", > 0 = "credit" |
| `balance` | `Balance` | Direct | Running balance |
| `externalId` | - | Generate hash | Hash: `{date}\|{amount}\|{description}` |
| `source` | - | Constant "REVOLUT" | |

**Special Handling**:
- Skip rows where `State != "COMPLETED"`
- Fee column available but not yet used
- Type field provides category information

---

### SEB (LT-SEB-LT.csv)

**File Structure**:
- Delimiter: `;` (semicolon)
- Encoding: UTF-8 (Lithuanian characters)
- Header Rows: Multiple (separator rows between accounts)
- Account Detection: Parse separator rows

**Account Separator Pattern**:
```
"SĄSKAITOS  (LT000000000000000001) IŠRAŠAS (UŽ LAIKOTARPĮ: 2025-10-01-2025-11-22)";
```

**CSV Headers** (after separator):
```
DOK NR.;DATA;VALIUTA;SUMA;MOKĖTOJO ARBA GAVĖJO PAVADINIMAS;MOKĖTOJO ARBA GAVĖJO IDENTIFIKACINIS KODAS;SĄSKAITA;KREDITO ĮSTAIGOS PAVADINIMAS;KREDITO ĮSTAIGOS SWIFT KODAS;MOKĖJIMO PASKIRTIS;TRANSAKCIJOS KODAS;DOKUMENTO DATA;TRANSAKCIJOS TIPAS;NUORODA;DEBETAS/KREDITAS;SUMA SĄSKAITOS VALIUTA;SĄSKAITOS NR;SĄSKAITOS VALIUTA
```

**Field Mapping**:

| Target Field | CSV Source | Transformation | Notes |
|--------------|------------|----------------|-------|
| `accountId` | Account separator row | Extract IBAN, hash | Extract: `LT000000000000000001` |
| `counterpartyAccountId` | `SĄSKAITA` | Lookup hash, if exists | May match user's account |
| `date` | `DATA` | Parse date | Format: `2025-10-04` |
| `amount` | `SUMA` + `DEBETAS/KREDITAS` | Parse decimal, apply sign | Comma decimal: `50,63` → negate if D |
| `currency` | `VALIUTA` | Direct | ISO 4217 code |
| `originalAmount` | - | NULL | Not provided |
| `originalCurrency` | - | NULL | Not provided |
| `merchant` | `MOKĖTOJO ARBA GAVĖJO PAVADINIMAS` | Direct | Payee name |
| `description` | `MOKĖJIMO PASKIRTIS` | Direct | Payment purpose |
| `category` | - | NULL | Not provided |
| `type` | `DEBETAS/KREDITAS` | Map: D="debit", C="credit" | |
| `balance` | - | NULL | Not provided |
| `externalId` | `DOK NR.` | Direct | Document number |
| `source` | - | Constant "SEB" | |

**Special Handling**:
- Multi-account file: Parse separator rows to identify account boundaries
- Decimal separator: comma (`,`) instead of dot
- Skip separator header rows
- Counterparty account detection for internal transfers

---

### Swedbank (LT_SWEDBANK-EN.csv)

**File Structure**:
- Delimiter: `,` (comma)
- Encoding: UTF-8
- Header Row: Yes (line 1)
- Account Detection: First column "Account No"
- Record Types: Different row types (10=opening, 20=transaction, 82=turnover, 86=closing)

**CSV Headers**:
```
Account No,"",Date,Beneficiary,Details,Amount,Currency,D/K,"Record ID",Code,"Reference No","Doc. No","Code in payer IS","Client code",Originator,"Beneficiary party"
```

**Field Mapping**:

| Target Field | CSV Source | Transformation | Notes |
|--------------|------------|----------------|-------|
| `accountId` | `Account No` | Hash IBAN | First column |
| `counterpartyAccountId` | - | NULL | Not easily identifiable |
| `date` | `Date` | Parse date | Only for record type 20 |
| `amount` | `Amount` + `D/K` | Parse decimal, apply sign | Negate if D/K = "D" |
| `currency` | `Currency` | Direct | ISO 4217 code |
| `originalAmount` | - | NULL | Not provided |
| `originalCurrency` | - | NULL | Not provided |
| `merchant` | `Beneficiary` | Direct | May be empty |
| `description` | `Details` | Direct | Transaction details |
| `category` | - | NULL | Not provided |
| `type` | `D/K` | Map: D="debit", K="credit" | |
| `balance` | `Amount` | Only for type 10/86 | Opening/closing balance |
| `externalId` | `Record ID` | Direct | Only for type 20 |
| `source` | - | Constant "SWEDBANK" | |

**Special Handling**:
- Filter by 2nd column (record type): only process type "20" (transactions)
- Type 10 = opening balance (extract to account.openingBalance)
- Type 86 = closing balance (extract to account.currentBalance)
- Type 82 = turnover summary (skip)
- Card masking in details: `516793******8242`

---

### Monobank (UA-MONOBANK-EN.csv)

**File Structure**:
- Delimiter: `,` (comma)
- Encoding: UTF-8
- Header Row: Yes (line 1)
- Account Detection: Single account per file

**CSV Headers**:
```
Date and time,Description,MCC,"Card currency amount, (UAH)","Operation amount","Operation currency","Exchange rate","Commission, (UAH)","Cashback amount, (UAH)",Balance
```

**Field Mapping**:

| Target Field | CSV Source | Transformation | Notes |
|--------------|------------|----------------|-------|
| `accountId` | - | Hash of "MONOBANK-{filename}" | Single account assumed |
| `counterpartyAccountId` | - | NULL | Not available |
| `date` | `Date and time` | Parse datetime | Format: `16.11.2025 12:53:58` (DD.MM.YYYY) |
| `amount` | `Card currency amount, (UAH)` | Direct | Already signed |
| `currency` | - | Constant "UAH" | Implied from field name |
| `originalAmount` | `Operation amount` | Direct if different | When currency conversion |
| `originalCurrency` | `Operation currency` | Direct if not UAH | e.g., "EUR" |
| `merchant` | `Description` | Direct | Merchant name |
| `description` | `Description` | Direct | Full description |
| `category` | `MCC` | Direct | Merchant Category Code |
| `type` | `Card currency amount, (UAH)` | Derived from sign | amount < 0 = "debit", > 0 = "credit" |
| `balance` | `Balance` | Direct | Running balance |
| `externalId` | - | Generate hash | Hash: `{date}\|{amount}\|{description}` |
| `source` | - | Constant "MONOBANK" | |

**Special Handling**:
- Date format: DD.MM.YYYY HH:mm:ss
- MCC code provides merchant category (4814=Telecom, etc.)
- Exchange rate field available but not used (can be derived)
- Commission and Cashback fields available
- Em dash (—) used for empty values instead of empty string

---

### PrivatBank (UA-PRIVATBANK-UA.csv)

**File Structure**:
- Delimiter: `;` (semicolon)
- Encoding: UTF-8 (Cyrillic)
- Header Rows: Two (line 1 = title, line 2 = headers)
- Account Detection: Card mask in "Картка" column

**Line 1** (skip):
```
Виписка з Ваших карток за період 01.11.2025 - 22.11.2025;;;;;;;;;
```

**CSV Headers** (line 2):
```
Дата;Категорія;Картка;Опис операції;Сума в валюті картки;Валюта картки;Сума в валюті транзакції;Валюта транзакції;Залишок на кінець періоду;Валюта залишку
```

**Field Mapping**:

| Target Field | CSV Source | Transformation | Notes |
|--------------|------------|----------------|-------|
| `accountId` | `Картка` | Hash card mask | Format: `5168 **** **** 2795` |
| `counterpartyAccountId` | - | NULL | Not available |
| `date` | `Дата` | Parse datetime | Format: `01.11.2025 17:36:03` |
| `amount` | `Сума в валюті картки` | Parse decimal, negate | Negative values in CSV |
| `currency` | `Валюта картки` | Direct | ISO 4217 code |
| `originalAmount` | `Сума в валюті транзакції` | Direct if different | When currency differs |
| `originalCurrency` | `Валюта транзакції` | Direct if different | Transaction currency |
| `merchant` | `Опис операції` | Extract from description | Parse merchant name |
| `description` | `Опис операції` | Direct | Full description |
| `category` | `Категорія` | Direct | Ukrainian category names |
| `type` | `Сума в валюті картки` | Derived from sign | amount < 0 = "debit", > 0 = "credit" |
| `balance` | `Залишок на кінець періоду` | Direct | Running balance |
| `externalId` | - | Generate hash | Hash: `{date}\|{amount}\|{description}` |
| `source` | - | Constant "PRIVATBANK" | |

**Special Handling**:
- Skip line 1 (statement header)
- Cyrillic headers and data
- Date format: DD.MM.YYYY HH:mm:ss
- Decimal separator: comma (`,`)
- Card mask format: `5168 **** **** 2795`
- Multiple cards possible in one file (group by Картка)

---

## Common Patterns

### Date Parsing

| Bank | Format | Example | Parse Function |
|------|--------|---------|----------------|
| Revolut | `YYYY-MM-DD HH:mm:ss` | `2025-11-02 16:44:00` | ISO datetime |
| SEB | `YYYY-MM-DD` | `2025-10-04` | ISO date |
| Swedbank | `YYYY-MM-DD` | `2025-11-11` | ISO date |
| Monobank | `DD.MM.YYYY HH:mm:ss` | `16.11.2025 12:53:58` | European datetime |
| PrivatBank | `DD.MM.YYYY HH:mm:ss` | `01.11.2025 17:36:03` | European datetime |

### Decimal Parsing

| Bank | Separator | Example | Parse Strategy |
|------|-----------|---------|----------------|
| Revolut | `.` (dot) | `21.78` | Direct parseFloat |
| SEB | `,` (comma) | `50,63` | Replace `,` with `.` |
| Swedbank | `.` (dot) | `34.23` | Direct parseFloat |
| Monobank | `.` (dot) | `15.0` | Direct parseFloat |
| PrivatBank | `,` (comma) | `10,82` | Replace `,` with `.` |

### Amount Sign Convention

| Bank | Convention | Type Indicator | Notes |
|------|------------|----------------|-------|
| Revolut | Signed | In amount | Negative = debit |
| SEB | Unsigned | `DEBETAS/KREDITAS` column | D = debit, C = credit |
| Swedbank | Unsigned | `D/K` column | D = debit, K = credit |
| Monobank | Signed | In amount | Negative = debit |
| PrivatBank | Signed | In amount | Negative = debit |

### Account Identification

| Bank | Strategy | Hash Input | Example |
|------|----------|------------|---------|
| Revolut | Product field | `REVOLUT-{Product}` | `REVOLUT-Current` |
| SEB | IBAN from separator | Full IBAN | `LT000000000000000001` |
| Swedbank | First column | Full IBAN | `LT000000000000000001` |
| Monobank | Filename/constant | `MONOBANK-{user-provided}` | User maps manually |
| PrivatBank | Card mask | Card number with mask | `5168********2795` |

### External ID Generation

**Banks with native ID**:
- SEB: `DOK NR.` field
- Swedbank: `Record ID` field

**Banks requiring synthetic ID**:
- Revolut: Hash `{Completed Date}|{Amount}|{Description}`
- Monobank: Hash `{Date and time}|{Card currency amount}|{Description}`
- PrivatBank: Hash `{Дата}|{Сума в валюті картки}|{Опис операції}`

**Hash Function**:
```typescript
function generateSyntheticId(date: string, amount: string, description: string): string {
  const data = `${date}|${amount}|${description}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 32);
}
```

---

## Multi-Account Handling

### Single Account per File
- Revolut ✓
- Monobank ✓
- Swedbank (usually, but Account No in each row allows multiple)

### Multiple Accounts per File
- SEB: Separator rows `"SĄSKAITOS (IBAN) IŠRAŠAS..."`
- PrivatBank: Different card masks in `Картка` column
- Swedbank: Different IBANs in `Account No` column

**Parser Strategy**:
1. Detect account boundaries/changes
2. Create/lookup account by hash
3. Associate transactions with correct account
4. Handle account switching mid-file

---

## Missing Data Handling

| Field | Revolut | SEB | Swedbank | Monobank | PrivatBank |
|-------|---------|-----|----------|----------|------------|
| `balance` | ✓ | ✗ | Partial (10/86) | ✓ | ✓ |
| `externalId` | ✗ (gen) | ✓ | ✓ | ✗ (gen) | ✗ (gen) |
| `category` | Type | ✗ | ✗ | MCC | ✓ |
| `merchant` | Description | ✓ | ✓ | ✓ | ✓ |
| `originalAmount` | ✗ | ✗ | ✗ | ✓ | ✓ |
| `originalCurrency` | ✗ | ✗ | ✗ | ✓ | ✓ |

**Strategy**:
- Missing `balance`: Leave NULL, calculate if needed
- Missing `externalId`: Generate synthetic hash
- Missing `category`: Leave NULL, user can assign
- Missing `merchant`: Extract from description or NULL

---

## Implementation Notes

### Parser Detection

**Header-based detection**:
```typescript
function detectBank(headers: Array<string>): BankCode {
  if (headers.includes("Type") && headers.includes("Product") && headers.includes("Completed Date")) {
    return "REVOLUT";
  }
  if (headers.includes("DOK NR.") && headers.includes("DEBETAS/KREDITAS")) {
    return "SEB";
  }
  if (headers.includes("Record ID") && headers.includes("D/K")) {
    return "SWEDBANK";
  }
  if (headers.includes("MCC") && headers.includes("Date and time")) {
    return "MONOBANK";
  }
  if (headers.includes("Дата") && headers.includes("Картка")) {
    return "PRIVATBANK";
  }
  throw new UnsupportedBankError("Unknown CSV format");
}
```

### Delimiter Detection

- Try parsing with `,` first
- If parse fails or suspicious, try `;`
- Papaparse can auto-detect

### Encoding

- Default UTF-8 for all
- Cyrillic support needed for PrivatBank
- Lithuanian characters for SEB

---

## Future Enhancements

1. **Fee handling**: Extract fee columns (Revolut, Monobank)
2. **Cashback tracking**: Monobank provides cashback data
3. **Exchange rate storage**: Monobank provides rates
4. **MCC mapping**: Create merchant category database from Monobank MCCs
5. **Counterparty detection**: Smart matching for internal transfers (SEB `SĄSKAITA` field)
6. **Card detection**: Link transactions to specific cards (PrivatBank, Swedbank)
7. **Recurring transaction detection**: Pattern matching across imports

---

## Testing Strategy

For each bank parser:

1. **Header detection test**: Verify `canParse()` returns true for correct bank
2. **Account extraction test**: Verify account hash generation
3. **Date parsing test**: Various date formats
4. **Decimal parsing test**: Comma vs dot separators
5. **Multi-account test**: SEB/PrivatBank file splitting
6. **Special rows test**: Swedbank record types, SEB separators
7. **Currency conversion test**: Monobank/PrivatBank original amounts
8. **Duplicate detection test**: Re-import same file
9. **Edge cases**: Empty fields, special characters, malformed data
10. **Integration test**: Full CSV import to database

---

## Version History

- **v1.0** (2025-11-26): Initial mappings for 5 banks based on sample CSV analysis
