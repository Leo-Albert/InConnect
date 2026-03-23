using System;
using System.Collections.Generic;

namespace INconnect.API.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string Role { get; set; } = "Contributor";
        public DateTime CreatedAt { get; set; }
        
        public ICollection<Topic> Topics { get; set; } = new List<Topic>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<Like> Likes { get; set; } = new List<Like>();
        public ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();
    }
}
