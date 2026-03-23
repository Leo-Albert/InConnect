using INconnect.Application.DTOs;
using INconnect.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace INconnect.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TopicsController : ControllerBase
    {
        private readonly ITopicService _topicService;

        public TopicsController(ITopicService topicService)
        {
            _topicService = topicService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TopicDto>>> GetTopics([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var topics = await _topicService.GetFeedAsync(page, pageSize);
            return Ok(topics);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<TopicDto>>> Search([FromQuery] string query, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest("Query cannot be empty.");

            var topics = await _topicService.SearchAsync(query, page, pageSize);
            return Ok(topics);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TopicDto>> GetTopic(Guid id)
        {
            var topic = await _topicService.GetByIdAsync(id);
            if (topic == null)
            {
                return NotFound();
            }

            return Ok(topic);
        }

        [HttpPost]
        public async Task<ActionResult<TopicDto>> CreateTopic([FromBody] CreateTopicDto createTopicDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var createdTopic = await _topicService.CreateTopicAsync(createTopicDto);
            return CreatedAtAction(nameof(GetTopic), new { id = createdTopic.Id }, createdTopic);
        }
    }
}
