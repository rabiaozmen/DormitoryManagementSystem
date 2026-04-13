namespace DormitoryManagementSystem.Infrastructure.Security;

public sealed class EncryptionOptions
{
    public const string SectionName = "Encryption";
    public string AesKeyBase64 { get; init; } = string.Empty;
    public string AesIvBase64 { get; init; } = string.Empty;
}
