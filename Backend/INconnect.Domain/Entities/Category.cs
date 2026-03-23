using System.Collections.Generic;

namespace INconnect.Domain.Entities
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ICollection<Topic> Topics { get; set; } = new List<Topic>();
    }
}
