using INconnect.Application.DTOs;
using INconnect.Application.Interfaces;
using INconnect.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace INconnect.Infrastructure.Services;

public class TopicService : ITopicService
{
    private readonly AppDbContext _context;
    private readonly ITagService _tagService;

    public TopicService(AppDbContext context, ITagService tagService)
    {
        _context = context;
        _tagService = tagService;
    }

    public async Task<IEnumerable<TopicDto>> GetFeedAsync(int page, int pageSize, string? category = null, List<string>? tags = null, Guid? userId = null)
    {
        var skip = (page - 1) * pageSize;
        var query = _context.Topics.AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(t => t.Createdby == userId.Value);
        }

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(t => t.Category != null && t.Category.Name == category);
        }

        if (tags != null && tags.Any())
        {
            // AND filter: Topic must have ALL requested tags
            foreach (var tag in tags)
            {
                query = query.Where(t => t.Tags.Any(tg => tg.Name == tag));
            }
        }

        return await query
            .OrderByDescending(t => t.Createdat)
            .Skip(skip)
            .Take(pageSize)
            .Select(t => new TopicDto
            {
                Id = t.Id,
                Title = t.Title,
                Content = t.Content,
                LikesCount = t.Likescount,
                CommentsCount = t.Commentscount,
                CreatedAt = t.Createdat,
                AuthorName = t.CreatedbyNavigation != null ? t.CreatedbyNavigation.Name : null,
                AuthorId = t.Createdby ?? Guid.Empty,
                CategoryId = t.Categoryid,
                CategoryName = t.Category != null ? t.Category.Name : null,
                Tags = t.Tags.Select(tag => tag.Name).ToList()
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<TopicDto>> SearchAsync(string query, int page = 1, int pageSize = 10)
    {
        var q = query.ToLower();
        var skip = (page - 1) * pageSize;
        
        // Use a combination of Full Text Search (if available) and simple Contains for Tags
        var dbQuery = _context.Topics.AsQueryable();
        
        dbQuery = dbQuery.Where(t => 
            t.Title.ToLower().Contains(q) || 
            t.Content.ToLower().Contains(q) ||
            t.Tags.Any(tag => tag.Name.ToLower().Contains(q))
        );

        return await dbQuery
            .OrderByDescending(t => t.Createdat)
            .Skip(skip)
            .Take(pageSize)
            .Select(t => new TopicDto
            {
                Id = t.Id,
                Title = t.Title,
                Content = t.Content,
                LikesCount = t.Likescount,
                CommentsCount = t.Commentscount,
                CreatedAt = t.Createdat,
                AuthorName = t.CreatedbyNavigation != null ? t.CreatedbyNavigation.Name : null,
                AuthorId = t.Createdby ?? Guid.Empty,
                CategoryId = t.Categoryid,
                CategoryName = t.Category != null ? t.Category.Name : null,
                Tags = t.Tags.Select(tag => tag.Name).ToList()
            })
            .ToListAsync();
    }

    public async Task<TopicDto?> GetByIdAsync(Guid id)
    {
        return await _context.Topics
            .Where(t => t.Id == id)
            .Select(t => new TopicDto
            {
                Id = t.Id,
                Title = t.Title,
                Content = t.Content,
                LikesCount = t.Likescount,
                CommentsCount = t.Commentscount,
                CreatedAt = t.Createdat,
                AuthorName = t.CreatedbyNavigation != null ? t.CreatedbyNavigation.Name : null,
                AuthorId = t.Createdby ?? Guid.Empty,
                CategoryId = t.Categoryid,
                CategoryName = t.Category != null ? t.Category.Name : null,
                Tags = t.Tags.Select(tag => tag.Name).ToList()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<TopicDto> CreateTopicAsync(CreateTopicDto createTopicDto, Guid userId)
    {
        var topic = new INconnect.Infrastructure.Data.Topic
        {
            Id = Guid.NewGuid(),
            Title = createTopicDto.Title,
            Content = createTopicDto.Content,
            Categoryid = createTopicDto.CategoryId,
            Createdby = userId
        };

        _context.Topics.Add(topic);
        await _context.SaveChangesAsync();

        // Handle Tags
        if (createTopicDto.Tags != null && createTopicDto.Tags.Any())
        {
            var tagIds = await _tagService.GetOrCreateTagsAsync(createTopicDto.Tags);
            foreach (var tagId in tagIds)
            {
                var tag = await _context.Tags.FindAsync(tagId);
                if (tag != null) topic.Tags.Add(tag);
            }
            await _context.SaveChangesAsync();
        }

        return new TopicDto
        {
            Id = topic.Id,
            Title = topic.Title,
            Content = topic.Content,
            LikesCount = 0,
            CommentsCount = 0,
            CreatedAt = DateTime.UtcNow,
            AuthorId = userId,
            CategoryId = topic.Categoryid,
            Tags = createTopicDto.Tags ?? new List<string>()
        };
    }

    public async Task<TopicDto?> UpdateTopicAsync(Guid id, CreateTopicDto updateTopicDto, Guid userId)
    {
        var topic = await _context.Topics.FirstOrDefaultAsync(t => t.Id == id);
        if (topic == null || topic.Createdby != userId)
            return null;

        topic.Title = updateTopicDto.Title;
        topic.Content = updateTopicDto.Content;
        topic.Categoryid = updateTopicDto.CategoryId;
        topic.Updatedat = DateTime.UtcNow;

        // Sync Tags
        _context.Entry(topic).Collection(t => t.Tags).Load();
        topic.Tags.Clear();
        
        if (updateTopicDto.Tags != null && updateTopicDto.Tags.Any())
        {
            var tagIds = await _tagService.GetOrCreateTagsAsync(updateTopicDto.Tags);
            foreach (var tagId in tagIds)
            {
                var tag = await _context.Tags.FindAsync(tagId);
                if (tag != null) topic.Tags.Add(tag);
            }
        }

        await _context.SaveChangesAsync();

        return new TopicDto
        {
            Id = topic.Id,
            Title = topic.Title,
            Content = topic.Content,
            LikesCount = topic.Likescount,
            CommentsCount = topic.Commentscount,
            CreatedAt = topic.Createdat,
            AuthorId = userId,
            CategoryId = topic.Categoryid,
            Tags = updateTopicDto.Tags ?? new List<string>()
        };
    }

    public async Task<bool> DeleteTopicAsync(Guid id, Guid userId)
    {
        var topic = await _context.Topics.FirstOrDefaultAsync(t => t.Id == id);
        if (topic == null || topic.Createdby != userId)
            return false;

        _context.Topics.Remove(topic);
        await _context.SaveChangesAsync();
        return true;
    }
}
