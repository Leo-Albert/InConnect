using System;
using System.Collections.Generic;

namespace INconnect.Infrastructure.Data;

public partial class Comment
{
    public Guid Id { get; set; }

    public Guid? Topicid { get; set; }

    public Guid? Userid { get; set; }

    public Guid? Parentcommentid { get; set; }

    public string Content { get; set; } = null!;

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public bool? Isdeleted { get; set; }

    public virtual ICollection<Comment> InverseParentcomment { get; set; } = new List<Comment>();

    public virtual Comment? Parentcomment { get; set; }

    public virtual Topic? Topic { get; set; }

    public virtual User? User { get; set; }
}
