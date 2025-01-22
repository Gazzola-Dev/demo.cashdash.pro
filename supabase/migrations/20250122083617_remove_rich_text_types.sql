-- Add text description to tasks and fill with placeholder
ALTER TABLE tasks 
ADD COLUMN description_text TEXT;

UPDATE tasks 
SET description_text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.';

-- Add text description to subtasks and fill with placeholder
ALTER TABLE subtasks 
ADD COLUMN description_text TEXT;

UPDATE subtasks 
SET description_text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.';

-- Add text content to comments and fill with placeholder
ALTER TABLE comments 
ADD COLUMN content_text TEXT;

UPDATE comments 
SET content_text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.';

-- Drop old columns
ALTER TABLE tasks DROP COLUMN description;
ALTER TABLE tasks RENAME COLUMN description_text TO description;

ALTER TABLE subtasks DROP COLUMN description;
ALTER TABLE subtasks RENAME COLUMN description_text TO description;

ALTER TABLE comments DROP COLUMN content;
ALTER TABLE comments RENAME COLUMN content_text TO content;