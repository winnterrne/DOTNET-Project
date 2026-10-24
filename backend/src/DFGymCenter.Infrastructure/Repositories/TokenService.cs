using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DFGymCenter.Application.Common.Interfaces;
using DFGymCenter.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DFGymCenter.Infrastructure.Repositories;

/// <summary>
/// Dịch vụ tạo JWT Token chứa Role & băm mật khẩu chuẩn PBKDF2-HMACSHA256 (tương thích PasswordHasher).
/// </summary>
public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, DateTime ExpiresAt) GenerateJwtToken(User user)
    {
        var secretKey = _configuration["JwtSettings:Secret"]
            ?? "DFGymCenter_SuperSecretKey_For_JwtAuthentication_2026_CleanArchitecture!";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "DFGymCenter.API";
        var audience = _configuration["JwtSettings:Audience"] ?? "DFGymCenter.Client";
        var expiryHours = int.TryParse(_configuration["JwtSettings:ExpiryHours"], out var h) ? h : 24;

        var expiresAt = DateTime.UtcNow.AddHours(expiryHours);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var roleClaimValue = user.Role.ToString().ToUpperInvariant();

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new("username", user.UserName),
            new(ClaimTypes.Role, roleClaimValue),
            new("role", roleClaimValue),
            new("status", user.Status.ToString().ToUpperInvariant()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 100_000,
            hashAlgorithm: HashAlgorithmName.SHA256,
            outputLength: 32);

        return $"PBKDF2$100000${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
            return false;

        if (passwordHash.StartsWith("PBKDF2$"))
        {
            var parts = passwordHash.Split('$');
            if (parts.Length != 4) return false;

            var iterations = int.Parse(parts[1]);
            var salt = Convert.FromBase64String(parts[2]);
            var expectedHash = Convert.FromBase64String(parts[3]);

            var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password),
                salt,
                iterations: iterations,
                hashAlgorithm: HashAlgorithmName.SHA256,
                outputLength: expectedHash.Length);

            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }

        // Hỗ trợ trường hợp mật khẩu thuần từ dữ liệu test cũ (nếu có)
        return password == passwordHash;
    }
}
