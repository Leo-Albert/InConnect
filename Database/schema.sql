dotnet ef dbcontext scaffold "Name=ConnectionStrings:DefaultConnection" Npgsql.EntityFrameworkCore.PostgreSQL --project ../INconnect.Infrastructure --startup-project . --output-dir Data --context AppDbContext --force

-- Create a function to auto-update UpdatedAt column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.UpdatedAt = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Users Table
CREATE TABLE Users (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Bio TEXT,
    Role VARCHAR(50) DEFAULT 'Contributor',
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE Categories (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(100) UNIQUE NOT NULL
);

-- Insert predefined categories
INSERT INTO Categories (Name) VALUES 
('Backend'), 
('Frontend'), 
('Database'), 
('System Design'), 
('DevOps'), 
('HR Behavioral');

-- 3. Tags Table
CREATE TABLE Tags (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(100) UNIQUE NOT NULL
);

-- 4. Topics Table
CREATE TABLE Topics (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Title VARCHAR(255) NOT NULL,
    Content TEXT NOT NULL,
    CategoryId INT REFERENCES Categories(Id) ON DELETE SET NULL,
    CreatedBy UUID REFERENCES Users(Id) ON DELETE CASCADE,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    IsDeleted BOOLEAN DEFAULT FALSE,
    LikesCount INT DEFAULT 0,
    CommentsCount INT DEFAULT 0,
    SearchVector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', Title || ' ' || Content)) STORED
);

-- Topics Indexes
CREATE INDEX idx_topics_createdat ON Topics(CreatedAt);
CREATE INDEX idx_topics_categoryid ON Topics(CategoryId);
CREATE INDEX idx_topics_searchvector ON Topics USING GIN(SearchVector);

-- Trigger for auto-updating Topics.UpdatedAt
CREATE TRIGGER update_topics_modtime
    BEFORE UPDATE ON Topics
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- 5. TopicTags (Many-to-Many)
CREATE TABLE TopicTags (
    TopicId UUID REFERENCES Topics(Id) ON DELETE CASCADE,
    TagId INT REFERENCES Tags(Id) ON DELETE CASCADE,
    PRIMARY KEY (TopicId, TagId)
);

-- 6. Likes Table
CREATE TABLE Likes (
    TopicId UUID REFERENCES Topics(Id) ON DELETE CASCADE,
    UserId UUID REFERENCES Users(Id) ON DELETE CASCADE,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (TopicId, UserId)
);

-- 7. Comments Table
CREATE TABLE Comments (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    TopicId UUID REFERENCES Topics(Id) ON DELETE CASCADE,
    UserId UUID REFERENCES Users(Id) ON DELETE CASCADE,
    ParentCommentId UUID REFERENCES Comments(Id) ON DELETE CASCADE,
    Content TEXT NOT NULL,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    IsDeleted BOOLEAN DEFAULT FALSE
);

-- Trigger for auto-updating Comments.UpdatedAt
CREATE TRIGGER update_comments_modtime
    BEFORE UPDATE ON Comments
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- 8. Bookmarks Table
CREATE TABLE Bookmarks (
    UserId UUID REFERENCES Users(Id) ON DELETE CASCADE,
    TopicId UUID REFERENCES Topics(Id) ON DELETE CASCADE,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserId, TopicId)
);
