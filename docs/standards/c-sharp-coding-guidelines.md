# C# coding guidelines

## MyCommunity DDD flavour

- Keep each Domain model as a single class file (e.g. `Person.cs`). Do not split across `partial` files.
- Keep validation logic out of Domain models; place it in separate validation classes in the Application layer.
- Use UTC `DateTime` values across the application and storage boundaries.
- Model behaviour in the Application layer as `UseCase` classes/interfaces (e.g. `ICreatePersonUseCase`), not Command/Query CQRS types.
- Use-case create methods return the newly created entity as a DTO (not a Domain model).

## MyCommunity backend conventions

### File organization

- One type per file in production code (`class`, `record`, `interface`, `enum`).
- Do not group multiple top-level types in a single `.cs` file.
- Exception: nested types are allowed.

### Closed-set type fields

- If a property represents a closed set of values (for example person type or information type), model it as an `enum`, not `string`.
- Keep enums end-to-end across layers when possible (Application DTOs and API response models included).
- For API contracts, serialize enums as string values using `JsonStringEnumConverter`.

### Mapperly usage

- Use static Mapperly mappers for model mapping (no DI).
- Mapperly-first rule: do not write manual projection/mapping code in controllers or use cases when the mapping can be expressed with Mapperly.
- Prefer enum mappings by name (`MapEnum(EnumMappingStrategy.ByName)`) for cross-layer enum mapping.
- Configure diagnostics via mapping attributes (e.g. `RequiredEnumMappingStrategy`) instead of pragma warning suppression.

### Test structure

- Align test folders with the source project path they test.
  Example: `backend/src/Presentation/MyCommunity.Api/Person/CreatePerson/PersonController.cs` maps to `backend/tests/MyCommunity.Api.Tests/Person/CreatePerson/PersonControllerTests.cs`.
- For projects without feature folders yet, keep tests at the test-project root with descriptive file names.
- Name test files after the unit under test with a `Tests` suffix.

## Language guidelines

- Use modern C# language features; avoid outdated constructs.
- Only catch exceptions that can be properly handled. Never catch `System.Exception` without a filter, except to log and rethrow.
- Use LINQ for collection manipulation.
- Use `async`/`await` for I/O-bound operations. Only use `ConfigureAwait` when required.
- Use language keywords for data types (`string` not `System.String`, `int` not `System.Int32`, including `nint`/`nuint`).
- Place interfaces in separate files, but not in separate folders.
- Each class must be in a separate file, except for nested classes.
- Primary constructors are not allowed.
- Prefix private fields with an underscore: `_workerQueue`.
- Use `nameof` with string interpolation when referencing class or property names in strings.
- Use the .NET 10 extension syntax for extension methods.
- Use Riok.Mapperly for object-to-object mapping. Make mapper classes and methods static; do not use DI.

### Unit tests

- One test class per class under test, in its own file.
- Name test classes with a `Tests` suffix matching the class under test.
- Use xUnit.
- Aim for 100% code coverage of public methods. Constructors only need testing if they contain logic.

### Control flow

- Prefer guard clauses; invert `if` conditions to reduce nesting.
- Always use braces for `if` statements (no single-line braceless forms).

### Strings

- Use string interpolation for concatenation.
- Use `StringBuilder` for loops with large text.
- Prefer raw string literals over escape sequences or verbatim strings.

### Constructors and initialisation

- Use Pascal case for primary constructor parameters on record types.
- Use `required` properties instead of constructors to force initialisation of property values.

### Arrays and collections

- Use collection expressions to initialise all collection types:

```csharp
string[] vowels = [ "a", "e", "i", "o", "u" ];
```

### Delegates

- Use `Func<>` and `Action<>` instead of defining delegate types.

### Exception handling

- Use `try-catch` for exception handling.
- Prefer `using` statements (braceless form) over `try-finally` with manual `Dispose`.

```csharp
using Font normalStyle = new Font("Arial", 10.0f);
byte charset = normalStyle.GdiCharSet;
```

### Operators

- Use `&&` / `||` (short-circuit) instead of `&` / `|` for comparisons.

### Object instantiation

- Use concise `new` forms (`var x = new Foo()` or `Foo x = new()`).
- Use object initialisers to simplify creation.

### Static members

- Call static members using the class name: `ClassName.StaticMember`.

### LINQ queries

- Use meaningful names for query variables.
- Rename properties in projections when names would be ambiguous.
- Use implicit typing (`var`) for query variables and range variables.
- Align query clauses under the `from` clause.
- Place `where` clauses before other query clauses.

### Implicit typing

- Use `var` when the type is obvious from the right side of the assignment.
- Use `var` for loop variables in `for` and `foreach`.
- Use `var` for LINQ result sequences.

### Namespaces

- Use file-scoped namespace declarations.
- Place `using` directives outside the namespace declaration.

## Style guidelines

- Four spaces for indentation. No tabs.
- Allman brace style: opening and closing brace on its own line, aligned with the current indentation level.
- One statement per line. One declaration per line.
- Indent continuation lines by one tab stop (four spaces).
- At least one blank line between method and property definitions.
- Use parentheses to make clause precedence explicit.
- Line breaks before binary operators when wrapping.