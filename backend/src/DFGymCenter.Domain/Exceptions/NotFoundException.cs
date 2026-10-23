namespace DFGymCenter.Domain.Exceptions;

public class NotFoundException : DomainException
{
    public NotFoundException(string name, object key)
        : base($"Entity \"{name}\" ({key}) was not found.")
    {
    }
}

