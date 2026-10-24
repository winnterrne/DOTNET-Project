using DFGymCenter.Domain.Entities;

namespace DFGymCenter.Domain.Interfaces;

public interface IUserRepository : IGenericRepository<User>
{
    Task<User?> GetByEmailOrUserNameAsync(string emailOrUserName, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<User>> GetAllWithDetailsAsync(string? role = null, string? search = null, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> UserNameExistsAsync(string userName, CancellationToken cancellationToken = default);
}
