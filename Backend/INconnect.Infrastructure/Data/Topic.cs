using System;
using System.Collections.Generic;
using NpgsqlTypes;

namespace INconnect.Infrastructure.Data;

public partial class Topic
{
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

    public string Content { get; set; } = null!;

    public int? Categoryid { get; set; }

    public Guid? Createdby { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public bool? Isdeleted { get; set; }

    public int? Likescount { get; set; }

    public int? Commentscount { get; set; }

    public NpgsqlTsVector? Searchvector { get; set; }

    public virtual ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();

    public virtual Category? Category { get; set; }

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual User? CreatedbyNavigation { get; set; }

    public virtual ICollection<Like> Likes { get; set; } = new List<Like>();

    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
