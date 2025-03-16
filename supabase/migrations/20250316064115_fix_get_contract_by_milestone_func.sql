-- Migration to fix the contract_members_role_check constraint violation
-- First, let's create the contract member role type if it doesn't exist yet
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_member_role') THEN
        CREATE TYPE public.contract_member_role AS ENUM (
            'admin',
            'project_manager',
            'developer',
            'client'
        );
    END IF;
END$$;

-- Check if contract_members table exists and if it has the role column
DO $$
BEGIN
    -- Drop the check constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'contract_members_role_check' 
        AND conrelid = 'public.contract_members'::regclass
    ) THEN
        ALTER TABLE public.contract_members DROP CONSTRAINT contract_members_role_check;
    END IF;
    
    -- Update the role column to use the proper type or fix existing values
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contract_members' 
        AND column_name = 'role'
    ) THEN
        -- First update existing 'member' values to 'developer'
        UPDATE public.contract_members 
        SET role = 'developer' 
        WHERE role = 'member';
        
        -- Set a default value for any NULL roles
        UPDATE public.contract_members 
        SET role = 'developer' 
        WHERE role IS NULL;
        
        -- Alter the column type to use the enum
        ALTER TABLE public.contract_members 
        ALTER COLUMN role TYPE contract_member_role 
        USING role::contract_member_role;
        
        -- Make it not null
        ALTER TABLE public.contract_members 
        ALTER COLUMN role SET NOT NULL;
    END IF;
END$$;

-- Update or create the add_contract_member function with the proper types
CREATE OR REPLACE FUNCTION public.add_contract_member(
    p_contract_id uuid,
    p_user_id uuid,
    p_role text DEFAULT 'developer'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_result json;
    v_valid_role contract_member_role;
BEGIN
    -- Check if the contract exists
    IF NOT EXISTS (SELECT 1 FROM contracts WHERE id = p_contract_id) THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;
    
    -- Validate and convert the role
    BEGIN
        v_valid_role := p_role::contract_member_role;
    EXCEPTION WHEN others THEN
        -- Default to developer if invalid role provided
        v_valid_role := 'developer'::contract_member_role;
    END;
    
    -- Insert new contract member
    INSERT INTO contract_members (contract_id, user_id, role)
    VALUES (p_contract_id, p_user_id, v_valid_role)
    ON CONFLICT (contract_id, user_id) DO UPDATE
    SET role = v_valid_role;
    
    -- Return success response
    SELECT json_build_object(
        'success', true,
        'message', 'Member added to contract'
    ) INTO v_result;
    
    RETURN v_result;
END;
$function$;

-- Fix the auto_populate_contract_members function to use proper role types
CREATE OR REPLACE FUNCTION public.auto_populate_contract_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Get the project ID of the new contract
  v_project_id := NEW.project_id;
  
  -- Insert project managers as contract members with appropriate roles
  INSERT INTO contract_members (
    contract_id,
    user_id,
    role,
    joined_at
  )
  SELECT 
    NEW.id,
    pm.user_id,
    CASE 
      WHEN pm.role = 'owner' THEN 'admin'::contract_member_role
      WHEN pm.role = 'admin' THEN 'project_manager'::contract_member_role
      ELSE 'developer'::contract_member_role 
    END,
    NOW()
  FROM project_members pm
  WHERE pm.project_id = v_project_id
  AND pm.role IN ('owner', 'admin', 'pm') -- Only include project managers and admins
  ON CONFLICT (contract_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Fix the populate_contract_members function to use proper role types
CREATE OR REPLACE FUNCTION public.populate_contract_members(p_contract_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Get the project ID of the contract
  SELECT project_id INTO v_project_id
  FROM contracts
  WHERE id = p_contract_id;
  
  -- Insert project members as contract members with appropriate roles
  INSERT INTO contract_members (
    contract_id,
    user_id,
    role,
    joined_at
  )
  SELECT 
    p_contract_id, 
    pm.user_id, 
    CASE 
      WHEN pm.role = 'owner' THEN 'admin'::contract_member_role
      WHEN pm.role = 'admin' THEN 'project_manager'::contract_member_role
      ELSE 'developer'::contract_member_role 
    END,
    NOW()
  FROM project_members pm
  WHERE pm.project_id = v_project_id
  ON CONFLICT (contract_id, user_id) DO NOTHING;
END;
$$;

-- Fix or create the toggleContractMemberAction function that's failing
CREATE OR REPLACE FUNCTION public.toggleContractMemberAction(
    p_contract_id uuid,
    p_user_id uuid,
    p_role text DEFAULT 'developer'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_result json;
    v_valid_role contract_member_role;
    v_exists boolean;
BEGIN
    -- Check if the contract exists
    IF NOT EXISTS (SELECT 1 FROM contracts WHERE id = p_contract_id) THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;
    
    -- Check if the member already exists
    SELECT EXISTS(
        SELECT 1 FROM contract_members 
        WHERE contract_id = p_contract_id AND user_id = p_user_id
    ) INTO v_exists;
    
    -- Validate and convert the role
    BEGIN
        v_valid_role := p_role::contract_member_role;
    EXCEPTION WHEN others THEN
        -- Default to developer if invalid role provided
        v_valid_role := 'developer'::contract_member_role;
    END;
    
    IF v_exists THEN
        -- Remove the member
        DELETE FROM contract_members
        WHERE contract_id = p_contract_id AND user_id = p_user_id;
        
        SELECT json_build_object(
            'success', true,
            'message', 'Member removed from contract',
            'action', 'removed'
        ) INTO v_result;
    ELSE
        -- Add the member
        INSERT INTO contract_members (contract_id, user_id, role, joined_at)
        VALUES (p_contract_id, p_user_id, v_valid_role, NOW());
        
        SELECT json_build_object(
            'success', true,
            'message', 'Member added to contract',
            'action', 'added'
        ) INTO v_result;
    END IF;
    
    RETURN v_result;
END;
$function$;

-- Ensure we have the unique constraint on contract_members
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'contract_members_contract_id_user_id_key'
        AND conrelid = 'public.contract_members'::regclass
    ) THEN
        ALTER TABLE contract_members 
        ADD CONSTRAINT contract_members_contract_id_user_id_key 
        UNIQUE (contract_id, user_id);
    END IF;
EXCEPTION
    WHEN others THEN
        -- Constraint might already exist or table might have a different structure
        NULL;
END$$;

-- Enable row-level security on the contract_members table
ALTER TABLE IF EXISTS contract_members ENABLE ROW LEVEL SECURITY;

-- Create or replace policies for contract_members table
DROP POLICY IF EXISTS "Contract members are viewable by project members" ON contract_members;
CREATE POLICY "Contract members are viewable by project members" ON contract_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM contracts c
            JOIN project_members pm ON c.project_id = pm.project_id
            WHERE c.id = contract_members.contract_id
            AND pm.user_id = auth.uid()
        )
    );

-- Update the get_contract_by_id function to handle UUID properly
CREATE OR REPLACE FUNCTION public.get_contract_by_id(
    p_contract_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_result json;
BEGIN
    WITH contract_data AS (
        SELECT c.*
        FROM contracts c
        WHERE c.id = p_contract_id
    ),
    member_data AS (
        SELECT 
            cm.user_id AS id,
            p.display_name,
            p.email,
            p.avatar_url,
            cm.role::text, -- Convert enum to text for JSON
            COALESCE(ca.approved, false) AS "hasApproved"
        FROM contract_members cm
        JOIN profiles p ON cm.user_id = p.id
        LEFT JOIN contract_approvals ca ON 
            ca.contract_id = cm.contract_id AND 
            ca.user_id = cm.user_id AND 
            ca.approval_type = 'payment'
        WHERE cm.contract_id = p_contract_id
    )
    SELECT json_build_object(
        'contract', (SELECT row_to_json(contract_data) FROM contract_data),
        'members', (SELECT json_agg(row_to_json(member_data)) FROM member_data)
    ) INTO v_result;
    
    RETURN v_result;
END;
$function$;

-- Grant appropriate permissions
GRANT ALL ON TYPE public.contract_member_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggleContractMemberAction(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_contract_member(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.populate_contract_members(uuid) TO authenticated;