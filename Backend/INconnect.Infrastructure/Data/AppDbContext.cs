using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace INconnect.Infrastructure.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Bookmark> Bookmarks { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Comment> Comments { get; set; }

    public virtual DbSet<Like> Likes { get; set; }

    public virtual DbSet<Tag> Tags { get; set; }

    public virtual DbSet<Topic> Topics { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseNpgsql("Name=ConnectionStrings:DefaultConnection");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Bookmark>(entity =>
        {
            entity.HasKey(e => new { e.Userid, e.Topicid }).HasName("bookmarks_pkey");

            entity.ToTable("bookmarks");

            entity.Property(e => e.Userid).HasColumnName("userid");
            entity.Property(e => e.Topicid).HasColumnName("topicid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("createdat");

            entity.HasOne(d => d.Topic).WithMany(p => p.Bookmarks)
                .HasForeignKey(d => d.Topicid)
                .HasConstraintName("bookmarks_topicid_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.Bookmarks)
                .HasForeignKey(d => d.Userid)
                .HasConstraintName("bookmarks_userid_fkey");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("categories_pkey");

            entity.ToTable("categories");

            entity.HasIndex(e => e.Name, "categories_name_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("comments_pkey");

            entity.ToTable("comments");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("createdat");
            entity.Property(e => e.Isdeleted)
                .HasDefaultValue(false)
                .HasColumnName("isdeleted");
            entity.Property(e => e.Parentcommentid).HasColumnName("parentcommentid");
            entity.Property(e => e.Topicid).HasColumnName("topicid");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updatedat");
            entity.Property(e => e.Userid).HasColumnName("userid");

            entity.HasOne(d => d.Parentcomment).WithMany(p => p.InverseParentcomment)
                .HasForeignKey(d => d.Parentcommentid)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("comments_parentcommentid_fkey");

            entity.HasOne(d => d.Topic).WithMany(p => p.Comments)
                .HasForeignKey(d => d.Topicid)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("comments_topicid_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.Comments)
                .HasForeignKey(d => d.Userid)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("comments_userid_fkey");
        });

        modelBuilder.Entity<Like>(entity =>
        {
            entity.HasKey(e => new { e.Topicid, e.Userid }).HasName("likes_pkey");

            entity.ToTable("likes");

            entity.Property(e => e.Topicid).HasColumnName("topicid");
            entity.Property(e => e.Userid).HasColumnName("userid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("createdat");

            entity.HasOne(d => d.Topic).WithMany(p => p.Likes)
                .HasForeignKey(d => d.Topicid)
                .HasConstraintName("likes_topicid_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.Likes)
                .HasForeignKey(d => d.Userid)
                .HasConstraintName("likes_userid_fkey");
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tags_pkey");

            entity.ToTable("tags");

            entity.HasIndex(e => e.Name, "tags_name_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Topic>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("topics_pkey");

            entity.ToTable("topics");

            entity.HasIndex(e => e.Categoryid, "idx_topics_categoryid");

            entity.HasIndex(e => e.Createdat, "idx_topics_createdat");

            entity.HasIndex(e => e.Searchvector, "idx_topics_searchvector").HasMethod("gin");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.Categoryid).HasColumnName("categoryid");
            entity.Property(e => e.Commentscount)
                .HasDefaultValue(0)
                .HasColumnName("commentscount");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("createdat");
            entity.Property(e => e.Createdby).HasColumnName("createdby");
            entity.Property(e => e.Isdeleted)
                .HasDefaultValue(false)
                .HasColumnName("isdeleted");
            entity.Property(e => e.Likescount)
                .HasDefaultValue(0)
                .HasColumnName("likescount");
            entity.Property(e => e.Searchvector)
                .HasComputedColumnSql("to_tsvector('english'::regconfig, (((title)::text || ' '::text) || content))", true)
                .HasColumnName("searchvector");
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updatedat");

            entity.HasOne(d => d.Category).WithMany(p => p.Topics)
                .HasForeignKey(d => d.Categoryid)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("topics_categoryid_fkey");

            entity.HasOne(d => d.CreatedbyNavigation).WithMany(p => p.Topics)
                .HasForeignKey(d => d.Createdby)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("topics_createdby_fkey");

            entity.HasMany(d => d.Tags).WithMany(p => p.Topics)
                .UsingEntity<Dictionary<string, object>>(
                    "Topictag",
                    r => r.HasOne<Tag>().WithMany()
                        .HasForeignKey("Tagid")
                        .HasConstraintName("topictags_tagid_fkey"),
                    l => l.HasOne<Topic>().WithMany()
                        .HasForeignKey("Topicid")
                        .HasConstraintName("topictags_topicid_fkey"),
                    j =>
                    {
                        j.HasKey("Topicid", "Tagid").HasName("topictags_pkey");
                        j.ToTable("topictags");
                        j.IndexerProperty<Guid>("Topicid").HasColumnName("topicid");
                        j.IndexerProperty<int>("Tagid").HasColumnName("tagid");
                    });
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("users_pkey");

            entity.ToTable("users");

            entity.HasIndex(e => e.Email, "users_email_key").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.Bio).HasColumnName("bio");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("createdat");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.Passwordhash)
                .HasMaxLength(255)
                .HasColumnName("passwordhash");
            entity.Property(e => e.Profileimage)
                .HasMaxLength(255)
                .HasColumnName("profileimage");
            entity.Property(e => e.Role)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Contributor'::character varying")
                .HasColumnName("role");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
