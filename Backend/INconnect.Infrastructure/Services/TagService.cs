using INconnect.Application.DTOs;
using INconnect.Application.Interfaces;
using INconnect.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace INconnect.Infrastructure.Services;

public class TagService : ITagService
{
    private readonly AppDbContext _context;

    public TagService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TagDto>> GetAllAsync()
    {
        return await _context.Tags
            .Select(t => new TagDto 
            { 
                Id = t.Id, 
                Name = t.Name,
                TopicCount = t.Topics.Count() 
            })
            .OrderByDescending(t => t.TopicCount)
            .ToListAsync();
    }

    public async Task<List<int>> GetOrCreateTagsAsync(List<string> tagNames)
    {
        if (tagNames == null || !tagNames.Any()) return new List<int>();

        var existingTags = await _context.Tags
            .Where(t => tagNames.Contains(t.Name))
            .ToListAsync();

        var existingNames = existingTags.Select(t => t.Name).ToList();
        var newNames = tagNames.Except(existingNames).ToList();

        if (newNames.Any())
        {
            var newTags = newNames.Select(name => new Tag { Name = name }).ToList();
            _context.Tags.AddRange(newTags);
            await _context.SaveChangesAsync();
            existingTags.AddRange(newTags);
        }

        return existingTags.Select(t => t.Id).ToList();
    }
    public async Task<bool> UpdateTagAsync(int id, string newName)
    {
        var tag = await _context.Tags.FindAsync(id);
        if (tag == null) return false;

        // Check uniqueness
        var exists = await _context.Tags.AnyAsync(t => t.Id != id && t.Name.ToLower() == newName.ToLower());
        if (exists) throw new Exception("Tag name already exists.");

        tag.Name = newName;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteTagAsync(int id)
    {
        var tag = await _context.Tags.Include(t => t.Topics).FirstOrDefaultAsync(t => t.Id == id);
        if (tag == null) return false;

        if (tag.Topics.Any())
            throw new Exception("Cannot delete tag that is associated with topics.");

        _context.Tags.Remove(tag);
        await _context.SaveChangesAsync();
        return true;
    }
}
