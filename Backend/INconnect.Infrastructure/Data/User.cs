using System;
using System.Collections.Generic;

namespace INconnect.Infrastructure.Data;

public partial class User
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Bio { get; set; }

    public string? Role { get; set; }

    public DateTime? Createdat { get; set; }

    public string? Passwordhash { get; set; }
    public string? Resetpasswordtoken { get; set; }
    public DateTime? Resettokenexpiry { get; set; }
    public string? Profileimage { get; set; }

    public virtual ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual ICollection<Like> Likes { get; set; } = new List<Like>();

    public virtual ICollection<Topic> Topics { get; set; } = new List<Topic>();
}
