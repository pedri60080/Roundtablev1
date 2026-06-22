# C# naming conventions

## Naming rules

- Identifiers must start with a letter or underscore (`_`).
- Identifiers can contain Unicode letter characters, decimal digit characters, and Unicode connecting/combining/formatting characters.
- Use the `@` prefix to use a C# keyword as an identifier (e.g. `@if`).

## Naming conventions

### PascalCase

Use for:
- Type names: `class`, `interface`, `struct`, `delegate`, `enum`
- All `public` members: fields, properties, events, methods, local functions
- Record positional parameters (they become public properties)

```csharp
public class DataService { }
public record PhysicalAddress(string Street, string City, string StateOrProvince, string ZipCode);
public interface IWorkerQueue { }
```

### camelCase

Use for:
- `private` and `internal` fields, prefixed with `_`: `_workerQueue`
- Method parameters and local variables
- Primary constructor parameters on `class` and `struct` types

```csharp
public class DataService
{
    private IWorkerQueue _workerQueue;
}

public T SomeMethod<T>(int someNumber, bool isValid) { }
```

### Interfaces

- Prefix with `I`: `IWorkerQueue`, `ISessionChannel`.

### Generic type parameters

- Use descriptive names prefixed with `T`: `TSession`, `TInput`, `TOutput`.
- `T` alone is acceptable when a single type parameter is self-explanatory.

```csharp
public interface ISessionChannel<TSession> { TSession Session { get; } }
public delegate TOutput Converter<TInput, TOutput>(TInput from);
public class List<T> { }
```

## General guidelines

- Use meaningful and descriptive names; prefer clarity over brevity.
- Avoid abbreviations or acronyms except for widely accepted ones.
- Avoid single-letter names except for simple loop counters.
- Do not use two consecutive underscores (`__`) — those are reserved for compiler-generated identifiers.
- Use meaningful namespaces that follow reverse domain name notation.
- Enum types: singular noun for non-flags, plural for flags.
- Attribute types end with `Attribute`.