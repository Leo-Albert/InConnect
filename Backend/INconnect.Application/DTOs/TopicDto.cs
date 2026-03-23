using System;
namespace INconnect.Application.DTOs;

public class TopicDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int? LikesCount { get; set; }
    public int? CommentsCount { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? AuthorName { get; set; }
    public string? CategoryName { get; set; }
}
