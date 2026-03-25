using INconnect.Application.DTOs;
using INconnect.Application.Interfaces;
using INconnect.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace INconnect.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _context;

    public CategoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CategoryDto>> GetAllAsync()
    {
        return await _context.Categories
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name
            })
            .ToListAsync();
    }

    public async Task<CategoryDto> CreateAsync(string name)
    {
        var exists = await _context.Categories.AnyAsync(c => c.Name.ToLower() == name.ToLower());
        if (exists) throw new Exception("Category already exists.");

        var category = new Category
        {
            Name = name
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name
        };
    }

    public async Task<CategoryDto?> UpdateAsync(int id, string name)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return null;

        var exists = await _context.Categories.AnyAsync(c => c.Id != id && c.Name.ToLower() == name.ToLower());
        if (exists) throw new Exception("Category name already exists.");

        category.Name = name;
        await _context.SaveChangesAsync();

        return new CategoryDto { Id = category.Id, Name = category.Name };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return false;

        // Check if any topics are using this category
        var hasTopics = await _context.Topics.AnyAsync(t => t.Categoryid == id);
        if (hasTopics) return false;

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return true;
    }
}
