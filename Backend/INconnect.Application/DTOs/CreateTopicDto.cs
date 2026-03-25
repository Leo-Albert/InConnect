using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace INconnect.Application.DTOs
{
    public class CreateTopicDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = null!;

        [Required]
        public string Content { get; set; } = null!;

        public int? CategoryId { get; set; }
        public List<string>? Tags { get; set; } = new();
    }
}
