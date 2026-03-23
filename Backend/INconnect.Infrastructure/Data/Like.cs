using System;
using System.Collections.Generic;

namespace INconnect.Infrastructure.Data;

public partial class Like
{
    public Guid Topicid { get; set; }

    public Guid Userid { get; set; }

    public DateTime? Createdat { get; set; }

    public virtual Topic Topic { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
