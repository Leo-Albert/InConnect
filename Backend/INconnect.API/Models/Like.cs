using System;

namespace INconnect.API.Models
{
    public class Like
    {
        public Guid TopicId { get; set; }
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; }

        public Topic? Topic { get; set; }
        public User? User { get; set; }
    }
}
