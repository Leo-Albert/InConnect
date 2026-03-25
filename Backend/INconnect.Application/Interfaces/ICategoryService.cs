using INconnect.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace INconnect.Application.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>> GetAllAsync();
    Task<CategoryDto> CreateAsync(string name);
    Task<CategoryDto?> UpdateAsync(int id, string name);
    Task<bool> DeleteAsync(int id);
}
