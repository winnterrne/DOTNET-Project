using DFGymCenter.Domain.Entities;

namespace DFGymCenter.Application.Common.Interfaces;

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) GenerateJwtToken(User user);
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}
