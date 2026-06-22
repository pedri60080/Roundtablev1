namespace Roundtable.Application.Services;

public interface ICurrentUser
{
    string UserName { get; }

    bool IsAdminForTeam(string teamId);
}

