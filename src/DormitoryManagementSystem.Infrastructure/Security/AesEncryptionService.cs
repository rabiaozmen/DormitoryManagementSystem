using System.Security.Cryptography;
using System.Text;
using DormitoryManagementSystem.Application.Security.Interfaces;
using Microsoft.Extensions.Options;

namespace DormitoryManagementSystem.Infrastructure.Security;

public sealed class AesEncryptionService(IOptions<EncryptionOptions> options) : IEncryptionService
{
    private readonly EncryptionOptions _options = options.Value;

    public string Encrypt(string plainText)
    {
        using var aes = Aes.Create();
        aes.Key = Convert.FromBase64String(_options.AesKeyBase64);
        aes.IV = Convert.FromBase64String(_options.AesIvBase64);
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var encryptor = aes.CreateEncryptor();
        var inputBytes = Encoding.UTF8.GetBytes(plainText);
        var encrypted = encryptor.TransformFinalBlock(inputBytes, 0, inputBytes.Length);
        return Convert.ToBase64String(encrypted);
    }

    public string Decrypt(string cipherText)
    {
        using var aes = Aes.Create();
        aes.Key = Convert.FromBase64String(_options.AesKeyBase64);
        aes.IV = Convert.FromBase64String(_options.AesIvBase64);
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor();
        var inputBytes = Convert.FromBase64String(cipherText);
        var decrypted = decryptor.TransformFinalBlock(inputBytes, 0, inputBytes.Length);
        return Encoding.UTF8.GetString(decrypted);
    }
}
