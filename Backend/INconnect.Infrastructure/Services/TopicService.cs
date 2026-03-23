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

    public async Task<IEnumerable<TopicDto>> GetFeedAsync(int page, int pageSize)
    {
        var skip = (page - 1) * pageSize;
        return await _context.Topics
            .OrderByDescending(t => ((t.Likescount ?? 0) * 2 + (t.Commentscount ?? 0)))
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
                CategoryName = t.Category != null ? t.Category.Name : null
            })
            .FirstOrDefaultAsync();
    }

    public async Task<TopicDto> CreateTopicAsync(CreateTopicDto createTopicDto)
    {
        var topic = new INconnect.Infrastructure.Data.Topic
        {
            Id = Guid.NewGuid(),
            Title = createTopicDto.Title,
            Content = createTopicDto.Content,
            Categoryid = createTopicDto.CategoryId
        };

        // Temporarily grab the first registered user to be the Author of this Mock Post until JWT Auth connects
        var firstUser = await _context.Users.FirstOrDefaultAsync();
        if (firstUser != null) 
        {
            topic.Createdby = firstUser.Id;
        }

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
            AuthorName = firstUser?.Name
        };
    }
}
