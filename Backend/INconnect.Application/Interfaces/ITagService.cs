using INconnect.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace INconnect.Application.Interfaces;

public interface ITagService
{
    Task<IEnumerable<TagDto>> GetAllAsync();
    Task<List<int>> GetOrCreateTagsAsync(List<string> tagNames);
    Task<bool> UpdateTagAsync(int id, string newName);
    Task<bool> DeleteTagAsync(int id);
}
