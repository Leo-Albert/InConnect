using INconnect.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace INconnect.Application.Interfaces;

public interface ITopicService
{
    Task<IEnumerable<TopicDto>> GetFeedAsync(int page, int pageSize, string? category = null, List<string>? tags = null, Guid? userId = null);
    Task<IEnumerable<TopicDto>> SearchAsync(string query, int page, int pageSize);
    Task<TopicDto?> GetByIdAsync(Guid id);
    Task<TopicDto> CreateTopicAsync(CreateTopicDto createTopicDto, Guid userId);
    Task<TopicDto?> UpdateTopicAsync(Guid id, CreateTopicDto updateTopicDto, Guid userId);
    Task<bool> DeleteTopicAsync(Guid id, Guid userId);
}
