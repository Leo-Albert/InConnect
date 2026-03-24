-- Execute this script in your PostgreSQL database to add the new auth columns

ALTER TABLE users 
ADD COLUMN googleid VARCHAR(255) NULL,
ADD COLUMN passwordhash VARCHAR(255) NULL,
ADD COLUMN profileimage VARCHAR(255) NULL;
