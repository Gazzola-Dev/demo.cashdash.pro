-- Migration file: 20240917151946_enable_realtime_for_invites.sql

-- First, drop the existing function if it exists
DROP FUNCTION IF EXISTS get_contract_by_milestone(text);

-- Create the improved function
CREATE OR REPLACE FUNCTION get_contract_by_milestone(p_milestone_id text)
RETURNS json AS $$
DECLARE
    v_contract json;
    v_members json;
    v_result json;
    v_project_id uuid;
BEGIN
    -- Get the project_id from the milestone
    SELECT project_id INTO v_project_id
    FROM milestones
    WHERE id = p_milestone_id::uuid;
    
    IF v_project_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get the contract based on the project_id
    SELECT 
        row_to_json(c) 
    INTO v_contract
    FROM contracts c
    WHERE c.project_id = v_project_id;
    
    IF v_contract IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get the contract members with their profile info
    SELECT 
        json_agg(
            json_build_object(
                'id', cm.user_id,
                'display_name', p.display_name,
                'email', p.email,
                'avatar_url', p.avatar_url,
                'role', cm.role,
                'hasApproved', (
                    SELECT approved FROM contract_approvals 
                    WHERE contract_id = cm.contract_id AND user_id = cm.user_id 
                    LIMIT 1
                )
            )
        ) 
    INTO v_members
    FROM contract_members cm
    JOIN profiles p ON cm.user_id = p.id
    WHERE cm.contract_id = (v_contract->>'id')::uuid;

    -- If no members were found, use an empty array
    IF v_members IS NULL THEN
        v_members := '[]'::json;
    END IF;

    -- Build the final result
    v_result := json_build_object(
        'contract', v_contract,
        'members', v_members
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to the function
COMMENT ON FUNCTION get_contract_by_milestone(text) IS 'Gets the contract associated with a milestone through the project_id';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_contract_by_milestone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_contract_by_milestone(text) TO service_role;