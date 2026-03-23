using System;

namespace INconnect.Domain.Entities
{
    public class Bookmark
    {
        public Guid UserId { get; set; }
        public Guid TopicId { get; set; }
        public DateTime CreatedAt { get; set; }

        public User? User { get; set; }
        public Topic? Topic { get; set; }
    }
}
