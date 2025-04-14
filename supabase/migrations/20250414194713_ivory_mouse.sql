/*
  # Create portfolio views table

  1. New Tables
    - `portfolio_views`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz, when the view occurred)
      - `created_at` (timestamptz, when the record was created)

  2. Security
    - Enable RLS on `portfolio_views` table
    - Add policy for authenticated users to read all views
    - Add policy for authenticated users to insert new views
*/

CREATE TABLE IF NOT EXISTS portfolio_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE portfolio_views ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all views
CREATE POLICY "Allow authenticated users to read all views"
  ON portfolio_views
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert new views
CREATE POLICY "Allow authenticated users to insert views"
  ON portfolio_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);