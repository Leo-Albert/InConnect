using INconnect.Domain.Entities;
using INconnect.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace INconnect.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TopicsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TopicsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/topics
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Topic>>> GetTopics([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var skip = (page - 1) * pageSize;
            
            // Feed algorithm
            var topics = await _context.Topics
                .Include(t => t.Category)
                .Include(t => t.TopicTags).ThenInclude(tt => tt.Tag)
                .OrderByDescending(t => (t.LikesCount * 2 + t.CommentsCount))
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            return Ok(topics);
        }

        // GET: api/topics/search
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Topic>>> Search([FromQuery] string query, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest("Query cannot be empty.");

            var skip = (page - 1) * pageSize;
            
            // Format query for tsquery parsing (replacing spaces with OR | )
            var formattedQuery = string.Join(" | ", query.Split(' ', StringSplitOptions.RemoveEmptyEntries));

            var topics = await _context.Topics
                .Include(t => t.Category)
                .Where(t => t.SearchVector != null && t.SearchVector.Matches(EF.Functions.ToTsQuery("english", formattedQuery)))
                .OrderByDescending(t => t.SearchVector!.Rank(EF.Functions.ToTsQuery("english", formattedQuery)))
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            return Ok(topics);
        }

        // GET: api/topics/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Topic>> GetTopic(Guid id)
        {
            var topic = await _context.Topics
                .Include(t => t.Category)
                .Include(t => t.Comments)
                .Include(t => t.TopicTags)
                .ThenInclude(tt => tt.Tag)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (topic == null)
            {
                return NotFound();
            }

            return Ok(topic);
        }
    }
}
