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

    public TopicService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TopicDto>> GetFeedAsync(int page, int pageSize, string? category = null)
    {
        var skip = (page - 1) * pageSize;
        var query = _context.Topics.AsQueryable();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(t => t.Category != null && t.Category.Name == category);
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
                CategoryName = t.Category != null ? t.Category.Name : null
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<TopicDto>> SearchAsync(string query, int page, int pageSize)
    {
        var skip = (page - 1) * pageSize;
        var formattedQuery = string.Join(" | ", query.Split(' ', StringSplitOptions.RemoveEmptyEntries));

        return await _context.Topics
            .Where(t => t.Searchvector != null && t.Searchvector.Matches(EF.Functions.ToTsQuery("english", formattedQuery)))
            .OrderByDescending(t => t.Searchvector!.Rank(EF.Functions.ToTsQuery("english", formattedQuery)))
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
                CategoryName = t.Category != null ? t.Category.Name : null
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
                CategoryName = t.Category != null ? t.Category.Name : null
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

        return new TopicDto
        {
            Id = topic.Id,
            Title = topic.Title,
            Content = topic.Content,
            LikesCount = 0,
            CommentsCount = 0,
            CreatedAt = DateTime.UtcNow,
            AuthorId = userId
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

        await _context.SaveChangesAsync();

        return new TopicDto
        {
            Id = topic.Id,
            Title = topic.Title,
            Content = topic.Content,
            LikesCount = topic.Likescount,
            CommentsCount = topic.Commentscount,
            CreatedAt = topic.Createdat,
            AuthorId = userId
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
