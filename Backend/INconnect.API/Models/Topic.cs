using System;
using System.Collections.Generic;
using NpgsqlTypes;

namespace INconnect.API.Models
{
    public class Topic
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }

        public NpgsqlTsVector? SearchVector { get; set; }

        public Category? Category { get; set; }
        public User? Author { get; set; }
        
        public ICollection<TopicTag> TopicTags { get; set; } = new List<TopicTag>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<Like> Likes { get; set; } = new List<Like>();
        public ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();
    }
}
