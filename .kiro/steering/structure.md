# Project Structure

```
/
├── index.html        # Entire application (HTML + CSS + JS in one file)
└── .kiro/
    └── steering/     # AI assistant guidance files
```

## Code Organization within index.html

- `<head>` — page metadata and all CSS styles
- `<body>` — UI markup: form inputs, items container, generate button, records table
- `<script>` (end of body) — all JavaScript: item list constant, DOM helpers, `addItem()`, `generateSTR()`

## Key Elements

- `#strNumber`, `#date`, `#store` — STR header inputs
- `#itemsContainer` — dynamically populated item rows (`.item-row`)
- `#strTable` — records table, rows appended on generate
- Status classes: `pending`, `returned`, `paid`, `cancelled`
