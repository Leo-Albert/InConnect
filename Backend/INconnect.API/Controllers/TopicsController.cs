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
        public async Task<ActionResult<IEnumerable<TopicDto>>> GetTopics([FromQuery] string? category, [FromQuery] string[]? tags, [FromQuery] Guid? userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var topics = await _topicService.GetFeedAsync(page, pageSize, category, tags?.ToList(), userId);
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

            var token = Request.Cookies["AuthToken"];
            if (string.IsNullOrEmpty(token))
            {
                token = Request.Headers.Authorization.FirstOrDefault()?.Split(" ").Last();
            }

            if (string.IsNullOrEmpty(token)) return Unauthorized("User must be logged in.");

            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            try
            {
                var jwtToken = handler.ReadJwtToken(token);
                var userIdStr = jwtToken.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (userIdStr == null || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized("Invalid token.");

                var createdTopic = await _topicService.CreateTopicAsync(createTopicDto, userId);
                return CreatedAtAction(nameof(GetTopic), new { id = createdTopic.Id }, createdTopic);
            }
            catch
            {
                return Unauthorized("Invalid token.");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TopicDto>> UpdateTopic(Guid id, [FromBody] CreateTopicDto updateTopicDto)
        {
            var token = Request.Cookies["AuthToken"];
            if (string.IsNullOrEmpty(token)) token = Request.Headers.Authorization.FirstOrDefault()?.Split(" ").Last();
            if (string.IsNullOrEmpty(token)) return Unauthorized();

            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            try
            {
                var jwtToken = handler.ReadJwtToken(token);
                var userIdStr = jwtToken.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (userIdStr == null || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

                var updatedTopic = await _topicService.UpdateTopicAsync(id, updateTopicDto, userId);
                if (updatedTopic == null) return Forbid(); // Or NotFound if not exists, but Forbid if wrong user

                return Ok(updatedTopic);
            }
            catch { return Unauthorized(); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTopic(Guid id)
        {
            var token = Request.Cookies["AuthToken"];
            if (string.IsNullOrEmpty(token)) token = Request.Headers.Authorization.FirstOrDefault()?.Split(" ").Last();
            if (string.IsNullOrEmpty(token)) return Unauthorized();

            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            try
            {
                var jwtToken = handler.ReadJwtToken(token);
                var userIdStr = jwtToken.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (userIdStr == null || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

                var success = await _topicService.DeleteTopicAsync(id, userId);
                if (!success) return Forbid();

                return NoContent();
            }
            catch { return Unauthorized(); }
        }
    }
}
