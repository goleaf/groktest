# ADR 0011: Universal localization catalog

## Context

Borrowed needs live EN/RU/LT switching and must remain inexpensive to extend. A service that imports every message object and separately repeats locale metadata makes a fourth language easy to implement incompletely. Russian and Lithuanian also require plural categories that cannot be represented safely by string concatenation.

## Decision

Use one locale-definition file per language. A small registry derives supported-language types and selector metadata. English is the fallback and structural reference. Named interpolation and `Intl.PluralRules` are implemented in the shared locale engine. Automated tests compare every locale's keys, parameters and plural shape with English.

Language preference remains part of local settings and is migrated in IndexedDB schema v3.

## Alternatives considered

- Angular compile-time locale builds: rejected because Borrowed requires instant runtime switching without a reload or separate deployment.
- A third-party i18n dependency: rejected because the current requirements are small and platform `Intl` provides the necessary plural rules and formatting.
- One combined translation file: rejected because it creates merge conflicts and makes ownership/completeness harder to review.

## Consequences

Adding a language requires one locale file and one registry entry. Locale files are larger, but remain independently reviewable. English keys are the compatibility contract; renaming a key requires updating stored activity keys or providing a migration/alias.
