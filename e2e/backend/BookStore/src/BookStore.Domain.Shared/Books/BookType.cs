namespace BookStore.Books;

/// <summary>
/// The enum from ABP's own BookStore tutorial, kept verbatim: it is what
/// <c>abpv generate</c> maps to <c>PropType.Enum</c>, and the localization keys the
/// generated page asks for are <c>Enum:BookType.{value}</c>.
/// </summary>
public enum BookType
{
    Undefined,
    Adventure,
    Biography,
    Dystopia,
    Fantasy,
    Horror,
    Science,
    ScienceFiction,
    Poetry
}
