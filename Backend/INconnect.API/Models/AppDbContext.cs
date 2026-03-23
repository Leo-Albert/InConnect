using Microsoft.EntityFrameworkCore;

namespace INconnect.API.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Topic> Topics { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<TopicTag> TopicTags { get; set; }
        public DbSet<Like> Likes { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Bookmark> Bookmarks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Users
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Categories
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Name).IsUnique();
            });

            // Tags
            modelBuilder.Entity<Tag>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Name).IsUnique();
            });

            // Topics
            modelBuilder.Entity<Topic>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.SearchVector)
                      .HasComputedColumnSql("to_tsvector('english', \"Title\" || ' ' || \"Content\")", stored: true);
                
                entity.HasIndex(e => e.CategoryId);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.SearchVector).HasMethod("GIN");

                entity.HasOne(d => d.Category)
                      .WithMany(p => p.Topics)
                      .HasForeignKey(d => d.CategoryId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(d => d.Author)
                      .WithMany(p => p.Topics)
                      .HasForeignKey(d => d.CreatedBy)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // TopicTags
            modelBuilder.Entity<TopicTag>(entity =>
            {
                entity.HasKey(e => new { e.TopicId, e.TagId });

                entity.HasOne(d => d.Topic)
                      .WithMany(p => p.TopicTags)
                      .HasForeignKey(d => d.TopicId);

                entity.HasOne(d => d.Tag)
                      .WithMany(p => p.TopicTags)
                      .HasForeignKey(d => d.TagId);
            });

            // Likes
            modelBuilder.Entity<Like>(entity =>
            {
                entity.HasKey(e => new { e.TopicId, e.UserId });
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.Topic)
                      .WithMany(p => p.Likes)
                      .HasForeignKey(d => d.TopicId);

                entity.HasOne(d => d.User)
                      .WithMany(p => p.Likes)
                      .HasForeignKey(d => d.UserId);
            });

            // Comments
            modelBuilder.Entity<Comment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.Topic)
                      .WithMany(p => p.Comments)
                      .HasForeignKey(d => d.TopicId);

                entity.HasOne(d => d.User)
                      .WithMany(p => p.Comments)
                      .HasForeignKey(d => d.UserId);

                entity.HasOne(d => d.ParentComment)
                      .WithMany(p => p.Replies)
                      .HasForeignKey(d => d.ParentCommentId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Bookmarks
            modelBuilder.Entity<Bookmark>(entity =>
            {
                entity.HasKey(e => new { e.UserId, e.TopicId });
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.User)
                      .WithMany(p => p.Bookmarks)
                      .HasForeignKey(d => d.UserId);

                entity.HasOne(d => d.Topic)
                      .WithMany(p => p.Bookmarks)
                      .HasForeignKey(d => d.TopicId);
            });
        }
    }
}
